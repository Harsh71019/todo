import { Router } from 'express';
import {
  getOverview,
  getWeeklyActivity,
  getMonthlyTrend,
  getPriorityBreakdown,
  getTagsBreakdown,
} from '../controllers/statsController.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/weekly', getWeeklyActivity);
router.get('/monthly', getMonthlyTrend);
router.get('/priority', getPriorityBreakdown);
router.get('/tags', getTagsBreakdown);

export default router;
