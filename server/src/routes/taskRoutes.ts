import { Router } from 'express';
import { getAllTasks, createTask, updateTask, deleteTask, permanentlyDeleteTask } from '../controllers/taskController.js';

const router = Router();

router.get('/', getAllTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.delete('/:id/permanent', permanentlyDeleteTask);

export default router;
