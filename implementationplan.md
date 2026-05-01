# Todo List App with Stats Dashboard

A personal task tracker with a rich analytics dashboard — built with a modern TypeScript fullstack.

## Tech Stack

| Layer          | Tech              | Notes                              |
| -------------- | ----------------- | ---------------------------------- |
| **Frontend**   | React 19 + Vite   | SPA with React Router              |
| **Language**   | TypeScript        | End-to-end type safety             |
| **Styling**    | Vanilla CSS       | Custom design system, dark theme   |
| **Charts**     | Recharts          | Lightweight, React-native charting |
| **Backend**    | Node.js + Express | REST API                           |
| **Database**   | MongoDB Atlas     | Free tier, cloud persistence       |
| **ODM**        | Mongoose          | Schema validation + typed models   |
| **Validation** | Zod               | Shared request/response validation |

## Project Structure

```
Todo/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── assets/             # Static assets
│   │   ├── components/         # Reusable UI components
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── StatCard.tsx
│   │   ├── pages/
│   │   │   ├── TasksPage.tsx   # Main todo list view
│   │   │   └── DashboardPage.tsx # Stats & charts
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useTasks.ts
│   │   ├── services/           # API client layer
│   │   │   └── taskApi.ts
│   │   ├── types/              # Shared TS types
│   │   │   └── task.ts
│   │   ├── utils/              # Helper functions
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css           # Global styles & design tokens
│   │   └── main.tsx
│   ├── index.html
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
├── server/                     # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts           # MongoDB connection
│   │   ├── models/
│   │   │   └── Task.ts         # Mongoose schema
│   │   ├── routes/
│   │   │   ├── taskRoutes.ts   # CRUD endpoints
│   │   │   └── statsRoutes.ts  # Analytics endpoints
│   │   ├── controllers/
│   │   │   ├── taskController.ts
│   │   │   └── statsController.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── types/
│   │   │   └── task.ts
│   │   └── index.ts            # Express entry point
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

## Data Model

### Task Schema

```typescript
interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed';
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date; // Set when status → completed
  updatedAt: Date;
}
```

> [!NOTE]
> We store `createdAt` and `completedAt` timestamps on every task. This is what powers all the dashboard analytics — tasks created per day/week, completion rate, average time-to-complete, streaks, etc.

## Dashboard Stats (Planned)

| Stat                          | Description                                            |
| ----------------------------- | ------------------------------------------------------ |
| **Tasks Created This Week**   | Count of tasks with `createdAt` in current week        |
| **Tasks Completed This Week** | Count of tasks with `completedAt` in current week      |
| **Completion Rate**           | `completed / total * 100`                              |
| **Pending Tasks**             | Count of tasks with `status: pending`                  |
| **Overdue Tasks**             | Pending tasks past `dueDate`                           |
| **Avg Time to Complete**      | Mean of `completedAt - createdAt` for completed tasks  |
| **Weekly Activity Chart**     | Bar chart — created vs completed per day (last 7 days) |
| **Priority Breakdown**        | Pie/donut chart — tasks by priority level              |
| **Monthly Trend**             | Line chart — completions over the last 4 weeks         |

---

## Phase 1 — Project Scaffolding & Setup

**Goal:** Get both client and server projects initialized, configured, and running with TypeScript.

### Steps

1. **Initialize client** with Vite + React + TypeScript template
   - `npx -y create-vite@latest ./client --template react-ts`
   - Install dependencies: `react-router-dom`, `recharts`, `axios`
   - Configure Vite proxy to forward `/api` requests to backend

2. **Initialize server** with Express + TypeScript
   - Create `server/` manually with `npm init -y`
   - Install: `express`, `mongoose`, `cors`, `dotenv`, `zod`
   - Install dev: `typescript`, `tsx`, `@types/express`, `@types/cors`
   - Configure `tsconfig.json` for Node
   - Create entry point `src/index.ts` with basic Express server

3. **Setup MongoDB Atlas**
   - Create `.env` in `server/` with `MONGODB_URI` and `PORT`
   - Create `src/config/db.ts` connection utility
   - Add `.gitignore` for both client and server

4. **Verify:** Both `client` and `server` start without errors; MongoDB connects successfully

### Deliverables

- [x] Vite React TS app running on `localhost:5173`
- [x] Express server running on `localhost:5000`
- [x] MongoDB Atlas connected
- [x] Proxy configured (client → server)

---

## Phase 2 — Backend API (CRUD + Stats)

**Goal:** Build the complete REST API for task management and analytics.

### API Endpoints

| Method   | Route                 | Description                         |
| -------- | --------------------- | ----------------------------------- |
| `GET`    | `/api/tasks`          | List all tasks (with filters)       |
| `POST`   | `/api/tasks`          | Create a new task                   |
| `PATCH`  | `/api/tasks/:id`      | Update a task (edit, toggle status) |
| `DELETE` | `/api/tasks/:id`      | Delete a task                       |
| `GET`    | `/api/stats/overview` | Summary stats (counts, rates)       |
| `GET`    | `/api/stats/weekly`   | Daily created vs completed (7 days) |
| `GET`    | `/api/stats/monthly`  | Weekly trend (4 weeks)              |

### Steps

1. **Create Mongoose model** (`server/src/models/Task.ts`)
   - Define schema matching the Task interface
   - Add timestamps, indexes on `createdAt` and `status`

2. **Task CRUD controller** (`server/src/controllers/taskController.ts`)
   - `getAllTasks` — support query params: `status`, `priority`, `sort`
   - `createTask` — validate with Zod, set defaults
   - `updateTask` — auto-set `completedAt` when status changes to `completed`
   - `deleteTask` — simple delete by ID

3. **Stats controller** (`server/src/controllers/statsController.ts`)
   - `getOverview` — aggregate counts, completion rate, avg time-to-complete
   - `getWeeklyActivity` — group tasks by day for last 7 days
   - `getMonthlyTrend` — group completions by week for last 4 weeks

4. **Routes & middleware**
   - Wire up routes in `taskRoutes.ts` and `statsRoutes.ts`
   - Add global error handler middleware
   - Add request validation with Zod

5. **Verify:** Test all endpoints with `curl` or REST client

### Deliverables

- [x] Full CRUD API working
- [x] Stats aggregation endpoints returning correct data
- [x] Input validation on all endpoints
- [x] Error handling middleware

---

## Phase 3 — Frontend Core (Task Management UI)

**Goal:** Build the main task list interface — create, view, toggle, and delete tasks.

### Steps

1. **Design system** (`index.css`)
   - CSS custom properties for colors, spacing, typography
   - Dark theme as default (rich, modern look)
   - Import Inter font from Google Fonts

2. **API service layer** (`services/taskApi.ts`)
   - Axios instance with base URL
   - Typed functions: `getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`

3. **Shared types** (`types/task.ts`)
   - Mirror the backend Task interface
   - API request/response types

4. **Custom hook** (`hooks/useTasks.ts`)
   - State management for tasks list
   - CRUD operations that call API and update local state
   - Loading/error states

5. **Components**
   - `Sidebar.tsx` — Navigation between Tasks and Dashboard pages
   - `TaskForm.tsx` — Form to add new task (title, description, priority, due date)
   - `TaskCard.tsx` — Individual task display with checkbox, priority badge, delete button
   - `TaskList.tsx` — Renders filtered/sorted list of TaskCards

6. **TasksPage** (`pages/TasksPage.tsx`)
   - Layout: form at top, task list below
   - Filter tabs: All / Pending / Completed
   - Sort options: newest, oldest, priority

7. **Routing** (`App.tsx`)
   - React Router with `/tasks` and `/dashboard` routes
   - Sidebar + page layout

8. **Verify:** Can create, view, check off, and delete tasks through the UI

### Deliverables

- [x] Full task CRUD through the UI
- [x] Filter and sort tasks
- [x] Responsive layout
- [x] Smooth animations (checkbox, add/remove transitions)

---

## Phase 4 — Dashboard & Analytics

**Goal:** Build the stats dashboard with charts and summary cards.

### Steps

1. **Stats API service** — add `getOverview()`, `getWeekly()`, `getMonthly()` to `taskApi.ts`

2. **StatCard component** — Reusable card showing a single metric with icon, value, label, and optional trend indicator

3. **DashboardPage** (`pages/DashboardPage.tsx`)
   - **Top row:** 4–5 StatCards (created this week, completed, completion rate, pending, overdue)
   - **Charts row 1:** Weekly activity bar chart (created vs completed per day)
   - **Charts row 2:** Priority breakdown donut chart + Monthly trend line chart
   - Auto-refresh on mount

4. **Chart components** (using Recharts)
   - `WeeklyBarChart` — Grouped bar chart, 7 days
   - `PriorityPieChart` — Donut chart with custom legend
   - `MonthlyLineChart` — Line chart, 4 weeks

5. **Styling** — Dashboard-specific CSS with grid layout, card glassmorphism, subtle shadows

6. **Verify:** Dashboard shows accurate, live data matching the tasks in the database

### Deliverables

- [x] Summary stat cards with real data
- [x] 3 chart types rendering correctly
- [x] Responsive grid layout
- [x] Visual polish (glassmorphism, gradients, animations)

---

## Phase 5 — Polish & Extras

**Goal:** Final refinements, UX improvements, and nice-to-haves.

### Steps

1. **Toast notifications** — Success/error feedback on task actions (lightweight custom implementation, no library)
2. **Empty states** — Friendly illustrations/messages when no tasks exist
3. **Loading skeletons** — Pulse animations while data loads
4. **Keyboard shortcuts** — `N` to open new task form, `Esc` to close
5. **Task search** — Quick search/filter by title
6. **Confirmation dialogs** — Before deleting tasks
7. **README.md** — Setup instructions, screenshots, tech stack

### Deliverables

- [x] Polished UX with feedback and transitions
- [x] Empty and loading states
- [x] README with setup guide

---

## Assumptions Made

Since some questions weren't answered, I went with these defaults:

| Decision            | Choice                                         | Rationale                                  |
| ------------------- | ---------------------------------------------- | ------------------------------------------ |
| **Users**           | Single user, no auth                           | Keep it simple; can add auth later         |
| **Task properties** | Title, description, priority, due date, status | Rich enough for meaningful stats           |
| **Theme**           | Dark mode default                              | Modern, premium feel                       |
| **Charting**        | Recharts                                       | React-native, lightweight, good TS support |

> [!IMPORTANT]
> **MongoDB Atlas Setup Required:** You'll need to create a free MongoDB Atlas cluster and get the connection string before Phase 1 is complete. I can walk you through this if needed.

## Verification Plan

### Automated Tests

- Test all API endpoints with `curl` commands after Phase 2
- Verify MongoDB connection and data persistence
- Check frontend renders correctly with the dev server

### Manual Verification

- Create 10–15 tasks across different priorities and dates
- Complete some, leave others pending
- Verify dashboard stats match the actual data
- Test on different screen sizes for responsiveness
