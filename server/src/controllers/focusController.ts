import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import FocusSession from '../models/FocusSession.js';
import Task from '../models/Task.js';
import { startSessionSchema, stopSessionSchema } from '../types/focus.js';

const POMODORO_SECONDS = 25 * 60;

// POST /api/focus/start
export const startSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { taskId } = startSessionSchema.parse(req.body);

    const task = await Task.findOne({ _id: taskId, userId: req.userId }).lean();
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    // Abandon only this user's active sessions
    await FocusSession.updateMany(
      { userId: req.userId, status: 'active' },
      { $set: { status: 'abandoned', endedAt: new Date() } },
    );

    const session = await FocusSession.create({
      userId: req.userId,
      taskId,
      startedAt: new Date(),
      status: 'active',
    });

    await Task.findByIdAndUpdate(taskId, { lastFocusedAt: session.startedAt });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// POST /api/focus/:sessionId/stop
export const stopSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = stopSessionSchema.parse(req.body);

    const session = await FocusSession.findOne({ _id: req.params.sessionId, userId: req.userId });
    if (!session) {
      res.status(404).json({ success: false, error: 'Session not found' });
      return;
    }
    if (session.status !== 'active') {
      res.status(400).json({ success: false, error: 'Session is not active' });
      return;
    }

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    const isPomodoro = durationSeconds >= POMODORO_SECONDS;

    session.endedAt = endedAt;
    session.durationSeconds = durationSeconds;
    session.isPomodoro = isPomodoro;
    session.status = status;
    await session.save();

    const inc: Record<string, number> = { totalFocusSeconds: durationSeconds };
    if (isPomodoro) inc.completedPomodoros = 1;
    await Task.findByIdAndUpdate(session.taskId, { $inc: inc });

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// GET /api/focus/active
export const getActiveSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await FocusSession.findOne({ userId: req.userId, status: 'active' })
      .populate('taskId')
      .lean();

    // Return data: null consistently — avoids special 204 handling on the client
    res.json({ success: true, data: session ?? null });
  } catch (error) {
    next(error);
  }
};

// GET /api/focus/task/:taskId
export const getSessionsByTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessions = await FocusSession.find({
      userId: req.userId,
      taskId: req.params.taskId,
      status: { $ne: 'active' },
    })
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/focus/stats/today
export const getFocusToday = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId!);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await FocusSession.aggregate([
      { $match: { userId: uid, startedAt: { $gte: startOfDay }, status: { $ne: 'active' } } },
      {
        $group: {
          _id: null,
          totalSeconds: { $sum: '$durationSeconds' },
          totalSessions: { $sum: 1 },
          totalPomodoros: { $sum: { $cond: ['$isPomodoro', 1, 0] } },
        },
      },
    ]);

    const data = result[0] ?? { totalSeconds: 0, totalSessions: 0, totalPomodoros: 0 };
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/focus/stats/weekly
export const getFocusWeekly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId!);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const result = await FocusSession.aggregate([
      { $match: { userId: uid, startedAt: { $gte: sevenDaysAgo }, status: { $ne: 'active' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
          totalSeconds: { $sum: '$durationSeconds' },
          pomodoros: { $sum: { $cond: ['$isPomodoro', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: result.map((r) => ({ date: r._id, totalSeconds: r.totalSeconds, pomodoros: r.pomodoros })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/focus/stats/by-task
export const getFocusByTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId!);
    const result = await FocusSession.aggregate([
      { $match: { userId: uid, status: { $ne: 'active' } } },
      {
        $group: {
          _id: '$taskId',
          totalSeconds: { $sum: '$durationSeconds' },
          pomodoros: { $sum: { $cond: ['$isPomodoro', 1, 0] } },
          sessions: { $sum: 1 },
        },
      },
      { $sort: { totalSeconds: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'tasks', localField: '_id', foreignField: '_id', as: 'task' } },
      { $unwind: '$task' },
      { $project: { taskId: '$_id', title: '$task.title', totalSeconds: 1, pomodoros: 1, sessions: 1 } },
    ]);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
