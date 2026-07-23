import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';

export class SettingsController {
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
      const body = req.body;
      if (typeof body !== 'object' || body === null) {
        throw new BadRequestException('Request body must be a JSON object of settings');
      }

      const keys = Object.keys(body);
      const updatedList = [];

      for (const key of keys) {
        const val = String(body[key]);
        const setting = await prisma.systemSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
        updatedList.push(setting);
      }

      // Write audit log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'SETTING',
          description: `Updated system configuration keys: ${keys.join(', ')}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      // Format response dictionary
      const settingsDict: { [key: string]: string } = {};
      updatedList.forEach((s) => {
        settingsDict[s.key] = s.value;
      });

      res.status(200).json({
        status: 'success',
        data: settingsDict,
      });
    } catch (error) {
      next(error);
    }
  };
}
