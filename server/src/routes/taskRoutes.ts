import { Router } from 'express';
import { getAllTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', getAllTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
