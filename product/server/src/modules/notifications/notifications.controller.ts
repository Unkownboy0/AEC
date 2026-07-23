import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';

export class NotificationsController {
  /**
   * List all notification logs
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.systemNotification.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({
        status: 'success',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create and send/schedule a notification
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, type, scheduledFor, imageUrl } = req.body;
      if (!title || !content || !type) {
        throw new BadRequestException('title, content and type are required');
      }

      const scheduleDate = scheduledFor ? new Date(scheduledFor) : null;
      const status = scheduleDate ? 'PENDING' : 'SENT';

      const notification = await prisma.systemNotification.create({
        data: {
          title,
          content,
          type,
          status,
          scheduledFor: scheduleDate,
          imageUrl,
        },
      });

      if (status === 'SENT') {
        console.log(`📣 [NOTIFICATION DISPATCHED] Type: ${type} | Title: ${title} | Content: ${content} | Image: ${imageUrl || 'None'}`);
      } else {
        console.log(`⏰ [NOTIFICATION SCHEDULED] Type: ${type} | For: ${scheduleDate}`);
      }

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          module: 'NOTIFICATION',
          description: `Dispatched notification campaign: ${title} (${type})${imageUrl ? ' with attachment' : ''}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        status: 'success',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete log
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.systemNotification.delete({
        where: { id: req.params.id },
      });
      res.status(200).json({
        status: 'success',
        message: 'Notification log cleared',
      });
    } catch (error) {
      next(error);
    }
  };
}
