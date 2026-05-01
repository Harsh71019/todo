# Taskflow: Advanced Todo List App with Analytics

A full-stack, modern Todo List application built with a premium design system, rich analytics, and comprehensive task management features. It allows users to track tasks, organize them with tags and priorities, and view productivity metrics through an interactive dashboard.

## 🚀 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Routing**: React Router DOM
- **Styling**: Vanilla CSS (Custom Dark Theme Design System, Glassmorphism)
- **Charts**: Recharts (for Analytics Dashboard)
- **API Client**: Axios

### Backend
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: MongoDB Atlas
- **ODM**: Mongoose
- **Validation**: Zod (for request payload validation)
- **Execution**: `tsx` (TypeScript execution and hot-reloading)

---

## ✨ Features

- **Task Management**: Create, view, complete, and delete tasks.
- **Categorization**: Add up to 5 custom tags per task for easy grouping.
- **Prioritization**: Set tasks as Low, Medium, or High priority.
- **Due Dates**: Assign deadlines and get visual indicators for overdue tasks.
- **Advanced Filtering & Sorting**: Filter by status or tag, and search by title. Sort by newest, oldest, or priority.
- **Analytics Dashboard**: 
  - **Overview Stats**: Track total, pending, completed, and overdue tasks.
  - **Completion Metrics**: View completion rate and average time taken to complete tasks.
  - **Weekly Activity Chart**: Bar chart showing tasks created vs. completed over the last 7 days.
  - **Priority Breakdown**: Donut chart displaying task distribution by priority level.
  - **Monthly Trend**: Line chart illustrating productivity over the last 4 weeks.
- **Beautiful UI/UX**: Custom-built, responsive dark theme with smooth animations, loading skeletons, and empty states.

---

## 📂 Project Structure

```text
Todo/
├── client/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components (TaskCard, TaskForm, Sidebar, StatCard)
│   │   ├── hooks/              # Custom React hooks (useTasks for state management)
│   │   ├── pages/              # Main views (TasksPage, DashboardPage)
│   │   ├── services/           # API integration layer (taskApi.ts)
│   │   ├── types/              # Shared TypeScript interfaces
│   │   ├── App.tsx             # App shell and routing
│   │   └── index.css           # Global design system and component styles
│   └── vite.config.ts          # Vite config with API proxy
│
└── server/                     # Backend (Node.js + Express)
    ├── src/
    │   ├── config/             # Database connection setup
    │   ├── controllers/        # Business logic (taskController, statsController)
    │   ├── middleware/         # Express middlewares (errorHandler)
    │   ├── models/             # Mongoose schemas (Task model)
    │   ├── routes/             # API route definitions
    │   ├── types/              # Shared TypeScript types & Zod schemas
    │   └── index.ts            # Server entry point
    └── .env                    # Environment variables (MongoDB URI, Port)
```

---

## 🔌 API Endpoints

### Tasks API (`/api/tasks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Get all tasks (Supports `status`, `priority`, `tag`, `search`, `sort` query params) |
| `POST` | `/` | Create a new task |
| `PATCH` | `/:id` | Update an existing task (e.g., mark as completed) |
| `DELETE`| `/:id` | Delete a task |

### Stats API (`/api/stats`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/overview` | Get summary counts and averages |
| `GET` | `/weekly` | Get created vs completed data for the last 7 days |
| `GET` | `/monthly` | Get productivity trends for the last 4 weeks |
| `GET` | `/priority` | Get task distribution across priority levels |
| `GET` | `/tags` | Get task distribution across different tags |

---

## 🛠️ How It Works (Architecture)

1. **The Data Flow**: When a user interacts with the UI (e.g., adds a task), the custom `useTasks` hook calls the `taskApi` service. 
2. **Proxy**: Vite's dev server (`vite.config.ts`) proxies all `/api/*` requests to the Express backend running on port 5001, avoiding CORS issues during development.
3. **Backend Processing**: Express routes the request to the appropriate controller. 
4. **Validation**: `Zod` validates the incoming payload before it reaches the database.
5. **Database**: `Mongoose` interacts with MongoDB Atlas to store or retrieve the data. Timestamps (`createdAt`, `completedAt`) are automatically managed, which powers the rich analytics dashboard.
6. **Analytics Engine**: The backend utilizes MongoDB Aggregation Pipelines to process raw task data into meaningful statistics (averages, counts, groupings) before sending it to the frontend charts.

---

## 🏃‍♂️ Getting Started

### 1. Prerequisites
- Node.js installed
- A MongoDB Atlas account and cluster

### 2. Environment Setup
Navigate to the `server/` directory and ensure your `.env` file is properly configured:
```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/todo-app?retryWrites=true&w=majority
```
*(Note: If your password contains special characters like `@`, be sure to URL-encode them, e.g., `%40`)*

### 3. Running the App (Development)

You need two terminal windows to run the frontend and backend simultaneously.

**Terminal 1: Start the Backend**
```bash
cd server
npm install
npm run dev
```

**Terminal 2: Start the Frontend**
```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.
