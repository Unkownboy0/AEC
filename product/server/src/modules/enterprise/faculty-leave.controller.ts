import { Request, Response, NextFunction } from 'express';
import { FacultyLeaveService } from './faculty-leave.service';

const service = new FacultyLeaveService();

export class FacultyLeaveController {
  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await service.submitRequest(userId, req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  async hodReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const result = await service.hodReview(userId, id, decision, remarks);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  async principalReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const result = await service.principalReview(userId, id, decision, remarks);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getFacultyRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  async getHodPending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getHodPendingRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  async getPrincipalPending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getPrincipalPendingRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }
}
