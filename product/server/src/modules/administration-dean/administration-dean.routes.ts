import { Router } from 'express';
import { requireAuth, requirePermission, requireRole } from '../../core/middlewares/auth.middleware';
import { AdministrationDeanController } from './administration-dean.controller';

const router = Router();
const controller = new AdministrationDeanController();
const roles = ['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'];

router.use(requireAuth, requireRole(roles));
router.get('/dashboard', controller.dashboard.bind(controller));
router.get('/export', requirePermission('reports:export'), controller.export.bind(controller));

export default router;
