import { NextFunction, Request, Response } from 'express';
import { VpCommandService } from './vp-command.service';
import { vpDashboardQuerySchema } from './vp-command.validator';
import { prisma } from '../../lib/prisma';

export class VpCommandController {
  private service = new VpCommandService();
  dashboard = async (req: Request, res: Response, next: NextFunction) => { try {
    const query = vpDashboardQuerySchema.parse(req.query);
    const data = await this.service.dashboard(req.user!.id, query.periodDays, query.departmentId);
    await prisma.auditLog.create({ data: { actorId: req.user!.id, action: 'VIEW', entityType: 'VP_COMMAND_CENTRE', description: 'Viewed Vice Principal operations workspace', newValues: JSON.stringify(query), ipAddress: req.ip, userAgent: req.headers['user-agent'] } });
    res.json({ status: 'success', data });
  } catch (error) { next(error); } };
}
