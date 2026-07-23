import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';

export class SecurityController {
  /**
   * Get activity audit logs
   */
  getAudits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.userActivityLog.findMany({
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Cap at 100 recent actions
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
   * Get login history logs
   */
  getLogins = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logins = await prisma.loginHistory.findMany({
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { loginTime: 'desc' },
        take: 100,
      });

      res.status(200).json({
        status: 'success',
        data: logins,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get active concurrent sessions
   */
  getSessions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await prisma.userSession.findMany({
        include: {
          user: {
            select: { email: true, firstName: true, lastName: true, role: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Revoke session and block user account
   */
  blockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // Session ID or User ID (we'll check both)
      
      // Let's check if the ID refers to a session or user
      let userId = id;
      const session = await prisma.userSession.findUnique({ where: { id } });
      if (session) {
        userId = session.userId;
        // Delete that specific session
        await prisma.userSession.delete({ where: { id } });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User account not found');

      if (user.id === req.user!.id) {
        throw new BadRequestException('You cannot block your own account');
      }

      // Block User
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'BLOCKED' },
      });

      // Terminate any other remaining sessions of the blocked user
      await prisma.userSession.deleteMany({ where: { userId } });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'SECURITY',
          description: `Blocked user account ${user.email}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: `User ${user.email} was blocked and all active device sessions terminated`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unblock user account
   */
  unblockUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User account not found');

      await prisma.user.update({
        where: { id },
        data: { status: 'ACTIVE' },
      });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'SECURITY',
          description: `Unblocked user account ${user.email}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: `User ${user.email} has been unblocked`,
      });
    } catch (error) {
      next(error);
    }
  };
}
