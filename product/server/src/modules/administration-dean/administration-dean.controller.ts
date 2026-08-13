import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AdministrationDeanService } from './administration-dean.service';
import { administrationDashboardQuerySchema, administrationExportQuerySchema } from './administration-dean.validator';

const service = new AdministrationDeanService();

export class AdministrationDeanController {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const query = administrationDashboardQuerySchema.parse(req.query);
      const data = await service.dashboard(req.user!.id, query.periodDays);
      await prisma.auditLog.create({ data: { actorId: req.user!.id, action: 'VIEW', entityType: 'ADMINISTRATION_DEAN_COMMAND_CENTRE', description: 'Viewed Administration Dean command centre', newValues: JSON.stringify(query), ipAddress: req.ip, userAgent: req.headers['user-agent'] } });
      res.json({ status: 'success', data });
    } catch (error) { next(error); }
  }

  async export(req: Request, res: Response, next: NextFunction) {
    try {
      const { format } = administrationExportQuerySchema.parse(req.query);
      const report = await service.export(req.user!.id, format);
      await prisma.auditLog.create({ data: { actorId: req.user!.id, action: 'EXPORT', entityType: 'ADMINISTRATION_DEAN_REPORT', description: `Exported Administration Dean ${format} report`, newValues: JSON.stringify({ format }), ipAddress: req.ip, userAgent: req.headers['user-agent'] } });
      res.setHeader('Content-Type', report.mime);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);
    } catch (error) { next(error); }
  }
}
