import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { FacultyLeaveService } from './faculty-leave.service';
import { CreateFacultyLeaveOdSchema, HodActionSchema, HodRejectReturnSchema } from './faculty-leave.validation';

export class FacultyLeaveController {
  // ─── POST /api/faculty/leave-od ───────────────────────────────
  static async submitLeaveOd(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const parseResult = CreateFacultyLeaveOdSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        });
      }
      const request = await FacultyLeaveService.submitLeaveOd(user.id, parseResult.data);
      return res.status(201).json({ success: true, data: request });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/leave-od ────────────────────────────────
  static async getFacultyRequests(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const requests = await FacultyLeaveService.getFacultyRequests(user.id);
      return res.json({ success: true, data: requests });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/leave-od/:id ────────────────────────────
  static async getRequestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const request = await FacultyLeaveService.getRequestById(id);
      if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
      return res.json({ success: true, data: request });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/leave-od/affected-sessions ──────────────
  static async getAffectedSessions(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const faculty = await prisma.faculty.findFirst({
        where: { userId: user.id },
      });
      if (!faculty) {
        return res.status(404).json({ success: false, error: 'Faculty profile not found' });
      }

      const { startDate, endDate, isHalfDay, halfDayPeriod } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
      }

      const data = await FacultyLeaveService.detectAffectedSessions({
        facultyId: faculty.id,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        isHalfDay: isHalfDay === 'true' || isHalfDay === '1',
        halfDayPeriod: halfDayPeriod as any,
      });

      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/faculty/leave-od/available-substitutes ───────────
  static async getAvailableSubstitutes(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const faculty = await prisma.faculty.findFirst({
        where: { userId: user.id },
      });

      const { date, dayOfWeek, periodStart, periodEnd, departmentId, subjectId, includeCrossDept } = req.query;
      if (!date || !periodStart || !departmentId) {
        return res.status(400).json({ success: false, error: 'date, periodStart, and departmentId are required' });
      }

      const candidates = await FacultyLeaveService.getAvailableSubstitutes({
        date: date as string,
        dayOfWeek: dayOfWeek as string | undefined,
        periodStart: parseInt(periodStart as string, 10),
        periodEnd: parseInt((periodEnd as string) || (periodStart as string), 10),
        departmentId: departmentId as string,
        subjectId: subjectId as string | undefined,
        excludeFacultyId: faculty?.id,
        includeCrossDept: includeCrossDept === 'true' || includeCrossDept === '1',
      });

      return res.json({ success: true, data: candidates });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ─── GET /api/hod/faculty-requests ───────────────────────────
  static async getHodDashboard(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const statusFilter = req.query.status as string | undefined;
      const dashboard = await FacultyLeaveService.getHodDashboard(user.id, statusFilter);
      return res.json({ success: true, ...dashboard });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/faculty-requests/:id/recommend ───────────
  static async hodRecommend(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { remarks, confirmedSubstituteId, handoverInstructions, confirmedSubstitutions } = req.body;
      const result = await FacultyLeaveService.hodRecommend(user.id, id, remarks, confirmedSubstituteId, handoverInstructions, confirmedSubstitutions);
      return res.json({ success: true, message: 'Request recommended and forwarded to final approver', data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/faculty-requests/:id/reject ───────────────
  static async hodReject(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Rejection reason is required (min 3 characters)' });
      }
      const result = await FacultyLeaveService.hodReject(user.id, id, reason);
      return res.json({ success: true, message: 'Request rejected', data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // ─── POST /api/hod/faculty-requests/:id/return ───────────────
  static async hodReturn(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;
      if (!reason || reason.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Return reason is required (min 3 characters)' });
      }
      const result = await FacultyLeaveService.hodReturn(user.id, id, reason);
      return res.json({ success: true, message: 'Request returned to Faculty for clarification', data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
