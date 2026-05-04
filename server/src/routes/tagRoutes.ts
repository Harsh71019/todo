import { Router } from 'express';
import { getAllTags, createTag, updateTag, deleteTag } from '../controllers/tagController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAllTags);
router.post('/', createTag);
router.patch('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
