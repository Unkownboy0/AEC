import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { VpCommandController } from './vp-command.controller';

const router = Router();
const controller = new VpCommandController();
router.use(requireAuth, requireRole(['VP', 'Vice Principal']));
router.get('/dashboard', controller.dashboard);
export default router;
