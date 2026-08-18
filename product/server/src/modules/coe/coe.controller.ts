import { NextFunction, Request, Response } from 'express';
import { CoeService } from './coe.service';

export class CoeController {
  private service = new CoeService();
  dashboard = this.wrap((req) => this.service.dashboard());
  schedule = this.wrap((req) => this.service.listSchedule(req.params.examId));
  createSchedule = this.wrap((req) => this.service.createScheduleEntry(req.body, req.user!.id, req), 201);
  validateSchedule = this.wrap((req) => this.service.validateSchedule(req.params.examId));
  publishSchedule = this.wrap((req) => this.service.publishSchedule(req.params.examId, req.body?.revisionReason, req.user!.id, req));
  createRoom = this.wrap((req) => this.service.createRoom(req.body), 201);
  allocateSeats = this.wrap((req) => this.service.allocateSeats(req.body, req.user!.id, req), 201);
  publishSeats = this.wrap((req) => this.service.publishSeats(req.params.scheduleEntryId, req.user!.id, req));
  assignInvigilator = this.wrap((req) => this.service.assignInvigilator(req.body, req.user!.id, req), 201);
  publishResults = this.wrap((req) => this.service.publishResults(req.params.examId, req.user!.id, req));
  studentHall = this.wrap((req) => this.service.studentHallView(req.user!.id));

  private wrap(handler: (req: Request) => Promise<any>, status = 200) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try { res.status(status).json({ status: 'success', data: await handler(req) }); } catch (error) { next(error); }
    };
  }
}
