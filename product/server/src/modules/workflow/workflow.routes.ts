import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new WorkflowController();

router.use(requireAuth);

// takeAction's FacultyLeaveRequest branch (workflow.service.ts) approves/rejects
// with no internal role check, unlike the generic WorkflowRequest path which
// enforces `isExecutiveOrHod` per-step. Gate at the route until that branch is
// refactored to enforce the same check itself.
const workflowActionGuard = requireRole([
  'Super Admin', 'College Admin', 'HOD', 'Academic Dean', 'Admission Dean',
  'IQAC Dean', 'Vice Principal', 'Principal', 'Mentor', 'Faculty',
]);

router.post('/requests', controller.createRequest);
router.get('/requests', controller.listRequests);
router.post('/requests/:id/action', workflowActionGuard, controller.takeAction);
router.post('/requests/:id/cancel', controller.cancelRequest);

// Workflow Definitions & Configuration — institutional approval-chain config
const workflowConfigGuard = requireRole(['Super Admin', 'College Admin']);
router.get('/definitions', controller.listDefinitions);
router.get('/definitions/:module', controller.getDefinition);
router.post('/definitions', workflowConfigGuard, controller.createOrUpdateDefinition);
router.patch('/definitions/:id/activate', workflowConfigGuard, controller.toggleDefinitionActive);

export default router;
