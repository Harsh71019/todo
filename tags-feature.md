# Tags Management — Phased Implementation Plan (v2)

## Architecture Decision: Hybrid Tag Model

```
Tag Collection (MongoDB)      Task Collection (existing)
────────────────────────      ──────────────────────────
_id: ObjectId                 tags: [String]  ← stores tag names as strings
name: String (unique)            "work", "urgent", "personal"
color: String (#hex)
isDefault: Boolean            No ObjectId refs — keeps GET /tasks fast
description: String?             (no $lookup join needed on every fetch)
createdAt / updatedAt
```

**Default Tags**: When `isDefault: true`, the `createTask` backend endpoint automatically injects that tag into any new task (unless already present).

---

## Phase 1 — Backend

### 1a. New `Tag` Model (`server/src/models/Tag.ts`)

```ts
{
  name: String; // unique, lowercase, trimmed, max 30 chars
  color: String; // hex color, e.g. "#3b82f6", default "#6366f1"
  isDefault: Boolean; // auto-applied to new tasks
  description: String; // optional, max 100 chars
}
```

Index: `{ name: 1 }` (unique)

### 1b. New `tagController.ts`

| Handler      | Method | Path            | What it does                                                                  |
| ------------ | ------ | --------------- | ----------------------------------------------------------------------------- |
| `getAllTags` | GET    | `/api/tags`     | All tags + task count per tag                                                 |
| `createTag`  | POST   | `/api/tags`     | Create new tag (name, color, isDefault, description)                          |
| `updateTag`  | PATCH  | `/api/tags/:id` | Rename, recolor, toggle isDefault, edit description. Cascade rename to tasks. |
| `deleteTag`  | DELETE | `/api/tags/:id` | Delete tag + `$pull` from all tasks                                           |

### 1c. Update `taskController.ts` — `createTask`

After validating payload, query `Tag.find({ isDefault: true })` and merge their names into the task's `tags[]` (deduped, max 5).

### 1d. New `tagRoutes.ts` + register at `/api/tags` in `index.ts`

### Zod validation

- `name`: 1-30 chars, `/^[a-z0-9-_]+$/i`
- `color`: valid hex `/#[0-9a-fA-F]{6}/`
- `isDefault`: boolean
- `description`: max 100 chars, optional

---

## Phase 2 — Frontend Services

### 2a. `client/src/services/tagApi.ts`

```ts
getAllTags()                         → Tag[]
createTag(payload)                   → Tag
updateTag(id, payload)               → Tag
deleteTag(id)                        → void
```

### 2b. `client/src/types/tag.ts`

```ts
interface Tag {
  _id: string;
  name: string;
  color: string;
  isDefault: boolean;
  description?: string;
  taskCount?: number; // populated by GET /api/tags aggregation
}
```

### 2c. `client/src/hooks/useTags.ts`

```ts
const { tags, loading, createTag, updateTag, deleteTag } = useTags();
```

- Inline async effect pattern (same as useTasks — no cascading render warning)
- Toast notifications on all CRUD ops
- Optimistic UI: remove tag from list immediately on delete, restore on error

---

## Phase 3 — Frontend UI

### 3a. `client/src/pages/TagsPage.tsx`

```
┌─────────────────────────────────────────────────────┐
│  🏷️ Tags          [+ New Tag]                        │
│  Create and manage labels for your tasks             │
├─────────────────────────────────────────────────────┤
│  [Search tags...]                                    │
├─────────────────────────────────────────────────────┤
│  ● work          12 tasks  ★ default  [Edit][Delete] │
│  ● personal       8 tasks             [Edit][Delete] │
│  ● urgent         3 tasks  ★ default  [Edit][Delete] │
│  ● learning       1 task              [Edit][Delete] │
└─────────────────────────────────────────────────────┘
```

- **Color dot** beside each tag name (from `tag.color`)
- **Task count badge** (aggregated by backend)
- **★ default badge** for `isDefault: true` tags
- **Inline edit form** (slide open on click) with color picker, name, description, default toggle
- **Delete confirmation** inline: "This will remove from X tasks. [Cancel] [Confirm Delete]"
- **Empty state**: "No tags yet. Create your first tag to start organizing."

### 3b. `CreateTagModal.tsx`

A small slide-in form:

- Tag name input (validates uniqueness client-side against existing tags)
- Color picker (8 preset hex swatches + custom input)
- Description (optional)
- "Set as default" toggle with tooltip explaining what it does
- Submit button

### 3c. Sidebar + App.tsx

- Add `🏷️ Tags` nav link in sidebar (between Tasks and Dashboard)
- Add `<Route path="/tags" element={<TagsPage />} />` in App.tsx

---

## Execution Order

```
Phase 1 — Backend (no frontend changes)
  ├── Tag.ts              ← new Mongoose model
  ├── tagController.ts    ← CRUD + cascade rename/delete
  ├── tagRoutes.ts        ← REST routes
  └── index.ts            ← register /api/tags
      taskController.ts   ← inject default tags on createTask

Phase 2 — Frontend Services
  ├── tag.ts (types)
  ├── tagApi.ts
  └── useTags.ts

Phase 3 — Frontend UI
  ├── TagsPage.tsx
  ├── CreateTagModal.tsx (or inline in TagsPage)
  ├── Sidebar.tsx         ← add nav link
  └── App.tsx             ← add route
```

> [!TIP]
> Say **"implement phase 1"**, **"implement phase 2"**, or **"implement phase 3"** to proceed.
