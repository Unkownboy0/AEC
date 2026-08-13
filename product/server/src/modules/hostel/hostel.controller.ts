import { Request, Response, NextFunction } from 'express';
import { HostelService } from './hostel.service';

const service = new HostelService();

export class HostelController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.getDashboard(req.query.hostelId as string) }); } catch (e) { next(e); }
  }
  static async listHostels(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.listHostels() }); } catch (e) { next(e); }
  }
  static async getHostel(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.getHostel(req.params.id) }); } catch (e) { next(e); }
  }
  static async listRooms(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.listRooms({ hostelId: req.query.hostelId as string, blockId: req.query.blockId as string, floorId: req.query.floorId as string, status: req.query.status as string, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 50 }) }); } catch (e) { next(e); }
  }
  static async allocateRoom(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: 'success', data: await service.allocateRoom({ ...req.body, allocatedById: (req as any).user?.id }) }); } catch (e) { next(e); }
  }
  static async vacateRoom(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.vacateRoom(req.params.id) }); } catch (e) { next(e); }
  }
  static async requestOuting(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: 'success', data: await service.requestOuting(req.body) }); } catch (e) { next(e); }
  }
  static async reviewOuting(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.reviewOuting(req.params.id, req.body.action, (req as any).user?.id, req.body.remarks) }); } catch (e) { next(e); }
  }
  static async recordOutingReturn(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.recordOutingReturn(req.params.id) }); } catch (e) { next(e); }
  }
  static async recordNightAttendance(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.recordNightAttendance({ ...req.body, recordedBy: (req as any).user?.id }) }); } catch (e) { next(e); }
  }
  static async recordMessAttendance(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.recordMessAttendance(req.body) }); } catch (e) { next(e); }
  }
  static async registerVisitor(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: 'success', data: await service.registerVisitor({ ...req.body, verifiedById: (req as any).user?.id }) }); } catch (e) { next(e); }
  }
  static async checkoutVisitor(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.checkoutVisitor(req.params.id) }); } catch (e) { next(e); }
  }
  static async createComplaint(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ status: 'success', data: await service.createComplaint(req.body) }); } catch (e) { next(e); }
  }
  static async updateComplaintStatus(req: Request, res: Response, next: NextFunction) {
    try { res.json({ status: 'success', data: await service.updateComplaintStatus(req.params.id, req.body.status, req.body.resolution) }); } catch (e) { next(e); }
  }
}
