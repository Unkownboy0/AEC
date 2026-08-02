import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:notificationId/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.post('/device-tokens', NotificationController.registerDeviceToken);

export default router;
