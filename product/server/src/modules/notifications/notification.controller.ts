import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const category = req.query.category ? String(req.query.category) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;
      const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

      const result = await NotificationService.getUserNotifications(userId, {
        page,
        limit,
        category,
        search,
        isRead,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await NotificationService.getUnreadCount(userId);
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notification = await NotificationService.markAsRead(req.params.notificationId, userId);
      res.status(200).json({ status: 'success', data: notification });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await NotificationService.markAllAsRead(userId);
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  }

  static async registerDeviceToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { token, platform, deviceId } = req.body;
      const device = await NotificationService.registerDeviceToken(userId, token, platform, deviceId);
      res.status(200).json({ status: 'success', data: device });
    } catch (error) {
      next(error);
    }
  }

  static async triggerSelfTest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { title, message, eventType, deepLinkRoute } = req.body || {};
      const notification = await NotificationService.sendNotification({
        recipientId: userId,
        eventType: eventType || 'CAMPUS_ANNOUNCEMENT',
        title: title || '🔔 Campus Notification Alert',
        message: message || 'Live event push notification triggered successfully!',
        priority: 'HIGH',
        deepLinkRoute: deepLinkRoute || '/notifications',
      });
      res.status(200).json({ status: 'success', data: notification });
    } catch (error) {
      next(error);
    }
  }

  static async clearOne(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.clearOne(req.params.notificationId, (req as any).user.id);
      res.status(200).json({ status: 'success' });
    } catch (error) { next(error); }
  }

  static async clearAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.clearAll((req as any).user.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const pref = await NotificationService.getPreferences(userId);
      res.status(200).json({ status: 'success', data: pref });
    } catch (error) { next(error); }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const pref = await NotificationService.updatePreferences(userId, req.body);
      res.status(200).json({ status: 'success', data: pref });
    } catch (error) { next(error); }
  }

  static async acknowledge(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notification = await NotificationService.acknowledgeNotification(req.params.notificationId, userId);
      res.status(200).json({ status: 'success', data: notification });
    } catch (error) { next(error); }
  }

  static async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { NotificationAdminService } = await import('./notification-admin.service');
      const metrics = await NotificationAdminService.getHealthDashboard();
      res.status(200).json({ status: 'success', data: metrics });
    } catch (error) { next(error); }
  }

  static async sendTestPush(req: Request, res: Response, next: NextFunction) {
    try {
      const { NotificationAdminService } = await import('./notification-admin.service');
      const actorUserId = (req as any).user.id;
      const result = await NotificationAdminService.sendTestPush(req.body, actorUserId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }

  static async getDeliveryLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { NotificationAdminService } = await import('./notification-admin.service');
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 25;
      const eventType = req.query.eventType ? String(req.query.eventType) : undefined;
      const deliveryState = req.query.deliveryState ? String(req.query.deliveryState) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await NotificationAdminService.getDeliveryLogs({
        page,
        limit,
        eventType,
        deliveryState,
        search,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) { next(error); }
  }

  static async retryDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const { NotificationAdminService } = await import('./notification-admin.service');
      const { notificationId } = req.params;
      const result = await NotificationAdminService.retryDelivery(notificationId);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) { next(error); }
  }
}
