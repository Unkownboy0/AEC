import { NextFunction, Request, Response } from 'express';
import { CoeService } from './coe.service';
import { generateHallTicketPdfBuffer } from '../../utils/hall-ticket.pdf';
import { ProfileMediaService } from '../users/profile-media.service';

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
  studentHallTicket = this.wrap((req) => this.service.studentHallTicket(req.user!.id, req.query.examId as string | undefined));
  coeHallTicket = this.wrap((req) => this.service.hallTicketForStudent(req.params.studentId, req.query.examId as string | undefined));
  searchHallTickets = this.wrap((req) => this.service.searchHallTickets(req.query));
  studentHallTicketPdf = (req: Request, res: Response, next: NextFunction) => this.sendHallTicketPdf(
    this.service.studentHallTicket(req.user!.id, req.query.examId as string | undefined), res, next,
  );
  coeHallTicketPdf = (req: Request, res: Response, next: NextFunction) => this.sendHallTicketPdf(
    this.service.hallTicketForStudent(req.params.studentId, req.query.examId as string | undefined), res, next,
  );

  private async sendHallTicketPdf(ticketPromise: Promise<any>, res: Response, next: NextFunction) {
    try {
      const ticket = await ticketPromise;
      const photoPath = await ProfileMediaService.resolveInternalPhysicalPath(ticket.student.profileImageFileId);
      const buffer = await generateHallTicketPdfBuffer({
        institutionName: ticket.institutionName,
        studentName: ticket.student.name,
        registerNumber: ticket.student.registerNumber,
        programme: ticket.student.programme,
        department: ticket.student.department,
        semester: ticket.student.semester,
        examName: ticket.exam.name,
        examType: ticket.exam.type,
        studentPhotoPath: photoPath,
        subjects: ticket.subjects,
      });
      const safeRegister = String(ticket.student.registerNumber).replace(/[^A-Za-z0-9_-]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Content-Disposition', `attachment; filename="Hall_Ticket_${safeRegister}.pdf"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.status(200).send(buffer);
    } catch (error) { next(error); }
  }

  private wrap(handler: (req: Request) => Promise<any>, status = 200) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try { res.status(status).json({ status: 'success', data: await handler(req) }); } catch (error) { next(error); }
    };
  }
}
