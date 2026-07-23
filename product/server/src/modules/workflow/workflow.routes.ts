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

export default router;
