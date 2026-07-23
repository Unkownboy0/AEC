import { Router } from 'express';
import { CircularController } from './circular.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new CircularController();

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.post('/:id/read', controller.markRead);
router.get('/:id/stats', controller.getStats);

export default router;
