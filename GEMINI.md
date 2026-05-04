# Taskflow: Advanced Todo List & Analytics

A modern, full-stack task management application featuring a rich analytics dashboard, custom design system, and cross-platform (Web & Desktop) support.

## 🏗️ Architecture

- **Frontend**: React 19 SPA powered by Vite and TypeScript.
- **Backend**: Express 5 REST API using TypeScript and MongoDB Atlas (Mongoose).
- **Desktop**: Electron integration (entry point: `server/main.cjs`).
- **State Management**: Encapsulated in custom React hooks (`useTasks`, `useTags`) within the `client/src/hooks/` directory.

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- MongoDB Atlas cluster

### Local Development
Run both services simultaneously in separate terminals:

**Server (Port 5001)**
```bash
cd server
npm install
npm run dev        # Uses tsx watch for hot-reloading
```

**Client (Port 5173)**
```bash
cd client
npm install
npm run dev        # Uses Vite HMR
```

### Environment Setup
Create a `server/.env` file:
```env
PORT=5001
MONGODB_URI=your_mongodb_atlas_uri
CLIENT_URL=http://localhost:5173
```

## 🛠️ Development Conventions

### Coding Standards
- **Strong Typing**: Absolute adherence to TypeScript. Avoid `any` at all costs.
- **State via Hooks**: Always use `useTasks()` or `useTags()` to interact with data. Avoid direct API calls in components.
- **Validation**: All backend inputs are validated with Zod schemas (found in `server/src/types/`).
- **Vanilla CSS**: The project uses a custom design system with CSS variables and tokens in `client/src/index.css`.

### Data Patterns
- **Soft Deletes**: Tasks are never hard-deleted by default. They use `isDeleted` and `deletedAt` flags.
- **Tag Management**: Tags are stored as an array of strings (names) on tasks to simplify querying and avoid complex joins. Renames cascade via `tagController`.
- **Analytics**: Statistics are generated using raw MongoDB Aggregation Pipelines in `statsController.ts`.

### Project Structure
```text
Todo/
├── client/                     # React + Vite + TypeScript
│   ├── src/
│   │   ├── hooks/              # Business logic & state (useTasks, useTags)
│   │   ├── services/           # Axios API layer
│   │   ├── pages/              # Main view components
│   │   └── index.css           # Design system & global styles
└── server/                     # Express + TypeScript
    ├── src/
    │   ├── controllers/        # Business logic & Aggregation
    │   ├── models/             # Mongoose schemas
    │   └── types/              # Zod schemas & shared interfaces
```

## 📦 Building & Distribution

### Production Build
1. Build the client: `cd client && npm run build`
2. The server serves the build from `server/public/` in production mode.

### Electron Desktop App
```bash
cd server
npm run package-mac             # Builds DMG for macOS
```

## ⚠️ Important Gotchas
- **Vite Proxy**: In development, Vite proxies `/api/*` to the Express server. No hardcoded ports in frontend code.
- **CommonJS/ESM**: The server uses ESM, but the Electron entry point (`main.cjs`) is CommonJS. Maintain compatibility when editing server entry files.
- **Tag Storage**: Always use tag *names*, not `_id`, when associating tags with tasks.
