import { Router } from 'express';
import { PrincipalFailoverController } from './principal-failover.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new PrincipalFailoverController();

router.use(requireAuth);

router.get('/status', requirePermissionGuard('settings', 'view'), controller.getStatus);
router.post('/toggle', requirePermissionGuard('settings', 'update'), controller.toggleStatus);
router.get('/logs', requirePermissionGuard('reports', 'view'), controller.getAuditLogs);

export default router;
