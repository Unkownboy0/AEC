import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';
import { getOdMinAdvanceDays } from '../../utils/leavePolicy';
import { SettingsService } from './settings.service';
import { FeatureFlags } from '../../core/feature-flags';

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
   * Get active institutional branding and watermark configurations
   */
  getBranding = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dbSettings = await prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'COLLEGE_NAME',
              'COLLEGE_ADDRESS',
              'COLLEGE_PHONE',
              'COLLEGE_WEBSITE',
              'BRAND_COLOR',
              'WATERMARK_ENABLED',
              'WATERMARK_LOGO_URL',
              'WATERMARK_OPACITY',
              'WATERMARK_POSITION',
              'WATERMARK_APPLY_PDF',
              'WATERMARK_APPLY_PRINT',
              'WATERMARK_APPLY_CERTIFICATES',
              'WATERMARK_APPLY_RECEIPTS',
              'WATERMARK_APPLY_DOCS',
            ],
          },
        },
      });

      const map: Record<string, string> = {};
      dbSettings.forEach((item) => {
        map[item.key] = item.value;
      });

      res.status(200).json({
        status: 'success',
        data: {
          collegeName: map['COLLEGE_NAME'] || 'CampusOS Institution',
          collegeAddress: map['COLLEGE_ADDRESS'] || '',
          collegePhone: map['COLLEGE_PHONE'] || '',
          collegeWebsite: map['COLLEGE_WEBSITE'] || '',
          brandColor: map['BRAND_COLOR'] || '#4f46e5',
          watermark: {
            enabled: map['WATERMARK_ENABLED'] !== 'false',
            logoUrl: map['WATERMARK_LOGO_URL'] || '/branding/institution-logo.png',
            opacity: parseInt(map['WATERMARK_OPACITY'] || '4', 10),
            position: map['WATERMARK_POSITION'] || 'CENTER',
            applyPdf: map['WATERMARK_APPLY_PDF'] !== 'false',
            applyPrint: map['WATERMARK_APPLY_PRINT'] !== 'false',
            applyCertificates: map['WATERMARK_APPLY_CERTIFICATES'] !== 'false',
            applyReceipts: map['WATERMARK_APPLY_RECEIPTS'] !== 'false',
            applyDocs: map['WATERMARK_APPLY_DOCS'] !== 'false',
          },
        },
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
      // Invalidate feature flag cache so MODULE_ changes propagate immediately
      FeatureFlags.invalidate();
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

  /**
   * Get effective mobile device capabilities for the current user and global settings
   */
  getDeviceCapabilities = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { DevicePolicyService } = await import('./device-policy.service');
      const userRole = (req as any).user?.role?.roleCode || (req as any).user?.roleCode || (req as any).user?.role || null;
      const [globalFlags, effectivePolicy] = await Promise.all([
        DevicePolicyService.getGlobalSettings(),
        DevicePolicyService.resolvePolicyForUser(userRole),
      ]);
      res.status(200).json({
        status: 'success',
        data: {
          globalFlags,
          effectivePolicy,
          userRole,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
