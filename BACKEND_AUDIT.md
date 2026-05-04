# Backend Audit — Bug Fixes & Reliability Improvements

> Reviewed: 2026-05-04 | Branch: `feature/subscriptions`
> Scope: server + client API layer + shared types

---

## Priority Legend
- 🔴 **Critical** — data loss, security breach, or runtime crash
- 🟠 **High** — wrong behavior that users will hit regularly
- 🟡 **Medium** — reliability / consistency problems
- 🟢 **Low** — code quality, dead code, minor inconsistencies

---

## 🔴 Critical

### C-1 — No per-user data isolation (tasks, tags, stats)
**Files:** `taskController.ts`, `tagController.ts`, `statsController.ts`

`requireAuth` is applied so `req.userId` is set, but **every query ignores it**. All users share every task, tag, and stat. User A can read, edit, and permanently delete User B's tasks.

**Fix:**
- Add `userId` field to `Task` and `Tag` models.
- In every controller query, add `{ userId: req.userId }` to the filter.
- In `createTask` and `createTag`, set `userId: req.userId` on creation.
- All stats aggregations need `{ userId: req.userId }` in `$match`.

---

### C-2 — FocusSession has no `userId`; `startSession` trashes every user's session
**Files:** `models/FocusSession.ts`, `focusController.ts`

`FocusSession` has no `userId`. Every `startSession` call runs:
```ts
FocusSession.updateMany({ status: 'active' }, { status: 'abandoned', ... })
```
This abandons **all active sessions for all users**. `getActiveSession` also returns the first global active session, not the caller's.

**Fix:**
- Add `userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }` to `FocusSession`.
- Add `{ userId: 1 }` index.
- Filter all focus queries by `{ userId: req.userId }`.
- `startSession` abandonment must include `userId` in the filter.

---

### C-3 — Rate limiter is disabled
**File:** `server/src/index.ts` line 48

```ts
// app.use('/api', limiter);
```
The limiter is defined but commented out. The API has no protection against brute-force or abuse.

**Fix:** Uncomment `app.use('/api', limiter)`. Apply a stricter sub-limit to auth routes specifically (e.g., 10 req/15min on `/api/auth`).

---

### C-4 — ReDoS vulnerability in task search
**File:** `taskController.ts` line 50

```ts
filter.title = { $regex: search, $options: 'i' };
```
User-supplied input is used directly as a regex. An attacker can send catastrophic backtracking patterns causing CPU exhaustion.

**Fix:** Escape regex metacharacters before building the query, or switch to a MongoDB text index with `$text: { $search: ... }`.
```ts
const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
filter.title = { $regex: escaped, $options: 'i' };
```

---

### C-5 — `restoreTask` doesn't clear `deletedAt`
**Files:** `useTasks.tsx`, `taskController.ts`

`restoreTask` in the client calls `updateTask(id, { isDeleted: false })`. The server sets `isDeleted: false` but never clears `deletedAt`. Restored tasks keep a stale `deletedAt` timestamp, corrupting any query that relies on it (e.g., trash TTL cleanup, stats).

**Fix:** In `updateTask` controller, when `isDeleted` is explicitly set to `false`, also set `updateData.deletedAt = null`.

---

### C-6 — `updateTaskSchema` lets callers set `isDeleted: true` without setting `deletedAt`
**File:** `server/src/types/task.ts`

The schema allows `isDeleted: z.boolean().optional()`. Any `PATCH /api/tasks/:id` with `{ isDeleted: true }` in the body sets `isDeleted: true` without touching `deletedAt`. Trash view (`isDeleted: true`) then shows these tasks, but `deletedAt` is `null`, breaking any sort/TTL logic.

**Fix:** Remove `isDeleted` from `updateTaskSchema`. Soft-delete must only happen through `DELETE /api/tasks/:id` (which correctly sets both fields). For restoration, add a dedicated `PATCH /api/tasks/:id/restore` endpoint that sets `{ isDeleted: false, deletedAt: null }`.

---

### C-7 — Tag rename and delete cascade is not atomic
**File:** `tagController.ts`

Rename sequence:
1. Check for name conflict
2. `Task.updateMany(...)` — cascade rename to tasks
3. `tag.save()` — save new name on the Tag

Delete sequence:
1. `Task.updateMany({ $pull: ... })` — remove from tasks
2. `Tag.findByIdAndDelete(...)` — delete the tag

If the server crashes between steps 2 and 3 in either case, data is left in a corrupted half-updated state (tasks with old tag name that no longer exists, or tasks still referencing a deleted tag).

**Fix:** Wrap both operations in a MongoDB session + transaction:
```ts
const sess = await mongoose.startSession();
await sess.withTransaction(async () => { ... });
```
Requires a replica set (MongoDB Atlas already provides this).

---

## 🟠 High

### H-1 — ESM import missing `.js` extension in subscription files (runtime crash)
**Files:** `subscriptionRoutes.ts`, `subscriptionController.ts`

```ts
import { Subscription } from '../models/Subscription';   // wrong
import { subscriptionSchema } from '../types/subscription'; // wrong
import { requireAuth } from '../middleware/requireAuth';   // wrong
```
The entire project uses `"type": "module"` with `.js` extensions for all local imports. These three files omit `.js`, which causes Node.js ESM resolution to fail at runtime with `ERR_MODULE_NOT_FOUND`. The subscription feature is completely broken.

**Fix:** Add `.js` to every local import in both files.

---

### H-2 — No ObjectId validation on route params → Mongoose CastError returns 500
**Files:** All controllers using `req.params.id`, `req.params.taskId`, `req.params.sessionId`

Sending `GET /api/tasks/not-a-valid-id` causes Mongoose to throw a `CastError: Cast to ObjectId failed`. The global error handler doesn't handle `CastError` and returns `{ success: false, error: 'Cast to ObjectId failed...' }` with status 500 instead of 400.

**Fix:** Add an ObjectId validation helper and use it at the top of each handler:
```ts
import { Types } from 'mongoose';
if (!Types.ObjectId.isValid(req.params.id)) {
  res.status(400).json({ success: false, error: 'Invalid ID format' });
  return;
}
```
Or handle it centrally in `errorHandler`:
```ts
if (err.name === 'CastError') {
  res.status(400).json({ success: false, error: 'Invalid ID format' });
  return;
}
```

---

### H-3 — `errorHandler` doesn't handle Mongoose errors — all return 500
**File:** `server/src/middleware/errorHandler.ts`

The following Mongoose errors are not caught specifically and all fall through as 500:
- `CastError` (invalid ObjectId) → should be 400
- `ValidationError` (schema validation failure) → should be 400
- Duplicate key error (code 11000) → should be 409

**Fix:**
```ts
export const errorHandler = (err: any, ...) => {
  if (err.name === 'CastError') return res.status(400).json({ ... });
  if (err.name === 'ValidationError') return res.status(400).json({ ... });
  if (err.code === 11000) return res.status(409).json({ success: false, error: 'Duplicate value' });
  ...
};
```

---

### H-4 — `getFocusDriftStats` has `$limit` before `$sort` — returns wrong data
**File:** `statsController.ts` lines 527–528

```ts
{ $limit: 10 },        // ← limits first
{ $sort: { completedAt: -1 } },  // ← then sorts
```
`$limit` before `$sort` takes 10 arbitrary documents, then sorts them. You never get the 10 most recent tasks with focus drift data.

**Fix:** Swap the order:
```ts
{ $sort: { completedAt: -1 } },
{ $limit: 10 },
```

---

### H-5 — Active view `status` filter conflicts with `$or`
**File:** `taskController.ts` lines 33–49

When `view=active`, the filter gains:
```ts
filter.$or = [{ status: 'pending' }, { completedAt: { $gte: startOfToday } }];
```
Then if the caller also passes `status=completed`, the code adds:
```ts
filter.status = 'completed';
```
Now the query has both `$or` (which includes `{ status: 'pending' }`) and a top-level `status: 'completed'`. MongoDB treats both as AND conditions. The `status: 'pending'` branch of `$or` can never match, and the `completedAt` branch may or may not match — the result is unpredictable and definitely not what the UI expects.

**Fix:** Skip the `status` filter injection when `view=active` (the `$or` already encodes the right logic), or merge the status filter into the existing `$or` conditions.

---

### H-6 — `authController` has no `try/catch` — unhandled async rejections
**File:** `authController.ts` — `signup`, `login`, `me` functions

`signup`, `login`, and `me` are `async` functions but have no `try/catch`. If MongoDB is temporarily unreachable and throws, these handlers don't call `next(error)`. Express 5 does propagate async errors automatically, but this still makes the behavior inconsistent with every other controller and bypasses the centralized error format.

**Fix:** Wrap all four controller functions in `try/catch` blocks and call `next(error)` in the catch, matching the pattern used in every other controller.

---

### H-7 — No startup validation of required environment variables
**File:** `server/src/index.ts`

`JWT_SECRET` is accessed with non-null assertion (`!`) throughout. If the env var is missing, `jwt.sign()` and `jwt.verify()` produce cryptographically broken tokens (or crash) and there's no clear error. `PORT`, `CLIENT_URL` have silent fallbacks. Only `MONGODB_URI` is checked.

**Fix:** Validate all required env vars at startup before any routes are registered:
```ts
const REQUIRED_ENV = ['JWT_SECRET', 'MONGODB_URI'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
}
```

---

## 🟡 Medium

### M-1 — Tag name uniqueness check has a TOCTOU race condition
**File:** `tagController.ts` — `createTag` and `updateTag`

Both do:
1. `Tag.findOne({ name })` — check for conflict
2. `Tag.create(...)` / `tag.save()` — create/update

If two requests arrive simultaneously for the same tag name, both pass the check, then one fails with a MongoDB duplicate key error (code 11000) which currently surfaces as a 500.

**Fix:** Remove the manual uniqueness check. The unique index on `Tag.name` already enforces this. Just `try { await Tag.create(validated) } catch (e) { if (e.code === 11000) res.status(409)... }`. Let the database be the source of truth.

---

### M-2 — `getMonthlyTrend` runs up to 8 DB queries in a loop
**File:** `statsController.ts` `getMonthlyTrend`

Four `for` loop iterations each fire two `countDocuments` calls (inside `Promise.all`). That's 8 round-trips to MongoDB instead of one aggregation pipeline.

**Fix:** Replace with a single `$group` aggregation using `$isoWeek` or computed week buckets:
```ts
Task.aggregate([
  { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
  { $group: { _id: { $week: '$createdAt' }, created: { $sum: 1 } } },
])
```

---

### M-3 — All date-based stats use UTC, ignoring user timezone
**Files:** `statsController.ts`, `focusController.ts`

`$dateToString`, `startOfToday.setHours(0,0,0,0)`, and `toISOString().split('T')[0]` all operate in UTC. A user in UTC+5:30 completing a task at 11 PM local time (5:30 PM UTC) will have it counted as the previous UTC day. The streak, heatmap, and weekly stats are all affected.

**Fix:** Accept an optional `timezone` query param (e.g., `?tz=Asia/Kolkata`) and thread it through `$dateToString: { format: '%Y-%m-%d', date: '...', timezone: tz }`. Default to `'UTC'` when not provided.

---

### M-4 — `subscriptionController` error response format is inconsistent
**File:** `subscriptionController.ts`

All other controllers use `{ success: false, error: '...' }`. The subscription controller uses `{ success: false, message: '...' }` for 500 errors and `{ success: false, errors: [...] }` for 400. The client API layer and any generic error handling breaks silently.

**Fix:** Standardize to `{ success: false, error: '...' }` throughout, and route non-Zod errors through `next(error)` instead of inline `res.status(500).json(...)`.

---

### M-5 — `subscriptionController` catches errors with `error: any`
**File:** `subscriptionController.ts`

```ts
} catch (error: any) {
  res.status(500).json({ success: false, message: error.message });
}
```
Using `any` disables type safety and bypasses the centralized error handler. Errors are swallowed locally, never logged, and the response format differs from everything else.

**Fix:** Use `next(error)` in catch blocks and remove local `try/catch` (or keep `catch (e) { next(e); }`).

---

### M-6 — `getTagEfficiencyStats` measures wall-clock time, not actual focus time
**File:** `statsController.ts`

The "actual time" for tag efficiency is `completedAt - createdAt` in minutes — this is the calendar time a task existed, not the time actually spent on it. A task created Monday and completed Friday appears to have taken ~5 days of work.

The correct data is `Task.totalFocusSeconds` which is incremented by actual focus sessions.

**Fix:** Change the aggregation to use `totalFocusSeconds` divided by 60 as `actual`, or show both metrics separately.

---

### M-7 — No pagination on `GET /api/tasks`
**File:** `taskController.ts` `getAllTasks`

All matching tasks are returned in one response. With many tasks, this becomes a slow query and a large payload.

**Fix:** Add `page` and `limit` query params (default `limit=50`). Return `{ data, count, page, totalPages }` in the response.

---

### M-8 — Task `search` uses `$regex` instead of a text index
**File:** `taskController.ts`

`$regex` scans every document and has no index support. For large collections this is slow and (before the ReDoS fix in C-4) dangerous.

**Fix:** Add a MongoDB text index to `taskSchema`:
```ts
taskSchema.index({ title: 'text', description: 'text' });
```
Then use `{ $text: { $search: search } }` in the query.

---

### M-9 — `updateTask` doesn't prevent updating a deleted task
**File:** `taskController.ts`

`Task.findByIdAndUpdate(req.params.id, ...)` will happily update a soft-deleted task. The trash view can show stale data if someone updates a deleted task through a direct API call.

**Fix:** Add `isDeleted: false` to the find condition in `findByIdAndUpdate`.

---

### M-10 — `archiveTask` / `unarchiveTask` don't guard against already-deleted tasks
**File:** `taskController.ts`

You can archive a soft-deleted task (one that's in the trash). This puts it in an ambiguous state: `isDeleted: true` AND `isArchived: true`. The view logic doesn't handle this combination.

**Fix:** Add `isDeleted: false` to the find condition in both `archiveTask` and `unarchiveTask`.

---

### M-11 — Streak calculation mutates the `checkDate` object in the loop
**File:** `statsController.ts` lines 156–166

```ts
let checkDate = distinctDates.includes(todayStr) ? new Date() : yesterday;
while (true) {
  checkDate.setDate(checkDate.getDate() - 1); // mutates object in-place
}
```
`yesterday` is defined outside the conditional. If streak starts from `yesterday`, the variable `yesterday` is passed by reference and gets mutated inside the loop. The `yesterdayStr` check on line 155 then references the already-mutated date. This is a subtle bug that can produce an incorrect streak count.

**Fix:** Always create a fresh `Date` for `checkDate` and don't reuse the `yesterday` reference:
```ts
let checkDate = new Date(distinctDates.includes(todayStr) ? now : yesterday.getTime());
```

---

## 🟢 Low

### L-1 — Redundant index on `Task` model
**File:** `models/Task.ts`

`taskSchema.index({ status: 1 })` is made redundant by the compound index `taskSchema.index({ isDeleted: 1, status: 1 })`. MongoDB won't use the single-field index when `isDeleted` is in the query (which it always is).

**Fix:** Remove `taskSchema.index({ status: 1 })`.

---

### L-2 — `isArchived` is in client `UpdateTaskPayload` but not in server schema
**Files:** `client/src/types/task.ts`, `server/src/types/task.ts`

`UpdateTaskPayload` has `isArchived?: boolean` on the client. The server's `updateTaskSchema` does not include it. If the client ever sends `isArchived` via a PATCH, it is silently stripped by Zod. This is currently safe (archive/unarchive use dedicated endpoints) but the type mismatch is misleading.

**Fix:** Remove `isArchived` from the client `UpdateTaskPayload` type since it's managed via dedicated endpoints.

---

### L-3 — `focusTask` state in `TimerContext` is dead state
**File:** `client/src/context/TimerContext.tsx`

`focusTask` and `setFocusTask` are in the context value but `focusTask` is never read anywhere — only `activeTask` is used for timer logic. The `setFocusTask` setter leaks into the public API without purpose.

**Fix:** Remove `focusTask` and `setFocusTask` from the context unless there's a planned use for them.

---

### L-4 — `getActiveSession` uses HTTP 204 as a signal — fragile client contract
**File:** `focusController.ts`, `client/src/services/focusApi.ts`

The endpoint returns 204 No Content when there is no active session. The client has special-case handling `if (res.status === 204) return null`. This is a non-standard API pattern. A 200 with `data: null` is simpler and doesn't require the client to sniff status codes.

**Fix:**
```ts
// Controller
res.json({ success: true, data: null });

// Client
return res.data.data; // null when no session
```

---

### L-5 — `createTask` silently drops user tags when defaults overflow the 5-tag limit
**File:** `taskController.ts` lines 69–73

```ts
const mergedTags = Array.from(new Set([...validated.tags, ...defaultTagNames])).slice(0, 5);
```
User-supplied tags come first, defaults fill remaining slots. But if a user submits 5 tags and there are default tags, the defaults are silently dropped. If a user submits 3 tags and there are 4 defaults, 2 defaults get silently dropped. No error or warning is returned.

**Fix:** Either don't inject defaults when the user already has tags, or warn the user that some defaults couldn't be applied.

---

### L-6 — `Tag` model has `description` default `''` which creates empty string in DB
**File:** `models/Tag.ts`

`description` has `default: ''`. Empty strings are stored and returned, making it indistinguishable from "no description set". Queries for `description: { $exists: false }` will never match.

**Fix:** Remove the `default: ''` and let it be `undefined` when not provided.

---

### L-7 — No `helmet` middleware — missing basic HTTP security headers
**File:** `server/src/index.ts`

The Express app has no `helmet` middleware. Security headers like `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and `Content-Security-Policy` are all absent.

**Fix:** `npm install helmet` and add `app.use(helmet())` before route registration.

---

### L-8 — `app.get(/(.*)/, ...)` catch-all served before `notFound` middleware
**File:** `server/src/index.ts` lines 70–73

The SPA fallback serves `index.html` for every non-API route. The `notFound` middleware registered after it can never fire for non-API routes because the catch-all always responds first.

**Fix:** This is intentional for SPA behavior but the `notFound` middleware should be removed or documented as API-only:
```ts
app.use('/api', notFound); // Only catch unmatched API routes
```

---

### L-9 — `User` model has no `maxlength` on `name` field
**File:** `models/User.ts`

The schema has `name: { type: String, required: true, trim: true }` with no `maxlength`. The Zod schema in `auth.ts` caps it at 100 characters, but a direct MongoDB write bypasses Zod. The DB model and Zod schema should be consistent.

**Fix:** Add `maxlength: [100, 'Name cannot exceed 100 characters']` to the `name` field.

---

### L-10 — `auth` cookie `sameSite: 'lax'` may not work in cross-origin Electron production build
**File:** `authController.ts`

In the Electron desktop build, the frontend and backend may run on different ports/origins. `sameSite: 'lax'` + `secure: true` can cause cookies to not be sent for cross-origin requests, silently breaking auth.

**Fix:** Conditionally set `sameSite` based on whether this is an Electron/desktop build (e.g., use an env var like `IS_ELECTRON=true` to switch to `sameSite: 'none'`). Or ensure the production Electron build serves everything from the same Express origin.

---

## Summary Table

| ID | Severity | Area | Short Description |
|----|----------|------|-------------------|
| C-1 | 🔴 Critical | Auth/DB | No per-user isolation on tasks, tags, stats |
| C-2 | 🔴 Critical | Focus | FocusSession has no userId; startSession nukes all users' sessions |
| C-3 | 🔴 Critical | Security | Rate limiter is commented out |
| C-4 | 🔴 Critical | Security | ReDoS via unescaped regex in task search |
| C-5 | 🔴 Critical | Data | restoreTask doesn't clear `deletedAt` |
| C-6 | 🔴 Critical | Data | `updateTaskSchema` allows setting `isDeleted: true` without `deletedAt` |
| C-7 | 🔴 Critical | Data | Tag rename/delete cascade is non-atomic |
| H-1 | 🟠 High | Runtime | Subscription files missing `.js` ESM extensions — runtime crash |
| H-2 | 🟠 High | Validation | No ObjectId validation — CastError returns 500 |
| H-3 | 🟠 High | Error | errorHandler doesn't handle Mongoose errors — all return 500 |
| H-4 | 🟠 High | Stats | `getFocusDriftStats` has `$limit` before `$sort` |
| H-5 | 🟠 High | Query | Active view + status filter produces conflicting `$or` |
| H-6 | 🟠 High | Error | authController has no try/catch on async handlers |
| H-7 | 🟠 High | Config | No startup validation of required env vars |
| M-1 | 🟡 Medium | Race | Tag uniqueness check has TOCTOU race condition |
| M-2 | 🟡 Medium | Perf | `getMonthlyTrend` runs 8 DB queries in a loop |
| M-3 | 🟡 Medium | UX | All date stats in UTC — wrong day boundaries for non-UTC users |
| M-4 | 🟡 Medium | API | Subscription controller error format inconsistent with rest of API |
| M-5 | 🟡 Medium | Quality | `catch (error: any)` in subscriptionController |
| M-6 | 🟡 Medium | Stats | Tag efficiency measures wall-clock time, not actual focus time |
| M-7 | 🟡 Medium | Perf | No pagination on GET /api/tasks |
| M-8 | 🟡 Medium | Perf | Search uses `$regex` — no text index, slow at scale |
| M-9 | 🟡 Medium | Logic | `updateTask` can update soft-deleted tasks |
| M-10 | 🟡 Medium | Logic | `archiveTask` doesn't guard against already-deleted tasks |
| M-11 | 🟡 Medium | Bug | Streak loop mutates `yesterday` date object causing wrong streak |
| L-1 | 🟢 Low | DB | Redundant `{ status: 1 }` index on Task |
| L-2 | 🟢 Low | Types | `isArchived` in client `UpdateTaskPayload` but not in server schema |
| L-3 | 🟢 Low | Dead Code | `focusTask` state in TimerContext is never consumed |
| L-4 | 🟢 Low | API | `getActiveSession` uses 204 as signal — non-standard |
| L-5 | 🟢 Low | UX | `createTask` silently drops tags when default tags overflow limit |
| L-6 | 🟢 Low | DB | `Tag.description` default `''` pollutes DB with empty strings |
| L-7 | 🟢 Low | Security | No `helmet` middleware — missing HTTP security headers |
| L-8 | 🟢 Low | Routing | SPA catch-all makes `notFound` unreachable for non-API routes |
| L-9 | 🟢 Low | Validation | `User.name` has no `maxlength` in Mongoose schema |
| L-10 | 🟢 Low | Auth | `sameSite: 'lax'` cookie may break Electron cross-origin auth |
