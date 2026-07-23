import { Router } from 'express';
import { NotificationsController } from './notifications.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new NotificationsController();

router.get('/', requireAuth, requirePermission('notifications:read'), controller.list);
router.post('/', requireAuth, requirePermission('notifications:write'), controller.create);
router.delete('/:id', requireAuth, requirePermission('notifications:write'), controller.delete);

export default router;
