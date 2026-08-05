import { Request, Response } from 'express';
import { FacultyDashboardService } from './faculty.service';

export class FacultyController {
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
