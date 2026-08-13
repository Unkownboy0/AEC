import { Request, Response, NextFunction } from 'express';
import { AppraisalService } from './appraisal.service';
const svc = new AppraisalService();

export class AppraisalController {
  static async listConfigs(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.listConfigs(req.query.academicYear as string) }); } catch (e) { next(e); } }
  static async getConfig(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.getConfig(req.params.id) }); } catch (e) { next(e); } }
  static async createConfig(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.createConfig({ ...req.body, configuredById: (req as any).user?.id }) }); } catch (e) { next(e); } }
  static async activateConfig(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.activateConfig(req.params.id) }); } catch (e) { next(e); } }
  static async addCategory(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.addCategory(req.body) }); } catch (e) { next(e); } }
  static async addSubcategory(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.addSubcategory(req.body) }); } catch (e) { next(e); } }
  static async getMySubmission(req: Request, res: Response, next: NextFunction) { try { const faculty = await (await import('../../lib/prisma')).prisma.faculty.findFirst({ where: { userId: (req as any).user?.id } }); if (!faculty) return res.status(404).json({ status: 'error', message: 'Faculty profile not found' }); res.json({ status: 'success', data: await svc.getMySubmission(req.params.configId, faculty.id, req.query.academicYear as string) }); } catch (e) { next(e); } }
  static async addEntry(req: Request, res: Response, next: NextFunction) { try { res.status(201).json({ status: 'success', data: await svc.addEntry(req.body) }); } catch (e) { next(e); } }
  static async submitAppraisal(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.submitAppraisal(req.params.id) }); } catch (e) { next(e); } }
  static async verifyEntry(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.verifyEntry(req.params.id, req.body.verifiedPoints, req.body.status, (req as any).user?.id, req.body.remarks) }); } catch (e) { next(e); } }
  static async finalizeSubmission(req: Request, res: Response, next: NextFunction) { try { res.json({ status: 'success', data: await svc.finalizeSubmission(req.params.id, (req as any).user?.id) }); } catch (e) { next(e); } }
}
