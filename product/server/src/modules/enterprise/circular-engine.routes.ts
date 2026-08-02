import { Router } from 'express';
import { CircularEngineController } from './circular-engine.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new CircularEngineController();

router.use(requireAuth);

router.post('/', requirePermissionGuard('circulars', 'create'), controller.publish);
router.get('/', requirePermissionGuard('circulars', 'view'), controller.getMyCirculars);
router.post('/:id/read', requirePermissionGuard('circulars', 'view'), controller.markAsRead);
router.get('/:id/analytics', requirePermissionGuard('circulars', 'view'), controller.getAnalytics);

export default router;
