import { Request, Response, NextFunction } from 'express';
import { TransportService } from './transport.service';
const svc = new TransportService();

export class TransportController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.getDashboard() }); } catch (e) { next(e); } }
  static async listRoutes(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listRoutes() }); } catch (e) { next(e); } }
  static async getRoute(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.getRoute(req.params.id) }); } catch (e) { next(e); } }
  static async listVehicles(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listVehicles(req.query.status as string) }); } catch (e) { next(e); } }
  static async createVehicle(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.createVehicle(req.body) }); } catch (e) { next(e); } }
  static async listDrivers(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listDrivers() }); } catch (e) { next(e); } }
  static async createDriver(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.createDriver(req.body) }); } catch (e) { next(e); } }
  static async addStop(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.addStop(req.body) }); } catch (e) { next(e); } }
  static async allocate(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.allocatePassenger(req.body) }); } catch (e) { next(e); } }
  static async cancelAllocation(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.cancelAllocation(req.params.id) }); } catch (e) { next(e); } }
  static async recordAttendance(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.recordAttendance(req.body) }); } catch (e) { next(e); } }
  static async recordFuel(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.recordFuel({ ...req.body, filledById: (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async createMaintenance(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.createMaintenance(req.body) }); } catch (e) { next(e); } }
  static async reportBreakdown(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.reportBreakdown({ ...req.body, reportedById: (req as any).user?.id }) }); } catch (e) { next(e); } }
}
