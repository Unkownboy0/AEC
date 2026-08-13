import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

/**
 * Campus activity persistence has not yet been modelled in Prisma. These endpoints
 * intentionally return honest empty states until authoritative records exist.
 */
export class ActivityController {
  getAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await prisma.department.findMany({
        where: { archived: false },
        select: { name: true, code: true }
      });

      res.status(200).json({
        status: 'success',
        data: {
          kpis: {
            totalActivities: 0,
            activeActivities: 0,
            completedActivities: 0,
            upcomingActivities: 0,
            cancelledActivities: 0,
            totalParticipants: 0,
            studentParticipationPct: null,
            facultyParticipationPct: null,
            technicalEvents: 0,
            culturalEvents: 0,
            sportsEvents: 0,
            workshops: 0,
            seminars: 0,
            guestLectures: 0,
            industrialVisits: 0,
            placementDrives: 0,
            hackathons: 0,
            nssActivities: 0,
            nccActivities: 0,
            clubActivities: 0
          },
          departmentDistribution: departments.map((department) => ({
            code: (department.code || department.name).toUpperCase(),
            name: department.name,
            total: 0,
            completed: 0,
            participants: 0
          })),
          monthlyTrends: []
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getFeed = async (_req: Request, res: Response) => {
    res.status(200).json({ status: 'success', data: { feed: [], totalCount: 0 } });
  };

  getCalendar = async (_req: Request, res: Response) => {
    res.status(200).json({ status: 'success', data: { events: [] } });
  };

  recordAudit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { action, description } = req.body;
      const userId = (req as any).user?.id;

      if (userId) {
        await prisma.userActivityLog.create({
          data: {
            userId,
            action: action === 'EXPORT' ? 'EXPORT' : action === 'PRINT' ? 'PRINT' : 'VIEW',
            module: 'ACADEMICS',
            description: `Principal Activity Oversight: ${description || 'Campus Activities Monitoring Center accessed.'}`,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          }
        });
      }

      res.status(200).json({ status: 'success', message: 'Activity audit recorded.' });
    } catch (error) {
      logger.error('Failed to log activity audit:', error);
      next(error);
    }
  };
}
