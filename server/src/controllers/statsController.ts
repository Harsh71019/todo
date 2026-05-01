import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task.js';

// GET /api/stats/overview — Summary statistics
export const getOverview = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalTasks, completedTasks, pendingTasks, createdThisWeek, completedThisWeek, overdueTasks] =
      await Promise.all([
        Task.countDocuments(),
        Task.countDocuments({ status: 'completed' }),
        Task.countDocuments({ status: 'pending' }),
        Task.countDocuments({ createdAt: { $gte: startOfWeek } }),
        Task.countDocuments({ completedAt: { $gte: startOfWeek } }),
        Task.countDocuments({
          status: 'pending',
          dueDate: { $lt: now, $ne: null },
        }),
      ]);

    // Calculate average time to complete (in hours)
    const avgTimeResult = await Task.aggregate([
      { $match: { status: 'completed', completedAt: { $ne: null } } },
      {
        $project: {
          timeTaken: { $subtract: ['$completedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$timeTaken' },
        },
      },
    ]);

    const avgTimeToCompleteMs = avgTimeResult[0]?.avgTime || 0;
    const avgTimeToCompleteHours = Math.round(avgTimeToCompleteMs / (1000 * 60 * 60) * 10) / 10;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        createdThisWeek,
        completedThisWeek,
        overdueTasks,
        completionRate,
        avgTimeToCompleteHours,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/weekly — Daily created vs completed for last 7 days
export const getWeeklyActivity = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = 7;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [createdByDay, completedByDay] = await Promise.all([
      Task.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { completedAt: { $gte: startDate, $ne: null } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build a complete array for all 7 days
    const createdMap = new Map(createdByDay.map((d: { _id: string; count: number }) => [d._id, d.count]));
    const completedMap = new Map(completedByDay.map((d: { _id: string; count: number }) => [d._id, d.count]));

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];

      weeklyData.push({
        date: dateStr,
        day: dayName,
        created: createdMap.get(dateStr) || 0,
        completed: completedMap.get(dateStr) || 0,
      });
    }

    res.json({ success: true, data: weeklyData });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/monthly — Weekly completions trend for last 4 weeks
export const getMonthlyTrend = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const weeks = 4;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - weeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const weeklyData = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const [created, completed] = await Promise.all([
        Task.countDocuments({
          createdAt: { $gte: weekStart, $lt: weekEnd },
        }),
        Task.countDocuments({
          completedAt: { $gte: weekStart, $lt: weekEnd, $ne: null },
        }),
      ]);

      weeklyData.push({
        week: `Week ${i + 1}`,
        startDate: weekStart.toISOString().split('T')[0],
        created,
        completed,
      });
    }

    res.json({ success: true, data: weeklyData });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/priority — Tasks by priority breakdown
export const getPriorityBreakdown = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Ensure all priorities are represented
    const priorities = ['low', 'medium', 'high'];
    const data = priorities.map((p) => {
      const found = breakdown.find((b: { _id: string }) => b._id === p);
      return {
        priority: p,
        total: found?.total || 0,
        completed: found?.completed || 0,
        pending: found?.pending || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/tags — Tags breakdown with counts
export const getTagsBreakdown = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const data = breakdown.map((b: { _id: string; total: number; completed: number; pending: number }) => ({
      tag: b._id,
      total: b.total,
      completed: b.completed,
      pending: b.pending,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
