import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getOverview,
  getWeeklyActivity,
  getMonthlyTrend,
  getPriorityBreakdown,
  getTagsBreakdown,
  getDayOfWeekStats,
  getVelocityStats,
  getHeatmapStats,
  getTimeOfDayStats,
  getFocusDriftStats,
  getTagEfficiencyStats,
} from '../controllers/statsController.js';

const router = Router();

router.use(requireAuth);

router.get('/overview', getOverview);
router.get('/weekly', getWeeklyActivity);
router.get('/monthly', getMonthlyTrend);
router.get('/priority', getPriorityBreakdown);
router.get('/tags', getTagsBreakdown);
router.get('/day-of-week', getDayOfWeekStats);
router.get('/velocity', getVelocityStats);
router.get('/heatmap', getHeatmapStats);
router.get('/time-of-day', getTimeOfDayStats);
router.get('/focus-drift', getFocusDriftStats);
router.get('/tag-efficiency', getTagEfficiencyStats);

export default router;
