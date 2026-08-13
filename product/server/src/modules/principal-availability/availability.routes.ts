import { Router } from 'express';
import { PrincipalAvailabilityController } from './availability.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { ActingPrincipalGuard } from './delegation.guard';

const router = Router();

router.use(requireAuth);

// Principal Routes
router.get('/principal/availability/context', PrincipalAvailabilityController.getContext);
router.get('/principal/availability/eligible-delegates', requireRole(['Principal']), PrincipalAvailabilityController.getEligibleDelegates);
router.post('/principal/availability', requireRole(['Principal']), PrincipalAvailabilityController.updateAvailability);
router.get('/principal/approval-center', requireRole(['Principal']), PrincipalAvailabilityController.getPrincipalApprovalCenter);
router.post('/principal/approval-center/requests/:id/approve', requireRole(['Principal']), PrincipalAvailabilityController.approvePrincipalRequest);
router.post('/principal/approval-center/requests/:id/reject', requireRole(['Principal']), PrincipalAvailabilityController.rejectPrincipalRequest);
router.post('/principal/approval-center/requests/:id/return', requireRole(['Principal']), PrincipalAvailabilityController.returnPrincipalRequest);
router.post('/approval-requests/:id/approve', requireRole(['Principal']), PrincipalAvailabilityController.approvePrincipalRequest);
router.post('/approval-requests/:id/reject', requireRole(['Principal']), PrincipalAvailabilityController.rejectPrincipalRequest);
router.post('/approval-requests/:id/return', requireRole(['Principal']), PrincipalAvailabilityController.returnPrincipalRequest);

// Principal Handover Routes
router.get('/principal/handover/latest', PrincipalAvailabilityController.getLatestHandover);
router.post('/principal/handover/:id/acknowledge', PrincipalAvailabilityController.acknowledgeHandover);

// Vice Principal Acting Principal Routes
router.get('/vp/acting-principal/context', requireRole(['VP', 'Vice Principal']), PrincipalAvailabilityController.getContext);
router.get(
  '/vp/acting-principal/approvals',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.getVpDelegatedApprovalCenter
);
router.get(
  '/vp/acting-principal/approval-center',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.getVpDelegatedApprovalCenter
);
router.get(
  '/vp/acting-principal/approvals/:id',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.getDelegatedRequestDetails
);
router.post(
  '/vp/acting-principal/approvals/:id/approve',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.approveDelegatedRequest
);
router.post(
  '/vp/acting-principal/approvals/:id/reject',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.rejectDelegatedRequest
);
router.post(
  '/vp/acting-principal/approvals/:id/return',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.returnDelegatedRequest
);
router.post(
  '/vp/acting-principal/approvals/:id/request-info',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.requestInfoDelegatedRequest
);
router.post(
  '/vp/acting-principal/acknowledge',
  ActingPrincipalGuard.requireActiveDelegation,
  PrincipalAvailabilityController.acknowledgeDelegation
);

export default router;
