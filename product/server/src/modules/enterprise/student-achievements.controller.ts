import { Request, Response, NextFunction } from 'express';
import { StudentAchievementsService } from './student-achievements.service';

const service = new StudentAchievementsService();

export class StudentAchievementsController {
  static async createAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.createAchievement(userId, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getMyAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getMyAchievements(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const requester = { id: (req as any).user.id, role: (req as any).user.role };
      const { id } = req.params;
      const data = await service.getStudentAchievements(id, requester);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async togglePublish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { isPublished } = req.body;
      const data = await service.togglePublishAchievement(userId, id, !!isPublished);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteAchievement(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      await service.deleteAchievement(userId, id);
      res.status(200).json({ status: 'success', message: 'Achievement deleted' });
    } catch (err) {
      next(err);
    }
  }
}
