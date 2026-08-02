import { Request, Response, NextFunction } from 'express';
import { PrincipalFailoverService } from './principal-failover.service';

const service = new PrincipalFailoverService();

export class PrincipalFailoverController {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getFailoverStatus();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { status, reason } = req.body;
      if (!status || !['ONLINE', 'OFFLINE', 'ON_LEAVE', 'DELEGATED'].includes(status)) {
        res.status(400).json({ status: 'error', message: 'Valid status required (ONLINE, OFFLINE, ON_LEAVE, DELEGATED)' });
        return;
      }
      const data = await service.setFailoverStatus(userId, status, reason);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const data = await service.getDelegationAuditLogs(limit);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
