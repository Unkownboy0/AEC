import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/badges', NotificationController.getBadgeSummary);
router.patch('/:notificationId/read', NotificationController.markAsRead);
router.post('/:notificationId/read', NotificationController.markAsRead);
router.post('/:notificationId/acknowledge', NotificationController.acknowledge);
router.post('/read-all', NotificationController.markAllAsRead);
router.get('/preferences', NotificationController.getPreferences);
router.patch('/preferences', NotificationController.updatePreferences);
router.post('/preferences', NotificationController.updatePreferences);
router.delete('/clear-all', NotificationController.clearAll);
router.delete('/:notificationId', NotificationController.clearOne);
router.post('/device-tokens', NotificationController.registerDeviceToken);
router.post('/devices', NotificationController.registerDeviceToken);
router.post('/trigger-self-test', NotificationController.triggerSelfTest);

// Super Admin Diagnostic & Health Dashboard
router.get('/admin/dashboard', NotificationController.getAdminDashboard);
router.post('/admin/test-dispatch', NotificationController.sendTestPush);
router.get('/admin/delivery-logs', NotificationController.getDeliveryLogs);
router.post('/admin/retry-delivery/:notificationId', NotificationController.retryDelivery);

export default router;
