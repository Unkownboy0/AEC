import { Request, Response } from 'express';
import { FacultyDashboardService } from './faculty.service';

export class FacultyDashboardController {
  static async getDashboardData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await FacultyDashboardService.getDashboardData(user.id);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
