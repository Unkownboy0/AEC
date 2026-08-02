import { Request, Response, NextFunction } from 'express';
import { CircularEngineService } from './circular-engine.service';

const service = new CircularEngineService();

export class CircularEngineController {
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.publishCircular(userId, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getMyCirculars(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const data = await service.getCircularsForUser(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const data = await service.markAsRead(userId, id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await service.getCircularAnalytics(id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
