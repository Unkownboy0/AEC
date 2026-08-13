import { Request, Response } from 'express';
import { FacultyDashboardService } from './faculty.service';

export class FacultyController {
  static async getTodayAttendanceSessions(req: Request, res: Response) {
    try {
      const data = await FacultyDashboardService.getTodayAttendanceSessions((req as any).user.id);
      return res.json({ status: 'success', data });
    } catch (err: any) { return res.status(err.statusCode || 500).json({ status: 'error', message: err.message }); }
  }

  static async getAttendanceSession(req: Request, res: Response) {
    try {
      const data = await FacultyDashboardService.getAttendanceSession((req as any).user.id, req.params.slotId, req.query.groupId as string | undefined);
      return res.json({ status: 'success', data });
    } catch (err: any) { return res.status(err.statusCode || 500).json({ status: 'error', message: err.message }); }
  }

  static async submitAttendanceSession(req: Request, res: Response) {
    try {
      const data = await FacultyDashboardService.submitAttendanceSession((req as any).user.id, req.params.slotId, req.body);
      return res.status(201).json({ status: 'success', data });
    } catch (err: any) { return res.status(err.statusCode || 500).json({ status: 'error', message: err.message }); }
  }
  // ─── GET /api/faculty/dashboard ───────────────────────────────
  static async getDashboard(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await FacultyDashboardService.getDashboardData(user.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/subjects ────────────────────────────────
  static async getSubjects(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await FacultyDashboardService.getFacultySubjects(user.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/timetable ───────────────────────────────
  static async getTimetable(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await FacultyDashboardService.getFacultyTimetable(user.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
