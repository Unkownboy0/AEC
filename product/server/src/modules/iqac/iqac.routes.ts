import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { requireFeature } from '../../core/middlewares/requireFeature.middleware';
import { IqacService } from './iqac.service';

const router = Router();
router.use(requireAuth);
router.use(requireFeature('MODULE_IQAC_ENABLED'));
const managers = [
  'IQAC Dean',
  'IQAC Executive Officer',
  'IQAC Documentation Officer',
  'Principal',
  'College Admin',
  'Super Admin',
];
const contributors = [...managers, 'HOD', 'Head of Department', 'Faculty'];
const actor = (req: Request) => ({ id: (req as any).user.id, role: (req as any).user.role });
const send = (handler: (req: Request) => Promise<any>, status = 200) => async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(status).json({ status: 'success', data: await handler(req) }); } catch (error) { next(error); }
};

router.get('/dashboard', requireRole(contributors), send((req) => IqacService.dashboard(actor(req))));
router.get('/audits', requireRole(contributors), send((req) => IqacService.listAudits(actor(req))));
router.get('/repository', requireRole(contributors), send((req) => IqacService.repository(actor(req), req.query)));
router.post('/audits', requireRole(managers), send((req) => IqacService.createAudit(actor(req), req.body), 201));
router.get('/audits/:auditId', requireRole(contributors), send((req) => IqacService.getAudit(actor(req), req.params.auditId)));
router.post('/audits/:auditId/evidence', requireRole(contributors), send((req) => IqacService.uploadEvidence(actor(req), req.params.auditId, req.body), 201));
router.post('/audits/:auditId/observations', requireRole(contributors), send((req) => IqacService.addObservation(actor(req), req.params.auditId, req.body), 201));
router.post('/audits/:auditId/tasks', requireRole(managers), send((req) => IqacService.createEvidenceTask(actor(req), req.params.auditId, req.body), 201));
router.patch('/evidence/:evidenceId/review', requireRole(managers), send((req) => IqacService.reviewEvidence(actor(req), req.params.evidenceId, req.body)));

export default router;
