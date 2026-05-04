# Focus Session Tracking — Implementation Plan

## Overview

Right now the focus timer is purely client-side — closing the browser or refreshing loses all history. This feature persists every focus session to MongoDB so we can track how much time a user actually spends on each task, surface that in the dashboard, and show per-task focus history in the detail modal.

---

## Data Model

### New Collection: `FocusSession`

A separate collection (not embedded in Task) so sessions can be queried, aggregated, and paginated independently without bloating the task document.

```typescript
FocusSession {
  _id: ObjectId
  taskId: ObjectId          // ref → Task
  startedAt: Date           // when Start was clicked
  endedAt?: Date            // when stopped/paused/task completed
  durationSeconds: number   // computed on end: (endedAt - startedAt) / 1000
  isPomodoro: boolean       // true if durationSeconds >= 25 * 60
  status: 'active' | 'completed' | 'abandoned'
                            // active   = timer is running right now
                            // completed = user hit "Finish Task"
                            // abandoned = user stopped without finishing
  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
- `{ taskId: 1, startedAt: -1 }` — sessions per task, newest first
- `{ status: 1 }` — find active sessions quickly
- `{ startedAt: -1 }` — daily/weekly aggregations

### Task model additions (denormalized for performance)

Add these fields to the existing `Task` schema so we can show focus data on task cards without joining every time:

```typescript
Task {
  ...existing fields...
  totalFocusSeconds: number   // running total, updated on session end (default 0)
  completedPomodoros: number  // incremented each time a full 25-min session completes (default 0)
  lastFocusedAt?: Date        // when the most recent session started
}
```

> **Why store `completedPomodoros` explicitly instead of deriving it?**
> Counting completed sessions ≥ 25 min requires an aggregation join on every task card render. A simple counter on the task is a single-field read. The trade-off is a slightly more complex write (increment on stop) which happens far less often than reads. Worth it.

A session counts as a completed pomodoro if:
- `status === 'completed'` (user hit Finish Task), **or**
- `status === 'abandoned'` but `durationSeconds >= 25 * 60` (user ran the full timer then stopped manually)

---

## API Endpoints

### Focus Session Routes — `/api/focus`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/focus/start` | Start a new session for a task. Abandons any other active session first (one at a time rule). |
| `POST` | `/api/focus/:sessionId/stop` | Stop the session. Computes duration, updates `Task.totalFocusSeconds`. |
| `GET`  | `/api/focus/active` | Returns the currently active session (if any) — used on app load to restore timer state. |
| `GET`  | `/api/focus/task/:taskId` | All sessions for a specific task (for the detail modal history view). |

### Request / Response shapes

**POST `/api/focus/start`**
```json
// body
{ "taskId": "abc123" }

// response
{ "success": true, "data": { "_id": "sess1", "taskId": "abc123", "startedAt": "...", "status": "active" } }
```

**POST `/api/focus/:sessionId/stop`**
```json
// body
{ "status": "completed" | "abandoned" }

// response
{ "success": true, "data": { "_id": "sess1", "durationSeconds": 843, "status": "completed" } }
```

**GET `/api/focus/active`**
```json
// response (204 if none)
{ "success": true, "data": { "_id": "sess1", "taskId": "abc123", "startedAt": "...", "status": "active" } }
```

---

## Stats Additions

Add new endpoints under `/api/stats` for focus-specific aggregations:

| Endpoint | Returns |
|----------|---------|
| `GET /api/stats/focus-today` | Total focus seconds today, session count |
| `GET /api/stats/focus-weekly` | Daily focus minutes for the last 7 days (chart data) |
| `GET /api/stats/focus-by-task` | Top 10 tasks by total focus time |

These will also feed into the existing `/api/stats/overview` — add `totalFocusSecondsToday` and `avgFocusSessionMinutes` to that response.

---

## Frontend Changes

### 1. `TimerContext` — wire up API calls

The context becomes the single place that calls the focus session API:

```
startTimer(task)
  → if activeTask is different, stop old session (POST /focus/:id/stop, status: abandoned)
  → POST /api/focus/start  →  store sessionId in context state
  → start local tick

pauseTimer()
  → POST /api/focus/:sessionId/stop, status: abandoned
  → clear sessionId (next resume creates a new session)

resumeTimer()
  → POST /api/focus/start (new session for same task)
  → store new sessionId

stopTimer()
  → POST /api/focus/:sessionId/stop, status: abandoned

// called from "Finish Task" button
completeTimer()
  → POST /api/focus/:sessionId/stop, status: completed
```

> **Note on pause:** Each pause/resume creates a new session. This is simpler than a single session with pause intervals and gives us accurate per-session data. The total is the sum of all session durations.

### 2. App load — restore active session

On `TimerProvider` mount, call `GET /api/focus/active`. If a session is returned:
- Restore `activeTask` from `taskId` (fetch the task)
- Calculate elapsed time: `Date.now() - session.startedAt`
- Resume the local tick from that offset

This means refreshing the page restores the running timer.

### 3. `TaskCard` — show focus stats

Add to the metadata row (only shown if the task has been focused on):

```
🍅 3   ·   1h 23m focused
```

- `🍅 3` = `completedPomodoros` count
- `1h 23m` = `totalFocusSeconds` formatted
- Both come directly off the task document — no extra fetch

### 4. `TaskDetailModal` — session history

Add a "Focus History" section in the left panel listing past sessions:

```
Focus History
─────────────
🍅 May 6, 10:30am   25m   ✓ completed
   May 5,  2:15pm   18m   ✗ abandoned
   May 5, 11:00am   12m   ✗ abandoned

🍅 3 pomodoros  ·  Total: 55m across 3 sessions
```

The 🍅 icon appears only on rows where `isPomodoro === true`.

### 5. `DashboardPage` — new Focus Stats section

A new card on the dashboard showing:
- **Pomodoros today** (count)
- **Focus time today** (minutes)
- **Focus time this week** (bar chart, one bar per day)
- **Top focused tasks** (ranked list by `completedPomodoros` + `totalFocusSeconds`)

---

## Implementation Order

1. **Server — FocusSession model + Zod schema**
2. **Server — focusController (start, stop, active, byTask)**
3. **Server — focusRoutes + mount in index.ts**
4. **Server — stats aggregations (focus-today, focus-weekly, focus-by-task)**
5. **Server — Task model: add `totalFocusSeconds`, `lastFocusedAt`**
6. **Client — `focusApi.ts` service (start, stop, getActive)**
7. **Client — `TimerContext` updated to call API + restore on mount**
8. **Client — `TaskCard` total focus time badge**
9. **Client — `TaskDetailModal` session history section**
10. **Client — `DashboardPage` Focus Stats card**
11. **Client — types updated (`task.ts`, new `focusSession.ts`)**

---

## Open Questions (decide before implementation)

1. **Pause behaviour** — New session per resume (proposed) vs. single session with paused intervals array. The new-session approach is simpler; the interval approach gives richer data.

2. **Active session on multiple tabs** — If the user opens two tabs and starts a timer in each, the second `POST /focus/start` abandons the first. Is that acceptable?

3. **Show focus stats on non-Tasks pages?** — Should `totalFocusSeconds` show on ArchivePage / CompletedPage task cards too, or only on the active Tasks view?

4. **Timer duration** — Currently hardcoded at 25 min (Pomodoro). Should users be able to set a custom duration? Out of scope for now but worth noting for the schema.
