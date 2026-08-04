import { Router } from 'express';
import { DelegationController } from './delegation.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/principal/status', DelegationController.getPrincipalStatus);
router.post('/principal/status', DelegationController.updatePrincipalStatus);
router.post('/principal/delegations/:id/revoke', DelegationController.revokeDelegation);

router.get('/vp/acting-principal/status', DelegationController.getVpActingStatus);
router.post('/vp/acting-principal/acknowledge/:id', DelegationController.acknowledgeDelegation);

export default router;
