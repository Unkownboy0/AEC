import { NextFunction, Request, Response } from 'express';
import { ForbiddenException } from '../../utils/exceptions';
import { ManagementService } from './management.service';
import { resolveManagementViewer } from './management.types';
import { managementQuerySchema } from './management.validator';

export class ManagementController {
  private service = new ManagementService();

  dashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = managementQuerySchema.parse(req.query);
      const viewer = resolveManagementViewer(req.user!);
      const data = await this.service.dashboard(query, viewer);
      await this.service.audit(viewer.id, 'VIEW', 'Viewed Management executive dashboard', { query, ip: req.ip, userAgent: req.headers['user-agent'] });
      res.json({ status: 'success', data });
    } catch (error) { next(error); }
  };

  export = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = managementQuerySchema.parse(req.query);
      const viewer = resolveManagementViewer(req.user!);
      if (!viewer.canExport) throw new ForbiddenException('Executive report export permission is required');
      const data = await this.service.dashboard(query, viewer);
      const rows: Array<Array<string | number>> = [
        ['CampusOS Management Executive Report'], ['Generated', data.generatedAt], ['Period days', query.periodDays],
        [], ['Metric', 'Current', 'Previous', 'Change'],
        ['Attendance %', data.comparisons.attendance.current, data.comparisons.attendance.previous, data.comparisons.attendance.delta],
        ['Average GPA', data.comparisons.academicGpa.current, data.comparisons.academicGpa.previous, data.comparisons.academicGpa.delta],
        ['Admissions', data.comparisons.admissions.current, data.comparisons.admissions.previous, data.comparisons.admissions.delta],
        ['Placements', data.comparisons.placements.current, data.comparisons.placements.previous, data.comparisons.placements.delta],
        [], ['Department', 'Students', 'Faculty', 'Attendance %', 'Average GPA', 'Fee collection %', 'Placements'],
        ...data.departments.map((row: any) => [row.name, row.students, row.faculty, row.attendanceRate ?? '', row.averageGpa ?? '', row.feeCollectionRate ?? '', row.placements ?? '']),
      ];
      const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      await this.service.audit(viewer.id, 'EXPORT', 'Exported Management executive report', { query, ip: req.ip, userAgent: req.headers['user-agent'] });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="campusos-management-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csv);
    } catch (error) { next(error); }
  };
}
