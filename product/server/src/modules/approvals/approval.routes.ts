import { Router } from 'express';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { ApprovalController } from './approval.controller';
import { requireApprovalRequestAccess } from './approval-access.middleware';

const router = Router();

// Apply auth middleware to all approval endpoints
router.use(requireAuth);
router.use('/approval-requests/:requestId', requireApprovalRequestAccess);

router.get('/approval-requests/:requestId/timeline', ApprovalController.getTimeline);
router.get('/approval-requests/:requestId/attachments', ApprovalController.getAttachments);
router.get('/approval-requests/:requestId/attachments/:attachmentId/download', ApprovalController.downloadAttachment);
router.get('/approval-requests/:requestId/details', ApprovalController.getRequestDetails);

export default router;
