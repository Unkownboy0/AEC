import { Request, Response, NextFunction } from 'express';
import { InteractiveTimelineService } from './interactive-timeline.service';

const service = new InteractiveTimelineService();

export class TimelineController {
  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const data = await service.getTimelineFeed(userId, limit);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}
