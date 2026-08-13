import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/:notificationId/read', NotificationController.markAsRead);
router.post('/:notificationId/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', NotificationController.updatePreferences);
router.post('/preferences', NotificationController.updatePreferences);
router.delete('/clear-all', NotificationController.clearAll);
router.delete('/:notificationId', NotificationController.clearOne);
router.post('/device-tokens', NotificationController.registerDeviceToken);

export default router;
