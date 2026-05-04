import { Router } from 'express';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleActive,
} from '../controllers/subscriptionController';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.get('/', getSubscriptions);
router.post('/', createSubscription);
router.patch('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);
router.patch('/:id/toggle', toggleActive);

export default router;
