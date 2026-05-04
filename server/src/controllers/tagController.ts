import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import Tag from '../models/Tag.js';
import Task from '../models/Task.js';
import { createTagSchema, updateTagSchema } from '../types/tag.js';

// GET /api/tags — List all tags with task usage count
export const getAllTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tags = await Tag.find({ userId: req.userId }).sort({ name: 1 }).lean();

    const taskCounts = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId!), isDeleted: false } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        },
      },
    ]);

    const countMap = new Map(
      taskCounts.map((t: { _id: string; total: number; completed: number; pending: number }) => [
        t._id,
        { total: t.total, completed: t.completed, pending: t.pending },
      ]),
    );

    const data = tags.map((tag) => ({
      ...tag,
      taskCount: countMap.get(tag.name)?.total || 0,
      completedCount: countMap.get(tag.name)?.completed || 0,
      pendingCount: countMap.get(tag.name)?.pending || 0,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/tags — Create a new tag
export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validated = createTagSchema.parse(req.body);

    const tag = await Tag.create({ ...validated, userId: req.userId });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    // Duplicate key — tag name already exists for this user
    if ((error as any).code === 11000) {
      res.status(409).json({ success: false, error: `Tag "${req.body.name}" already exists` });
      return;
    }
    next(error);
  }
};

// PATCH /api/tags/:id — Update tag (rename, recolor, toggle default, edit description)
export const updateTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validated = updateTagSchema.parse(req.body);

    const tag = await Tag.findOne({ _id: req.params.id, userId: req.userId });
    if (!tag) {
      res.status(404).json({ success: false, error: 'Tag not found' });
      return;
    }

    const oldName = tag.name;

    if (validated.name && validated.name !== oldName) {
      // Use a session+transaction so the cascade and rename are atomic
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          await Task.updateMany(
            { tags: oldName, userId: req.userId },
            { $set: { 'tags.$[elem]': validated.name } },
            { arrayFilters: [{ elem: oldName }], session },
          );
          Object.assign(tag, validated);
          await tag.save({ session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      Object.assign(tag, validated);
      await tag.save();
    }

    res.json({ success: true, data: tag });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    if ((error as any).code === 11000) {
      res.status(409).json({ success: false, error: `Tag "${req.body.name}" already exists` });
      return;
    }
    next(error);
  }
};

// DELETE /api/tags/:id — Delete tag and remove from all tasks
export const deleteTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tag = await Tag.findOne({ _id: req.params.id, userId: req.userId });
    if (!tag) {
      res.status(404).json({ success: false, error: 'Tag not found' });
      return;
    }

    const session = await mongoose.startSession();
    let modifiedCount = 0;
    try {
      await session.withTransaction(async () => {
        const result = await Task.updateMany(
          { tags: tag.name, userId: req.userId },
          { $pull: { tags: tag.name } },
          { session },
        );
        modifiedCount = result.modifiedCount;
        await Tag.findByIdAndDelete(req.params.id, { session });
      });
    } finally {
      await session.endSession();
    }

    res.json({
      success: true,
      message: `Tag "${tag.name}" deleted and removed from ${modifiedCount} task(s)`,
    });
  } catch (error) {
    next(error);
  }
};
