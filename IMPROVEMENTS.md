# Taskflow — QoL Improvements & Missing Features

> Reviewed: 2026-05-04. Not bugs — things that work but could be better, things that are missing, and things worth building next.

---

## Priority Legend
- 🔴 **High impact** — noticeable friction every session
- 🟠 **Medium** — occasionally annoying or a real gap
- 🟡 **Low** — nice to have, polish

---

## 1. Tasks

### 🔴 No "Empty Trash" button
Trash only has individual permanent-delete per card. With many deleted tasks you have to click each one. A single "Empty Trash" button with a confirmation dialog would take one second to add and save minutes every week.

### 🔴 Trash never auto-expires
Items in trash stay forever unless manually deleted. Standard behaviour is 30-day auto-expiry. A nightly server-side cleanup (`Task.deleteMany({ isDeleted: true, deletedAt: { $lt: thirtyDaysAgo } })`) in a cron or on-connect hook would keep the DB clean without user effort.

### 🔴 Filter/sort state resets on every navigation
Switching from `/tasks` to `/dashboard` and back resets the search query, active tag, and sort to defaults. Either lift filter state to context/URL params so it survives navigation, or at minimum save the last-used values in `sessionStorage`.

### 🔴 "Complete All" has no undo and no confirmation
One accidental click on "Complete All" marks every visible pending task as done with no recovery path (the UNDO toast only appears per-toggle, not for bulk). Either add a confirmation dialog or show a single bulk-undo toast.

### 🟠 Cannot sort by estimated time or focus time
The sort dropdown has Newest / Oldest / Priority / Due Date. "Highest estimated" and "Most focused" would be useful for daily planning. Both fields exist in the DB — just needs two new sort options.

### 🟠 Due date has no time component
`dueDate` is stored as a Date and the form offers a date picker. For tasks due at a specific hour (meetings, deadlines) there is no time picker. The `isLongTerm` boolean partially covers this but it is a blunt instrument. Adding an optional time input that feeds an ISO datetime is straightforward.

### 🟠 Subtasks cannot be reordered
Subtasks are rendered in creation order with no drag-to-reorder. If you realise the order is wrong you have to delete and recreate. Adding a drag handle + a `dnd-kit` sort would solve this.

### 🟠 No bulk operations
You cannot select multiple tasks and delete / archive / change priority / add tag. For a power user with a long backlog this is a real gap. A checkbox-select mode with a sticky action bar would cover all bulk actions at once.

### 🟠 Tag filter pills show no colour
On the task page the tag filter pills are plain grey/indigo regardless of the tag's actual colour stored in the DB. The `useTasks` hook returns `allTags: string[]` — it should return `Tag[]` objects so the colours can render.

### 🟠 Task form draft never clears stale state
`localStorage.setItem('tf-draft', ...)` is written on every keystroke but only cleared on successful create. If you create a task, navigate away, and come back, the form pre-fills with the previous task's data — including the title, which is confusing. Clear the draft immediately after successful submit (already done) but also add a "Clear draft" button so the user can manually wipe it.

### 🟡 `duplicateTask` copies due date as-is
When duplicating a task the `dueDate` is copied verbatim. A duplicate with a past due date is immediately overdue. Either clear the due date on duplicate or shift it forward by the same number of days from today.

### 🟡 Description edit vs render inconsistency
Markdown is rendered beautifully in `TaskCard` via `ReactMarkdown`. But the edit textarea in `TaskForm` is a plain textarea with no preview pane. Users writing markdown can't see what it will look like without saving. A toggle between "Write" and "Preview" tabs (like GitHub's issue editor) would close this gap.

### 🟡 Active view: hard midnight cutoff
The active view shows tasks completed today (since UTC/local midnight). A task completed at 11:59 PM yesterday disappears from the active view immediately at midnight. A 2–3 hour grace window ("recent completions") would feel more natural.

---

## 2. Search

### 🔴 Search does not search tags
Typing a tag name in the search box finds nothing unless the task title contains that string. The `$or` query should include `{ tags: { $regex: escaped, $options: 'i' } }` alongside title and description.

### 🟠 No global search — search is view-scoped
Search only searches the current view (active / archive / trash). There is no way to search across all tasks at once. A modal "command palette" (⌘K) with a global search across all views would be a high-value addition.

### 🟡 `/` key should focus the search input
Most productivity apps focus the search input when you press `/`. Currently the only keyboard shortcut is `N` (focus the new task title). Adding `/` → focus search takes three lines of code.

---

## 3. Timer / Pomodoro

### 🔴 Pomodoro count resets when switching tasks
In `TimerContext.startTimer`, switching to a different task calls `setPomodoroCount(0)`. If you work 3 pomodoros on task A, switch to task B, then come back to task A, the count shows 0. The count should be stored per-task (e.g. `Map<taskId, count>`) rather than as a single value.

### 🔴 Pomodoro count does not restore on page refresh
`getActiveSession` on mount restores the timer position, but `pomodoroCount` is always reset to 0. If you did 3 pomodoros and refresh the page, the counter shows 0 and you will get a short break instead of a long break at the wrong time.

### 🟠 No customisable pomodoro / break duration
25/5/15 minutes are hardcoded as constants. Many users prefer 50/10, or 45/15. These should be user-configurable settings (stored in localStorage or a user-settings endpoint).

### 🟠 Auto-start break has no opt-out
When a pomodoro ends the break timer starts immediately. Some users want to choose when to start their break. A "Start Break" button instead of auto-start would give control without adding complexity.

### 🟠 No daily pomodoro goal
There is no way to set "I want to complete 8 pomodoros today" and see progress toward that. The `getFocusToday` endpoint already returns `totalPomodoros` — it just needs a goal input in the UI and a progress ring on the floating timer.

### 🟡 Focus history not shown on task detail modal
`TaskDetailModal` shows the task's subtasks and description but not its focus history (sessions, total focus time, completed pomodoros). The `/api/focus/task/:taskId` endpoint already exists and returns this data — it just needs to be rendered.

---

## 4. Dashboard / Stats

### 🔴 Tags state is fetched but immediately discarded
In `DashboardPage`:
```ts
const [, setTags] = useState<TagBreakdown[]>([]);
```
`setTags` is called but `tags` is never read. There is no tags breakdown chart rendered despite the data being fetched. Either render the chart or remove the fetch.

### 🔴 One failed stat fetch silently breaks the whole dashboard
All 10+ API calls are in a single `Promise.all` inside one `try/catch`. If `/stats/velocity` returns an error, the entire dashboard shows the error state — all charts go blank. Each chart section should have independent error handling so one bad endpoint doesn't take down the page.

### 🟠 No date range picker — fixed windows only
Weekly/monthly stats are hardcoded to 7 days / 4 weeks. There is no way to view "last 30 days" or pick a custom date range. Adding a `?from=&to=` param on the backend stats endpoints and a date range picker on the frontend would make the dashboard genuinely useful for retrospectives.

### 🟠 Dashboard re-fetches all data on every navigation
There is no caching. Every time you open the dashboard all 10 endpoints are hit. React Query or SWR with a 5-minute stale time would cut this to near-zero on repeat visits.

### 🟠 Velocity and tag-efficiency charts are misleading with little data
`getVelocityStats` uses `createdAt → completedAt` as "time taken". A task created Monday and completed Friday shows 5 days even if you only spent 20 minutes on it. The data exists (`totalFocusSeconds`) but the velocity chart doesn't use it. These two charts should be labelled as "calendar time to close" not "time spent".

### 🟡 No CSV / PDF export
There is no way to export tasks or stats. A `/api/tasks/export?format=csv` endpoint and a download button would cover the most common use case.

---

## 5. Subscriptions

### 🔴 Error messages broken after API fix
`useSubscriptions` and `SubscriptionForm` both read errors as `err.response?.data?.message` but the subscription controller was standardised to `{ success: false, error: '...' }` (using the `error` key). All subscription error toasts now show `undefined`. Change every `.data?.message` reference to `.data?.error` in the hook and form.

### 🔴 `nextBillingDate` never auto-advances
When a subscription renews there is no way to mark it as "paid" and have the next billing date advance by one cycle. The card shows "Overdue" indefinitely. Adding a "Mark Paid" action that auto-computes the next date (`addMonths(nextBillingDate, 1)` for monthly, etc.) would keep the tracker accurate.

### 🟠 `calculateTotalSpent` is duplicated
The exact same function exists in both `SubscriptionCard.tsx` (inline) and `useSubscriptions.ts`. If the logic ever needs to change it must be updated in two places. Extract it to `src/utils/subscriptionUtils.ts` and import it from both.

### 🟠 Mixed-currency monthly spend is misleading
When subscriptions have different currencies the "Monthly Spend" card shows a single number that mixes ₹, $, £ without conversion. The "Mixed currencies" disclaimer is easy to miss. Either disable the aggregate when currencies differ, show per-currency totals, or add a currency conversion layer using a free exchange-rate API (e.g., `frankfurter.app`).

### 🟠 No renewal notification
There is no reminder when a subscription is coming up for renewal. A browser notification 3 days before `nextBillingDate` (using the already-requested Notification permission from the Pomodoro feature) would be genuinely useful.

### 🟡 Category list is hardcoded
`CATEGORIES` in `SubscriptionForm` is a static array. Users cannot add custom categories. Making category a free-text input with the hardcoded list as suggestions would take two minutes.

### 🟡 No search or sort on subscriptions
The subscription page has filter tabs (all/active/paused) but no search and no sort. With 20+ subscriptions finding one by name requires scrolling. A search input and sort-by-amount / sort-by-renewal-date dropdown would help.

---

## 6. Auth / Session

### 🔴 No global 401 interceptor — expired JWT silently fails
When the 7-day JWT expires, every API call returns 401 but the client has no Axios interceptor to catch this. The user sees "Failed to load tasks" errors with no explanation. An Axios response interceptor that catches 401 and redirects to `/login` would handle this cleanly:
```ts
api.interceptors.response.use(undefined, (error) => {
  if (error.response?.status === 401) navigate('/login');
  return Promise.reject(error);
});
```

### 🟠 No token refresh — 7-day hard expiry
There are no refresh tokens. After 7 days the user is silently logged out on next open. A refresh-token flow (long-lived cookie + short-lived access token) is the standard fix, but even just extending the JWT to 30 days with a re-sign on every successful `/me` call would reduce friction.

### 🟠 No "forgot password" flow
There is no password reset. If you forget your password the only recovery is a direct DB edit. Implementing a basic email reset (nodemailer + a time-limited signed URL) would complete the auth surface.

### 🟠 `ProtectedRoute` shows no loading state
While `useAuth` is resolving (the `/api/auth/me` call), `ProtectedRoute` renders nothing — the screen is blank. A full-page loading spinner while `isPending === true` would prevent the flash.

### 🟡 No way to change password or email in the app
Once registered, the user cannot update their credentials. A `/settings` page with a "Change Password" form (current password + new password) is the minimum.

---

## 7. Tags

### 🟠 Tags page has no search
With many tags, finding one requires scrolling. A search input that filters the tag list client-side would take minutes.

### 🟠 Clicking a tag on a task card doesn't filter by that tag
In `TaskCard`, the tag pills are rendered but are not clickable. Clicking a tag pill should set `activeTag` to that tag and filter the list — a pattern that every tag-based app supports.

### 🟡 No bulk-delete for tags
To clean up unused tags you must delete them one at a time. A select-all + bulk-delete action on the Tags page would help when cleaning up.

---

## 8. Sidebar

### 🟠 Sidebar fetches full stats overview just for the streak
`getStatsOverview()` runs 10+ DB queries and returns 15 fields; the sidebar uses exactly one of them (`currentStreak`). Add a dedicated lightweight `/api/stats/streak` endpoint that runs only the streak aggregation, or pass the streak down from a shared stats context.

### 🟠 Streak doesn't update when you complete a task
The streak display in the sidebar polls every 30 minutes. If you complete a task that starts a new streak, the streak counter won't update until the next poll or a page reload. Subscribe to task completion events (or simply refetch streak when `toggleTask` resolves successfully) to keep it live.

### 🟠 No badge counts on nav links
The sidebar has no indication of how many tasks are pending, how many are in trash, or how many subscriptions are overdue. Small number badges on the nav links (`Tasks (4 overdue)`, `Trash (7)`) give at-a-glance status without opening each page.

---

## 9. Performance

### 🟠 `allTags` in `useTasks` is recomputed on every render
```ts
const tagSet = new Set<string>();
data.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
setAllTags(Array.from(tagSet).sort());
```
This runs inside `setTasks` on every fetch but is stored as state, so it's fine. However it should return `Tag[]` objects (from the `/api/tags` response) not just strings, to carry colour data for the filter pills.

### 🟠 `DashboardPage` fires 10+ sequential API calls with no parallelism guard
The `Promise.all` is correct, but there's no deduplication. If the user navigates to the dashboard twice quickly, two full sets of 10 requests fire. React Query / SWR with a `staleTime` of 5 minutes would deduplicate this automatically.

### 🟡 No HTTP response caching headers on static stats endpoints
Stats endpoints (`/overview`, `/weekly`, etc.) return fresh data on every call. Adding `Cache-Control: max-age=60` on stats routes (not task routes) would let the browser serve cached responses on quick back-navigations.

---

## 10. Missing Features Worth Building

| Feature | Why | Rough effort |
|---------|-----|-------------|
| **Keyboard shortcut help modal (`?` key)** | The `N` shortcut exists but is undiscoverable. A modal listing all shortcuts would immediately improve discoverability. | Small |
| **Task ordering / pinning** | No way to say "show this task first". A pin-to-top action or manual drag-to-reorder would cover daily prioritisation. | Medium |
| **Recurring tasks** | Many tasks repeat daily / weekly. Currently the user must recreate them or duplicate. A `recurrence` field with options (daily, weekly, weekdays, custom) that auto-creates the next instance on completion would be high-value. | Large |
| **Task comments / timestamped notes** | Tasks have a description but no append-only activity log. Adding notes while working on a task ("blocked by X", "tried Y") is a very common workflow. | Medium |
| **Pomodoro goal tracking** | Set a daily pomodoro goal and see a progress ring. The data already exists. | Small |
| **Focus session on task detail** | The task detail modal shows description and subtasks but not the focus history. The endpoint exists. | Small |
| **Command palette (⌘K)** | Global search, quick task creation, and quick navigation in one modal. The most-loved feature in modern productivity apps. | Medium |
| **Weekly review mode** | A guided view: "Here's what you completed this week, here's what carried over, set 3 goals for next week." Uses existing stats. | Medium |
| **Subscription renewal notifications** | Browser notification 3 days before `nextBillingDate`. The Notification permission is already requested by the Pomodoro feature. | Small |
| **Export tasks to CSV** | A single `GET /api/tasks/export` route that streams CSV. Useful for reporting. | Small |
| **Due-date reminders** | Browser notification when a task's due date is today. Same infrastructure as subscription notifications. | Small |
| **Settings page** | Change password, change email, set preferred pomodoro duration, set timezone preference (instead of auto-detect). | Medium |
