import { Router } from 'express';
import { DelegationController } from './delegation.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

const principalGuard = requireRole(['Principal', 'Super Admin']);

// Principal Routes
router.get('/principal/status/current', DelegationController.getCurrentStatus);
router.post('/principal/status', principalGuard, DelegationController.updateStatus);
router.get('/principal/delegations/active', DelegationController.getCurrentStatus);
router.post('/principal/delegations/:id/revoke', principalGuard, DelegationController.revokeDelegation);

// Principal Handover Routes
router.get('/principal/handover/history', DelegationController.getHandoverHistory);

export default router;
