import { Request, Response } from 'express';
import { CircularService } from './circular.service';

export class CircularController {
  static async listCirculars(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const roleName = typeof user.role === 'object' ? user.role?.name : String(user.role || '');
      const circulars = await CircularService.listCirculars(user.id, roleName, user.departmentId);
      return res.json({ success: true, data: circulars });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createAndPublishCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const roleName = typeof user.role === 'object' ? user.role?.name : String(user.role || '');
      const circular = await CircularService.createAndPublishCircular(
        user.id,
        roleName,
        user.departmentId,
        req.body
      );
      return res.json({ success: true, data: circular });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async acknowledgeCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const result = await CircularService.acknowledgeCircular(user.id, id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getCircularAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const analytics = await CircularService.getCircularAnalytics(id);
      return res.json({ success: true, data: analytics });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
