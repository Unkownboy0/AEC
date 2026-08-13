import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await NotificationService.getUserNotifications(userId, page, limit);
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
}
