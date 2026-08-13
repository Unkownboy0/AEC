import { Request, Response, NextFunction } from 'express';
import { ProfileDrilldownService } from './profile-drilldown.service';

const service = new ProfileDrilldownService();

export class ProfileDrilldownController {
  async getUser360(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await service.getUser360Profile(id, req.user!);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getStudent360(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await service.getStudent360Profile(id, req.user!);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async getFaculty360(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await service.getFaculty360Profile(id, req.user!);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async deepSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string || '').trim();
      const data = await service.enterpriseDeepSearch(query);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
