import { Request, Response, NextFunction } from 'express';
import { HodPortalService } from './hod-portal.service';

const service = new HodPortalService();

export class HodPortalController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getDashboardSummary(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { search, semesterId, sectionId, mentorId, attendanceFilter } = req.query as any;
      const list = await service.getDepartmentStudents(userId, {
        search,
        semesterId,
        sectionId,
        mentorId,
        attendanceFilter,
      });
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  async assignMentor(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { mentorId, studentIds } = req.body;
      const result = await service.assignStudentsToMentor(userId, mentorId, studentIds || []);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentFaculty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getDepartmentFaculty(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentMentors(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getDepartmentMentors(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getDepartmentAttendance(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getDepartmentTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const tasks = await service.getDepartmentTasks(userId);
      res.status(200).json({ status: 'success', data: tasks });
    } catch (err) {
      next(err);
    }
  }

  async createDepartmentTask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const task = await service.createDepartmentTask(userId, req.body);
      res.status(201).json({ status: 'success', data: task });
    } catch (err) {
      next(err);
    }
  }

  async createHodCircular(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const circular = await service.createHodCircular(userId, req.body);
      res.status(201).json({ status: 'success', data: circular });
    } catch (err) {
      next(err);
    }
  }

  async exportDepartmentData(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const dataset = (req.query.dataset as any) || 'STUDENTS';
      const data = await service.exportDepartmentData(userId, dataset);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
