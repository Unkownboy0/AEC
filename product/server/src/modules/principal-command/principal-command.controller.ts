import { NextFunction, Request, Response } from 'express';
import { PrincipalCommandService } from './principal-command.service';
import { principalDashboardQuerySchema } from './principal-command.validator';
import { prisma } from '../../lib/prisma';

export class PrincipalCommandController {
  private service = new PrincipalCommandService();
  dashboard = async (req: Request, res: Response, next: NextFunction) => { try {
    const query = principalDashboardQuerySchema.parse(req.query);
    const data = await this.service.dashboard(query.periodDays, query.departmentId);
    await prisma.auditLog.create({ data: { actorId: req.user!.id, action: 'VIEW', entityType: 'PRINCIPAL_COMMAND_CENTRE', description: 'Viewed Principal Command Centre', newValues: JSON.stringify(query), ipAddress: req.ip, userAgent: req.headers['user-agent'] } });
    res.json({ status: 'success', data });
  } catch (error) { next(error); } };
  hierarchy = async (req: Request, res: Response, next: NextFunction) => { try {
    const query = principalDashboardQuerySchema.parse(req.query);
    res.json({ status: 'success', data: await this.service.hierarchy(query.departmentId) });
  } catch (error) { next(error); } };
}
