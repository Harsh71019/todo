import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task.js';
import Tag from '../models/Tag.js';
import { createTaskSchema, updateTaskSchema } from '../types/task.js';
import { ZodError } from 'zod';

// GET /api/tasks — List all tasks with optional filters
export const getAllTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, priority, sort = '-createdAt', search, tag, view = 'active' } = req.query;

    const filter: Record<string, unknown> = {};

    // View Filtering Logic
    if (view === 'trash') {
      filter.isDeleted = true;
    } else if (view === 'archive') {
      filter.isDeleted = false; // Show everything not in trash
    } else {
      // view === 'active'
      filter.isDeleted = false;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      filter.$or = [
        { isLongTerm: true }, // Keep long-term tasks always
        { createdAt: { $gt: oneDayAgo } } // Keep tasks created within the last 24 hours
      ];
    }

    if (status && (status === 'pending' || status === 'completed')) {
      filter.status = status;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority as string)) {
      filter.priority = priority;
    }
    if (tag && typeof tag === 'string') {
      filter.tags = tag;
    }
    if (search && typeof search === 'string') {
      filter.title = { $regex: search, $options: 'i' };
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

    // Inject default tags (deduplicated, respect max-5 limit)
    const defaultTags = await Tag.find({ isDefault: true }).select('name').lean();
    const defaultTagNames = defaultTags.map((t) => t.name);
    const mergedTags = Array.from(
      new Set([...(validated.tags || []), ...defaultTagNames]),
    ).slice(0, 5);

    const task = await Task.create({
      ...validated,
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

    // If status is being changed to 'completed', set completedAt
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.status === 'completed') {
      updateData.completedAt = new Date();
    } else if (validated.status === 'pending') {
      updateData.completedAt = null;
    }

    // Handle dueDate conversion
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

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
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
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

// DELETE /api/tasks/:id/permanent — Permanently delete a task
export const permanentlyDeleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, message: 'Task permanently deleted' });
  } catch (error) {
    next(error);
  }
};
