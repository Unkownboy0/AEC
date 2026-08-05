import { Request, Response } from 'express';
import { HodTaskService } from './hod-task.service';

export class HodTaskController {
  // ─── GET /api/hod/tasks ───────────────────────────────────────
  static async getHodTaskDashboard(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const statusFilter = req.query.status as string | undefined;
      const data = await HodTaskService.getHodTaskDashboard(user.id, statusFilter);
      return res.json({ success: true, ...data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/hod/tasks/:id ───────────────────────────────────
  static async getTaskById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const task = await HodTaskService.getTaskById(id, user.id);
      if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
      return res.json({ success: true, data: task });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/tasks/:id/acknowledge ─────────────────────
  static async acknowledgeTask(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const task = await HodTaskService.acknowledgeTask(id, user.id);
      return res.json({ success: true, message: 'Task acknowledged', data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/tasks/:id/start ───────────────────────────
  static async startTask(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const task = await HodTaskService.startTask(id, user.id);
      return res.json({ success: true, message: 'Task marked as in-progress', data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/tasks/:id/progress ────────────────────────
  static async updateProgress(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { progress, remarks } = req.body;
      const task = await HodTaskService.updateProgress(id, user.id, Number(progress), remarks);
      return res.json({ success: true, data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/tasks/:id/query ───────────────────────────
  static async raiseQuery(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { queryText } = req.body;
      if (!queryText || queryText.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Query text is required' });
      }
      const task = await HodTaskService.raiseQuery(id, user.id, queryText);
      return res.json({ success: true, message: 'Query raised to Dean/Creator', data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/tasks/:id/submit ──────────────────────────
  static async submitTask(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { submissionUrl, submissionNotes } = req.body;
      const task = await HodTaskService.submitTask(id, user.id, submissionUrl, submissionNotes);
      return res.json({ success: true, message: 'Task submitted for Dean review', data: task });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
