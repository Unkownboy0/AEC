import { Router } from 'express';
import { DelegationController } from './delegation.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Principal Routes
router.get('/principal/status/current', DelegationController.getCurrentStatus);
router.get('/principal/availability/context', DelegationController.getCurrentStatus);
router.post('/principal/status', DelegationController.updateStatus);
router.post('/principal/availability', DelegationController.updateStatus);
router.get('/principal/delegations/active', DelegationController.getCurrentStatus);
router.post('/principal/delegations/:id/revoke', DelegationController.revokeDelegation);

// Principal Handover Routes
router.get('/principal/handover/latest', DelegationController.getLatestHandover);
router.post('/principal/handover/:id/acknowledge', DelegationController.acknowledgeHandover);
router.get('/principal/handover/history', DelegationController.getHandoverHistory);

// Vice Principal Acting Principal Routes
router.get('/vp/acting-principal/context', DelegationController.getVpContext);
router.post('/vp/acting-principal/acknowledge', DelegationController.acknowledge);
router.get('/vp/acting-principal/approval-center', DelegationController.getDelegatedApprovalCenter);
router.post('/vp/acting-principal/approvals/:id/approve', DelegationController.approveRequest);
router.post('/vp/acting-principal/approvals/:id/reject', DelegationController.rejectRequest);

export default router;
