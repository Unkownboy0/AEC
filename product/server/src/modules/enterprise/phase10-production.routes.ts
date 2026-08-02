import { Router } from 'express';
import { Phase10ProductionController } from './phase10-production.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new Phase10ProductionController();

// Public Health & Readiness Probes
router.get('/health', controller.getHealth);
router.get('/readiness', controller.getReadiness);

// Super Admin Operational Endpoints
router.get('/metrics', requireAuth, requirePermissionGuard('system_settings', 'view'), controller.getMetrics);
router.post('/admin/backup', requireAuth, requirePermissionGuard('system_settings', 'edit'), controller.triggerBackup);
router.get('/admin/backups', requireAuth, requirePermissionGuard('system_settings', 'view'), controller.getBackups);

export default router;
