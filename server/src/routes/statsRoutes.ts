import { Router } from 'express';
import {
  getOverview,
  getWeeklyActivity,
  getMonthlyTrend,
  getPriorityBreakdown,
  getTagsBreakdown,
  getDayOfWeekStats,
  getVelocityStats,
} from '../controllers/statsController.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/weekly', getWeeklyActivity);
router.get('/monthly', getMonthlyTrend);
router.get('/priority', getPriorityBreakdown);
router.get('/tags', getTagsBreakdown);
router.get('/day-of-week', getDayOfWeekStats);
router.get('/velocity', getVelocityStats);

export default router;
