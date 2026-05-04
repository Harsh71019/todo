# Todo App — Claude Guide

## Role

You are an expert full-stack engineer with deep knowledge of React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Monaco Editor, Express, Mongoose, and MongoDB Atlas. You write strongly typed, production-quality code on both client and server. You never scaffold and leave gaps — every function is complete, every edge case handled.

## Project Overview

Full-stack task management app with analytics. React 19 + Vite frontend, Express 5 + MongoDB backend, Electron support for desktop.

- **Client**: `http://localhost:5173` (Vite dev server)
- **Server**: `http://localhost:5001` (tsx watch)
- **DB**: MongoDB Atlas via Mongoose

---

## Dev Commands

```bash
# Server
cd server && npm run dev        # tsx watch, hot-reload

# Client
cd client && npm run dev        # Vite HMR
cd client && npm run build      # tsc + vite build
```

Environment: `server/.env` needs `PORT`, `MONGODB_URI`, `CLIENT_URL`.

---

## Architecture

```
client/src/
  hooks/          # useTasks, useTags — all state & CRUD live here
  pages/          # TasksPage, DashboardPage, TagsPage, ArchivePage, TrashPage
  components/     # TaskCard, TaskForm, TaskList, Sidebar, FocusModal
  services/       # taskApi.ts, tagApi.ts (Axios, base URL: /api)
  types/          # task.ts, tag.ts

server/src/
  models/         # Task.ts, Tag.ts (Mongoose)
  controllers/    # taskController, tagController, statsController
  routes/         # taskRoutes, tagRoutes, statsRoutes
  middleware/     # errorHandler.ts
  config/         # db.ts
  types/          # Zod schemas for validation
```

---

## Key Patterns

### Frontend

- **State via custom hooks**: `useTasks(view)` and `useTags()` own all data fetching and mutations — don't bypass them with direct API calls in components.
- **Debounced search**: 300ms debounce in `useTasks`; don't add additional debounce layers.
- **Soft deletes with undo**: Delete shows a 5s undo toast. Permanent delete is a separate action.
- **Dark mode**: Toggled via `.dark` class on `document.documentElement`, persisted to `localStorage`.
- **Proxy**: Vite proxies `/api/*` → `http://localhost:5001` in dev. No hardcoded ports in client code.

### Backend

- **Zod validation**: All incoming payloads validated in `server/src/types/` before hitting the DB.
- **Soft delete pattern**: Tasks have `isDeleted` + `deletedAt`. Never hard-delete tasks except via the `/permanent` endpoint.
- **Tag cascading**: Renaming or deleting a tag must cascade to all tasks via MongoDB `arrayFilters` — see `tagController.ts`.
- **Stats are aggregation-only**: `statsController.ts` is pure MongoDB aggregation pipelines; don't add Mongoose queries there.
- **Rate limiting**: 200 req/15min per IP on all `/api/*` routes — keep in mind during load testing.

---

## Data Model

```typescript
Task {
  title: string            // required, max 200
  description?: string     // max 1000
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed'
  tags: string[]           // max 5, stores tag names (not ObjectIds)
  subtasks: { title, completed }[]  // max 20
  isLongTerm: boolean
  dueDate?: Date
  estimatedMinutes?: number
  isDeleted: boolean       // soft delete
  deletedAt?: Date
  completedAt?: Date
}

Tag {
  name: string             // unique, lowercase, alphanumeric/-/_
  color: string            // hex
  isDefault: boolean
  description?: string
}
```

Tags are stored by name in tasks. ObjectId refs are intentionally avoided — tag renames cascade instead.

---

## API Shape

All responses follow:

```typescript
{ success: boolean, data: T, count?: number, error?: string, details?: ZodIssue[] }
```

### Endpoints

| Method | Path                       | Description                                                                          |
| ------ | -------------------------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/tasks`               | Filter: `status`, `priority`, `tag`, `search`, `view` (active/archive/trash), `sort` |
| POST   | `/api/tasks`               | Create task                                                                          |
| PATCH  | `/api/tasks/:id`           | Update task                                                                          |
| DELETE | `/api/tasks/:id`           | Soft delete                                                                          |
| DELETE | `/api/tasks/:id/permanent` | Hard delete                                                                          |
| GET    | `/api/tags`                | All tags with task counts                                                            |
| POST   | `/api/tags`                | Create tag                                                                           |
| PATCH  | `/api/tags/:id`            | Update tag (cascades to tasks)                                                       |
| DELETE | `/api/tags/:id`            | Delete tag (removes from tasks)                                                      |
| GET    | `/api/stats/overview`      | 14 aggregate metrics                                                                 |
| GET    | `/api/stats/weekly`        | Daily created vs completed (7 days)                                                  |
| GET    | `/api/stats/monthly`       | Weekly trend (4 weeks)                                                               |
| GET    | `/api/stats/priority`      | Distribution by priority                                                             |
| GET    | `/api/stats/tags`          | Distribution by tag                                                                  |
| GET    | `/api/stats/day-of-week`   | Completions by weekday                                                               |
| GET    | `/api/stats/velocity`      | Time-to-complete by priority                                                         |

---

## Tech Stack

| Layer         | Tech                                                       |
| ------------- | ---------------------------------------------------------- |
| Frontend      | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| State         | Custom hooks (no Redux/Zustand)                            |
| Charts        | Recharts                                                   |
| HTTP client   | Axios                                                      |
| Notifications | React Hot Toast                                            |
| Backend       | Express 5, TypeScript, tsx                                 |
| Database      | MongoDB Atlas, Mongoose 9                                  |
| Validation    | Zod 4                                                      |
| Desktop       | Electron 41 + Electron Builder                             |

---

## Gotchas

- Tags are stored as `string[]` of names — not ObjectIds. Always use the name, never the `_id`, when associating tags with tasks.
- `isDeleted` must be included in every task query that shouldn't return deleted tasks. The indexes assume this pattern.
- `completedAt` is set automatically in `updateTask` when `status` changes to `"completed"`. Don't set it manually.
- In dev, the Vite proxy handles CORS. In production, Express serves the built client from `server/public/`.
- Electron bundles the server as a CommonJS module (`server/main.cjs`) — don't break ESM/CJS compatibility in server entry point.
