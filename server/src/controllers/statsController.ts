import { Request, Response, NextFunction } from 'express';
import Task from '../models/Task.js';

// GET /api/stats/overview — Summary statistics
export const getOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      createdThisWeek,
      completedThisWeek,
      overdueTasks,
      createdToday,
      completedToday,
      trashCount,
      activeLongTermTasks,
    ] = await Promise.all([
      Task.countDocuments({ isDeleted: false }),
      Task.countDocuments({ status: 'completed', isDeleted: false }),
      Task.countDocuments({ status: 'pending', isDeleted: false }),
      Task.countDocuments({
        createdAt: { $gte: startOfWeek },
        isDeleted: false,
      }),
      Task.countDocuments({
        completedAt: { $gte: startOfWeek },
        isDeleted: false,
      }),
      Task.countDocuments({
        status: 'pending',
        dueDate: { $lt: now, $ne: null },
        isDeleted: false,
      }),
      Task.countDocuments({ createdAt: { $gte: today }, isDeleted: false }),
      Task.countDocuments({ completedAt: { $gte: today }, isDeleted: false }),
      Task.countDocuments({ isDeleted: true }),
      Task.countDocuments({ isDeleted: false, isLongTerm: true }),
    ]);

    // Calculate average time to complete (in hours)
    const avgTimeResult = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          isDeleted: false,
        },
      },
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
    const avgTimeToCompleteHours =
      Math.round((avgTimeToCompleteMs / (1000 * 60 * 60)) * 10) / 10;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const oldestTask = await Task.findOne({ isDeleted: false })
      .sort({ createdAt: 1 })
      .select('createdAt')
      .lean();
    let avgCompletedPerDay = 0;
    if (oldestTask && completedTasks > 0) {
      const daysSinceStart = Math.max(
        1,
        Math.ceil(
          (now.getTime() - oldestTask.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      avgCompletedPerDay =
        Math.round((completedTasks / daysSinceStart) * 10) / 10;
    }

    // Calculate Estimated vs Actual Time Ratio
    const estimationStats = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          estimatedMinutes: { $gt: 0 },
          isDeleted: false,
        },
      },
      {
        $project: {
          estimated: '$estimatedMinutes',
          actual: {
            $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 60000],
          }, // Actual in minutes
        },
      },
      {
        $group: {
          _id: null,
          totalEstimated: { $sum: '$estimated' },
          totalActual: { $sum: '$actual' },
        },
      },
    ]);

    let estimatedVsActualRatio = 0;
    if (estimationStats.length > 0 && estimationStats[0].totalActual > 0) {
      // ratio = estimated / actual (e.g. 1.0 = perfect, 0.5 = took twice as long, 2.0 = took half the time)
      estimatedVsActualRatio =
        Math.round(
          (estimationStats[0].totalEstimated / estimationStats[0].totalActual) *
            100,
        ) / 100;
    }

    // Calculate Current Streak
    const completedDates = await Task.aggregate([
      { $match: { status: 'completed', completedAt: { $ne: null }, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const distinctDates = completedDates.map((d: { _id: string }) => d._id);
    let currentStreak = 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (distinctDates.includes(todayStr) || distinctDates.includes(yesterdayStr)) {
      let checkDate = distinctDates.includes(todayStr) ? new Date() : yesterday;
      
      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (distinctDates.includes(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        createdThisWeek,
        completedThisWeek,
        overdueTasks,
        createdToday,
        completedToday,
        completionRate,
        avgTimeToCompleteHours,
        avgCompletedPerDay,
        estimatedVsActualRatio,
        trashCount,
        activeLongTermTasks,
        currentStreak,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/weekly — Daily created vs completed for last 7 days
export const getWeeklyActivity = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const days = 7;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [createdByDay, completedByDay] = await Promise.all([
      Task.aggregate([
        { $match: { createdAt: { $gte: startDate }, isDeleted: false } },
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
        {
          $match: {
            completedAt: { $gte: startDate, $ne: null },
            isDeleted: false,
          },
        },
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
    const createdMap = new Map(
      createdByDay.map((d: { _id: string; count: number }) => [d._id, d.count]),
    );
    const completedMap = new Map(
      completedByDay.map((d: { _id: string; count: number }) => [
        d._id,
        d.count,
      ]),
    );

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
export const getMonthlyTrend = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
          isDeleted: false,
        }),
        Task.countDocuments({
          completedAt: { $gte: weekStart, $lt: weekEnd, $ne: null },
          isDeleted: false,
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
export const getPriorityBreakdown = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      { $match: { isDeleted: false } },
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
export const getTagsBreakdown = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      { $match: { isDeleted: false } },
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

    const data = breakdown.map(
      (b: {
        _id: string;
        total: number;
        completed: number;
        pending: number;
      }) => ({
        tag: b._id,
        total: b.total,
        completed: b.completed,
        pending: b.pending,
      }),
    );

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/day-of-week — Productivity by day of week
export const getDayOfWeekStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$completedAt' },
          completed: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // MongoDB $dayOfWeek returns 1 (Sunday) to 7 (Saturday)
    const data = dayNames.map((day, index) => {
      const found = breakdown.find((b: { _id: number }) => b._id === index + 1);
      return {
        day,
        completed: found?.completed || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/velocity — Time to complete by priority
export const getVelocityStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          isDeleted: false,
        },
      },
      {
        $project: {
          priority: 1,
          timeTakenMs: { $subtract: ['$completedAt', '$createdAt'] },
        },
      },
      {
        $group: {
          _id: '$priority',
          fastest: { $min: '$timeTakenMs' },
          longest: { $max: '$timeTakenMs' },
          avg: { $avg: '$timeTakenMs' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const priorities = ['low', 'medium', 'high'];
    const data = priorities.map((p) => {
      const found = breakdown.find((b: { _id: string }) => b._id === p);
      return {
        priority: p,
        fastestHours: found?.fastest
          ? Math.round((found.fastest / 3600000) * 10) / 10
          : null,
        longestHours: found?.longest
          ? Math.round((found.longest / 3600000) * 10) / 10
          : null,
        avgHours: found?.avg
          ? Math.round((found.avg / 3600000) * 10) / 10
          : null,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/focus-drift — Estimated vs Actual time taken
export const getFocusDriftStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          estimatedMinutes: { $gt: 0 },
          isDeleted: false,
        },
      },
      {
        $project: {
          title: 1,
          estimated: '$estimatedMinutes',
          actual: {
            $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 60000],
          },
        },
      },
      { $limit: 10 }, // Last 10 tasks
      { $sort: { completedAt: -1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/tag-efficiency — Avg time to complete by tag
export const getTagEfficiencyStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          tags: { $exists: true, $ne: [] },
          isDeleted: false,
        },
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          avgMinutes: {
            $avg: {
              $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 60000],
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgMinutes: 1 } },
    ]);

    const data = stats.map((item: { _id: string; avgMinutes: number; count: number }) => ({
      tag: item._id,
      avgHours: Math.round((item.avgMinutes / 60) * 10) / 10,
      count: item.count,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
export const getTimeOfDayStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const breakdown = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $ne: null },
          isDeleted: false,
        },
      },
      {
        $project: {
          hour: { $hour: '$completedAt' },
        },
      },
      {
        $project: {
          bucket: {
            $cond: [
              { $and: [{ $gte: ['$hour', 6] }, { $lt: ['$hour', 12] }] },
              'Morning',
              {
                $cond: [
                  { $and: [{ $gte: ['$hour', 12] }, { $lt: ['$hour', 18] }] },
                  'Afternoon',
                  {
                    $cond: [
                      { $and: [{ $gte: ['$hour', 18] }, { $lt: ['$hour', 24] }] },
                      'Evening',
                      'Night',
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$bucket',
          count: { $sum: 1 },
        },
      },
    ]);

    const buckets = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const data = buckets.map((bucket) => {
      const found = breakdown.find((b: { _id: string }) => b._id === bucket);
      return {
        bucket,
        count: found?.count || 0,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
export const getHeatmapStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    const heatmap = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: oneYearAgo },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format for easier consumption by frontend
    const data = heatmap.map((item: { _id: string; count: number }) => ({
      date: item._id,
      count: item.count,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
