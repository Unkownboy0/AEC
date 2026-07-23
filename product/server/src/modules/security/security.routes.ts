import { Router } from 'express';
import { SecurityController } from './security.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new SecurityController();

router.get('/audits', requireAuth, requirePermission('audit:read'), controller.getAudits);
router.get('/logins', requireAuth, requirePermission('audit:read'), controller.getLogins);
router.get('/sessions', requireAuth, requirePermission('audit:read'), controller.getSessions);
router.patch('/sessions/:id/block', requireAuth, requirePermission('users:write'), controller.blockUser);
router.patch('/users/:id/unblock', requireAuth, requirePermission('users:write'), controller.unblockUser);

export default router;
