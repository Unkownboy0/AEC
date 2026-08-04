import { Request, Response, NextFunction } from 'express';
import { MentorService } from './mentor.service';

const service = new MentorService();

export class MentorController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getDashboardStats(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getAssignedStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getAssignedStudents(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getStudentDetail(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingLeaveOdRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getPendingLeaveOdRequests(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async reviewStudentLeaveOd(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { requestId } = req.params;
      const data = await service.reviewStudentLeaveOd(userId, requestId, req.body);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async addCounselingNote(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.addCounselingNote(userId, studentId, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
