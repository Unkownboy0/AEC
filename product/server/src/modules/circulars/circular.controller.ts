import { Request, Response } from 'express';
import { CircularService } from './circular.service';
import { CreateCircularSchema } from './circular.validation';

export class CircularController {
  // ─── GET /api/circulars ───────────────────────────────────────
  static async listCirculars(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const roleName = typeof user.role === 'object' ? user.role?.name : String(user.role || '');
      let deptId = user.departmentId ?? user.faculty?.departmentId ?? user.student?.departmentId ?? undefined;

      // If deptId is missing on session, resolve from Faculty or Student records
      if (!deptId && user.id) {
        const { prisma } = await import('../../lib/prisma');
        const [fac, stu] = await Promise.all([
          prisma.faculty.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { departmentId: true } }),
          prisma.student.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { departmentId: true } }),
        ]);
        deptId = fac?.departmentId || stu?.departmentId || undefined;
      }

      const circulars = await CircularService.listCirculars(user.id, roleName, deptId);
      return res.json({ success: true, data: circulars });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/circulars ──────────────────────────────────────
  static async createAndPublishCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const roleName = typeof user.role === 'object' ? user.role?.name : String(user.role || '');

      // Validate body
      const parseResult = CreateCircularSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        });
      }

      // Department always from server session or database record for HOD
      let serverDeptId = user.departmentId ?? user.faculty?.departmentId ?? undefined;
      if (!serverDeptId && user.id) {
        const { prisma } = await import('../../lib/prisma');
        const fac = await prisma.faculty.findFirst({
          where: { OR: [{ userId: user.id }, { email: user.email }] },
          select: { departmentId: true }
        });
        serverDeptId = fac?.departmentId ?? undefined;
      }

      const result = await CircularService.createAndPublishCircular(
        user.id,
        roleName,
        serverDeptId,
        parseResult.data
      );
      return res.status(201).json({
        success: true,
        circular: result.circular,
        recipients: result.recipients,
        notifications: result.notifications,
      });
    } catch (err: any) {
      if (err?.message?.includes('NO_RECIPIENTS_FOUND')) {
        return res.status(400).json({
          success: false,
          code: 'NO_RECIPIENTS_FOUND',
          error: 'No active department recipients matched the selected audience.',
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/circulars/:id ───────────────────────────────────
  static async getCircularById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const circular = await CircularService.getCircularById(id, user.id);
      if (!circular) {
        return res.status(404).json({ success: false, error: 'Circular not found' });
      }
      return res.json({ success: true, data: circular });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── PATCH /api/circulars/:id ─────────────────────────────────
  static async updateCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      // Only allow patching non-published fields for now
      const allowedFields = ['title', 'description', 'content', 'isPinned', 'expiryDate', 'referenceLink'];
      const updateData: any = {};
      allowedFields.forEach(k => { if (req.body[k] !== undefined) updateData[k] = req.body[k]; });

      const { CircularRepository } = await import('./circular.repository');
      const repo = new CircularRepository();
      const updated = await repo.update(id, updateData);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/circulars/:id/publish ─────────────────────────
  static async publishCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const circular = await CircularService.publishCircular(id, user.id);
      return res.json({ success: true, data: circular });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/circulars/:id/archive ─────────────────────────
  static async archiveCircular(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const circular = await CircularService.archiveCircular(id, user.id);
      return res.json({ success: true, data: circular });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/circulars/:id/acknowledge ─────────────────────
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

  // ─── GET /api/circulars/:id/recipients ───────────────────────
  static async getCircularRecipients(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const result = await CircularService.getCircularRecipients(id, page, limit);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/circulars/:id/analytics ────────────────────────
  static async getCircularAnalytics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const analytics = await CircularService.getCircularAnalytics(id);
      return res.json({ success: true, data: analytics });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/circulars/:id/remind ──────────────────────────
  static async remindRecipients(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const result = await CircularService.remindRecipients(id, message);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
