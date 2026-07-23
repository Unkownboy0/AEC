import { Router } from 'express';
import { AiController } from './ai.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new AiController();

router.use(requireAuth);

router.post('/chat', controller.chat);
router.post('/revision', controller.generateRevision);
router.get('/history', controller.getChatHistory);
router.delete('/history', controller.clearHistory);
router.get('/predictions', controller.getPredictions);

export default router;
