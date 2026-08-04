import { Router } from 'express';
import { CircularController } from './circular.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/circulars', CircularController.listCirculars);
router.post('/circulars', CircularController.createAndPublishCircular);
router.post('/circulars/:id/acknowledge', CircularController.acknowledgeCircular);
router.get('/circulars/:id/analytics', CircularController.getCircularAnalytics);

export default router;
