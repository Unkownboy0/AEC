import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';
import { getOdMinAdvanceDays } from '../../utils/leavePolicy';
import { SettingsService } from './settings.service';

export class SettingsController {
  private service = new SettingsService();

  catalog = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await this.service.catalog() }); } catch (error) { next(error); }
  };

  preview = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: this.service.preview(req.body?.changes) }); } catch (error) { next(error); }
  };
  getRequestPolicy = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: { odMinAdvanceDays: await getOdMinAdvanceDays(), leaveMinAdvanceDays: 0 },
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * List all settings key-value pairs
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbSettings = await prisma.systemSetting.findMany();
      
      // Convert list to a key-value dictionary object
      const settings: { [key: string]: string } = {};
      dbSettings.forEach((item) => {
        settings[item.key] = item.value;
      });

      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update key-value pairs
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.update(req.body?.changes ?? req.body, req.user!, { ip: req.ip, userAgent: req.headers['user-agent'] });
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Principal Availability Status (ONLINE / OFFLINE)
   */
  getPrincipalAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
      });
      const isOffline = setting?.value === 'true';
      res.status(200).json({
        status: 'success',
        data: { isOffline, status: isOffline ? 'OFFLINE' : 'ONLINE' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set Principal Availability Status (ONLINE / OFFLINE)
   */
  setPrincipalAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isOffline } = req.body;
      const val = isOffline ? 'true' : 'false';

      await prisma.systemSetting.upsert({
        where: { key: 'PRINCIPAL_OFFLINE_MODE' },
        update: { value: val },
        create: { key: 'PRINCIPAL_OFFLINE_MODE', value: val },
      });

      // Write Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: (req as any).user?.id || 'SYSTEM',
          action: 'UPDATE',
          module: 'SETTING',
          description: `Principal availability changed to ${isOffline ? 'OFFLINE' : 'ONLINE'}. Approval delegation to Vice Principal ${isOffline ? 'ACTIVATED' : 'DEACTIVATED'}.`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        data: { isOffline, status: isOffline ? 'OFFLINE' : 'ONLINE' },
      });
    } catch (error) {
      next(error);
    }
  };
}
