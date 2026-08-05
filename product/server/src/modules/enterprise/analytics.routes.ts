import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { requirePermissionGuard } from '../../core/middlewares/rbacGuard.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(requireAuth);

router.get('/dashboard', requirePermissionGuard('reports', 'view'), controller.getDashboard);
router.get(
  '/department-availability',
  requireRole(['HOD', 'DEAN', 'VICE_PRINCIPAL', 'VP', 'PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']),
  controller.getDepartmentAvailability
);
router.post('/reports/builder/run', requirePermissionGuard('reports', 'view'), controller.runCustomReport);
router.post('/reports/save', requirePermissionGuard('reports', 'create'), controller.saveReport);
router.get('/reports/saved', requirePermissionGuard('reports', 'view'), controller.getSavedReports);

export default router;
