import { Router } from 'express';
import { CampusSecurityController } from './campus-security.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const securityGuard = requireRole(['Security', 'Security Officer', 'Super Admin', 'College Admin', 'Administration Dean']);

router.get('/dashboard', securityGuard, CampusSecurityController.getDashboard);
// Gate Passes
router.post('/gate-passes', CampusSecurityController.createGatePass);
router.get('/gate-passes', securityGuard, CampusSecurityController.listGatePasses);
router.post('/gate-passes/:id/approve', securityGuard, CampusSecurityController.approveGatePass);
router.get('/gate-passes/verify/:token', CampusSecurityController.useGatePass);
// Visitors
router.post('/visitors', securityGuard, CampusSecurityController.registerVisitor);
router.get('/visitors', securityGuard, CampusSecurityController.listVisitors);
router.post('/visitors/:id/checkout', securityGuard, CampusSecurityController.checkoutVisitor);
// Entry/Exit
router.post('/entry-exit', securityGuard, CampusSecurityController.logEntryExit);
router.get('/entry-exit/:personId', securityGuard, CampusSecurityController.getEntryExitLogs);
// Incidents
router.post('/incidents', CampusSecurityController.reportIncident);
router.get('/incidents', securityGuard, CampusSecurityController.listIncidents);
router.patch('/incidents/:id', securityGuard, CampusSecurityController.updateIncident);
// QR Verification
router.post('/verify', securityGuard, CampusSecurityController.verifyQR);

export default router;
