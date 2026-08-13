import { Request, Response, NextFunction } from 'express';
import { CampusSecurityService } from './campus-security.service';
const svc = new CampusSecurityService();

export class CampusSecurityController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.getDashboard() }); } catch (e) { next(e); } }
  // Gate Passes
  static async createGatePass(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.createGatePass({ ...req.body, requesterId: req.body.requesterId || (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async approveGatePass(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.approveGatePass(req.params.id, (req as any).user?.id) }); } catch (e) { next(e); } }
  static async useGatePass(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.useGatePass(req.params.token) }); } catch (e) { next(e); } }
  static async listGatePasses(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listGatePasses({ status: req.query.status as string, requesterType: req.query.requesterType as string, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20 }) }); } catch (e) { next(e); } }
  // Visitors
  static async registerVisitor(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.registerVisitor({ ...req.body, verifiedById: (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async checkoutVisitor(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.checkoutVisitor(req.params.id, req.body.exitGate) }); } catch (e) { next(e); } }
  static async listVisitors(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listVisitors({ status: req.query.status as string, date: req.query.date as string, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20 }) }); } catch (e) { next(e); } }
  // Entry/Exit
  static async logEntryExit(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.logEntryExit({ ...req.body, verifiedById: (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async getEntryExitLogs(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.getEntryExitLogs(req.params.personId, req.query.personType as string) }); } catch (e) { next(e); } }
  // Incidents
  static async reportIncident(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.reportIncident({ ...req.body, reportedById: (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async updateIncident(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.updateIncident(req.params.id, req.body) }); } catch (e) { next(e); } }
  static async listIncidents(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listIncidents({ type: req.query.type as string, status: req.query.status as string, page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 20 }) }); } catch (e) { next(e); } }
  // QR Verification
  static async verifyQR(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.verifyQR({ ...req.body, verifierId: (req as any).user?.id }) }); } catch (e) { next(e); } }
}
