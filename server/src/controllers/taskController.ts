import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task.js';
import Tag from '../models/Tag.js';
import { createTaskSchema, updateTaskSchema } from '../types/task.js';
import { ZodError } from 'zod';

// GET /api/tasks — List all tasks with optional filters
export const getAllTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, sort = '-createdAt', search, tag, view = 'active' } = req.query;

    const filter: Record<string, unknown> = { userId: req.userId };

    // View Filtering Logic
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (view === 'trash') {
      filter.isDeleted = true;
    } else if (view === 'completed') {
      filter.isDeleted = false;
      filter.status = 'completed';
    } else if (view === 'archive') {
      filter.isDeleted = false;
      filter.isArchived = true;
    } else {
      // view === 'active'
      filter.isDeleted = false;
      filter.isArchived = { $ne: true };
      filter.$or = [
        { status: 'pending' },
        { completedAt: { $gte: startOfToday } },
      ];
    }

    // Only apply status filter when it won't conflict with the active-view $or
    if (status && (status === 'pending' || status === 'completed') && view !== 'active') {
      filter.status = status;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority as string)) {
      filter.priority = priority;
    }
    if (tag && typeof tag === 'string') {
      filter.tags = tag;
    }
    if (search && typeof search === 'string') {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = { $regex: escaped, $options: 'i' };
      filter.$and = [
        ...(Array.isArray(filter.$and) ? filter.$and : []),
        { $or: [{ title: re }, { description: re }] },
      ];
    }

    const tasks = await Task.find(filter).sort(sort as string).lean();

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks — Create a new task
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = createTaskSchema.parse(req.body);

    // Inject default tags scoped to this user (deduplicated, respect max-5 limit)
    const defaultTags = await Tag.find({ userId: req.userId, isDefault: true }).select('name').lean();
    const defaultTagNames = defaultTags.map((t) => t.name);
    const userTags = validated.tags || [];
    // Only inject defaults that fit without dropping user tags
    const mergedTags = userTags.length >= 5
      ? userTags
      : Array.from(new Set([...userTags, ...defaultTagNames])).slice(0, 5);

    const task = await Task.create({
      ...validated,
      userId: req.userId,
      tags: mergedTags,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    next(error);
  }
};

// PATCH /api/tasks/:id — Update a task
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = updateTaskSchema.parse(req.body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.status === 'completed') {
      updateData.completedAt = new Date();
    } else if (validated.status === 'pending') {
      updateData.completedAt = null;
    }

    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    // Only update tasks belonging to this user that are not deleted
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true },
    ).lean();

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    next(error);
  }
};

// DELETE /api/tasks/:id — Soft delete a task (move to trash)
export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task moved to trash' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/restore — Restore a soft-deleted task
export const restoreTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true },
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found in trash' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id/permanent — Permanently delete a task
export const permanentlyDeleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task permanently deleted' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/archive — Move a task to archive
export const archiveTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDeleted: false },
      { isArchived: true },
      { new: true },
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/unarchive — Restore a task from archive
export const unarchiveTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, isDeleted: false },
      { isArchived: false },
      { new: true },
    );

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};
