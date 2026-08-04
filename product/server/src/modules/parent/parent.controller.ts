import { Request, Response, NextFunction } from 'express';
import { ParentService } from './parent.service';

const service = new ParentService();

export class ParentController {
  static async getLinkedChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getLinkedChildren(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getChildAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getChildAttendance(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getChildMarks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getChildMarks(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getChildFees(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getChildFees(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getChildLeaveOd(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getChildLeaveOd(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getChildTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const data = await service.getChildTimetable(userId, studentId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async contactMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { studentId } = req.params;
      const { message } = req.body;
      const data = await service.contactMentor(userId, studentId, message);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
