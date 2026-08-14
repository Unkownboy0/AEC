import { Router } from 'express';
import { DelegationController } from './delegation.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

const principalGuard = requireRole(['Principal', 'Super Admin']);
const vpGuard = requireRole(['Vice Principal', 'Super Admin']);

router.get('/principal/status', principalGuard, DelegationController.getPrincipalStatus);
router.post('/principal/status', principalGuard, DelegationController.updatePrincipalStatus);
router.post('/principal/delegations/:id/revoke', principalGuard, DelegationController.revokeDelegation);

router.get('/vp/acting-principal/status', vpGuard, DelegationController.getVpActingStatus);
router.post('/vp/acting-principal/acknowledge/:id', vpGuard, DelegationController.acknowledgeDelegation);

export default router;
