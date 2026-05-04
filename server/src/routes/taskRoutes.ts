import { Router } from 'express';
import {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
  archiveTask,
  unarchiveTask,
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAllTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.patch('/:id/restore', restoreTask);
router.patch('/:id/archive', archiveTask);
router.patch('/:id/unarchive', unarchiveTask);
router.delete('/:id', deleteTask);
router.delete('/:id/permanent', permanentlyDeleteTask);

export default router;
