import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new WorkflowController();

router.use(requireAuth);

router.post('/requests', controller.createRequest);
router.get('/requests', controller.listRequests);
router.post('/requests/:id/action', controller.takeAction);
router.post('/requests/:id/cancel', controller.cancelRequest);

// Workflow Definitions & Configuration
router.get('/definitions', controller.listDefinitions);
router.get('/definitions/:module', controller.getDefinition);
router.post('/definitions', controller.createOrUpdateDefinition);
router.patch('/definitions/:id/activate', controller.toggleDefinitionActive);

export default router;
