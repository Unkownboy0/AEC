import { Router } from 'express';
import { PrincipalAvailabilityController } from './availability.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { ActingPrincipalGuard } from './delegation.guard';

const router = Router();

router.use(requireAuth);

// Principal Routes
router.get('/principal/availability/context', PrincipalAvailabilityController.getContext);
router.get('/principal/availability/eligible-delegates', PrincipalAvailabilityController.getEligibleDelegates);
router.post('/principal/availability', PrincipalAvailabilityController.updateAvailability);
router.get('/principal/approval-center', PrincipalAvailabilityController.getPrincipalApprovalCenter);
router.post('/principal/approval-center/requests/:id/approve', PrincipalAvailabilityController.approvePrincipalRequest);
router.post('/principal/approval-center/requests/:id/reject', PrincipalAvailabilityController.rejectPrincipalRequest);
router.post('/approval-requests/:id/approve', PrincipalAvailabilityController.approvePrincipalRequest);
router.post('/approval-requests/:id/reject', PrincipalAvailabilityController.rejectPrincipalRequest);

// Principal Handover Routes
router.get('/principal/handover/latest', PrincipalAvailabilityController.getLatestHandover);
router.post('/principal/handover/:id/acknowledge', PrincipalAvailabilityController.acknowledgeHandover);

// Vice Principal Acting Principal Routes
router.get('/vp/acting-principal/context', PrincipalAvailabilityController.getContext);
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
