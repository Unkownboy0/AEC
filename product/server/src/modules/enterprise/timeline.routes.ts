import { Router } from 'express';
import { TimelineController } from './timeline.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new TimelineController();

router.use(requireAuth);

router.get('/', requirePermissionGuard('reports', 'view'), controller.getFeed);

export default router;
