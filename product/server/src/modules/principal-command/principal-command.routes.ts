import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { PrincipalCommandController } from './principal-command.controller';

const router = Router();
const controller = new PrincipalCommandController();
router.use(requireAuth, requireRole(['Principal']));
router.get('/dashboard', controller.dashboard);
router.get('/hierarchy', controller.hierarchy);
export default router;
