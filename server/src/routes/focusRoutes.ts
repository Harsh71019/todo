import { Router } from 'express';
import {
  startSession,
  stopSession,
  getActiveSession,
  getSessionsByTask,
  getFocusToday,
  getFocusWeekly,
  getFocusByTask,
} from '../controllers/focusController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.post('/start', startSession);
router.post('/:sessionId/stop', stopSession);
router.get('/active', getActiveSession);
router.get('/task/:taskId', getSessionsByTask);
router.get('/stats/today', getFocusToday);
router.get('/stats/weekly', getFocusWeekly);
router.get('/stats/by-task', getFocusByTask);

export default router;
