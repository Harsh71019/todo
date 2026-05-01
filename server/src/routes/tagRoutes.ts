import { Router } from 'express';
import { getAllTags, createTag, updateTag, deleteTag } from '../controllers/tagController.js';

const router = Router();

router.get('/', getAllTags);
router.post('/', createTag);
router.patch('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
