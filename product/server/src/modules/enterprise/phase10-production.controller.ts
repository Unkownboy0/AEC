import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../../core/services/health.service';
import { BackupService } from './backup.service';

export class Phase10ProductionController {
  /**
   * GET /api/health
   */
  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.getHealthStatus();
      const statusCode = data.status === 'HEALTHY' ? 200 : 503;
      res.status(statusCode).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/readiness
   */
  async getReadiness(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.getReadinessStatus();
      const statusCode = data.isReady ? 200 : 503;
      res.status(statusCode).json(data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/metrics
   */
  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await HealthService.getMetricsSummary();
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enterprise/admin/backup
   */
  async triggerBackup(req: Request, res: Response, next: NextFunction) {
    try {
      const userEmail = (req as any).user?.email || 'admin@geetorus.com';
      const log = await BackupService.createDatabaseBackup(userEmail, 'MANUAL');
      res.status(201).json({ status: 'success', data: log });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/admin/backups
   */
  async getBackups(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await BackupService.getBackupLogs();
      res.status(200).json({ status: 'success', data: logs });
    } catch (err) {
      next(err);
    }
  }
}
