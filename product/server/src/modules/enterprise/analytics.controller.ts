import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { ReportBuilderService } from './report-builder.service';
import { ReportScopeResolver } from './report-scope.service';
import { prisma } from '../../lib/prisma';

const analyticsService = new AnalyticsService();
const reportBuilderService = new ReportBuilderService();

export class AnalyticsController {
  /**
   * GET /api/enterprise/analytics/dashboard
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const roleName = user.role?.name || 'Student';
      const data = await analyticsService.getDashboardAnalytics(user.id, roleName);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enterprise/reports/builder/run
   */
  async runCustomReport(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const roleName = user.role?.name || 'Student';
      const scope = await ReportScopeResolver.resolveScope(user.id, roleName);

      const { datasetCode, columns, filters, groupBy, aggregation } = req.body;
      const data = await reportBuilderService.runCustomReport(
        { datasetCode, columns, filters, groupBy, aggregation },
        scope
      );

      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/enterprise/reports/save
   */
  async saveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { name, datasetCode, configuration } = req.body;
      const report = await reportBuilderService.saveReport(userId, name, datasetCode, configuration);
      res.status(201).json({ status: 'success', data: report });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/reports/saved
   */
  async getSavedReports(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const reports = await reportBuilderService.getSavedReports(userId);
      res.status(200).json({ status: 'success', data: reports });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/analytics/department-availability
   */
  async getDepartmentAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      let { departmentId } = req.query;
      const user = (req as any).user;

      if (user && (user.role === 'HOD' || user.role?.name === 'HOD')) {
        // A HOD must always be scoped from canonical assignments. Never trust an
        // arbitrary query-string department and never fall back to campus-wide.
        const hodUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            departmentId: true,
            faculty: { select: { departmentId: true } },
            departmentMemberships: { select: { departmentId: true }, take: 1 },
          }
        });
        departmentId = hodUser?.departmentId || hodUser?.faculty?.departmentId || hodUser?.departmentMemberships?.[0]?.departmentId;
        if (!departmentId) return res.status(200).json({ status: 'success', data: { studentsOnLeaveToday: [], studentsOnOdToday: [], facultyOnLeaveToday: [], facultyOnOdToday: [], updatedAt: new Date().toISOString(), scope: 'UNASSIGNED' } });
      }

      const data = await analyticsService.getDepartmentAvailability(departmentId as string | undefined);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
