import { Router } from 'express';
import { CircularController } from './circular.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// List & Create
router.get('/circulars', CircularController.listCirculars);
router.post('/circulars', CircularController.createAndPublishCircular);

// Single circular
router.get('/circulars/:id', CircularController.getCircularById);
router.patch('/circulars/:id', CircularController.updateCircular);

// Lifecycle actions
router.post('/circulars/:id/publish', CircularController.publishCircular);
router.post('/circulars/:id/archive', CircularController.archiveCircular);
router.post('/circulars/:id/acknowledge', CircularController.acknowledgeCircular);

// Recipients & analytics
router.get('/circulars/:id/recipients', CircularController.getCircularRecipients);
router.get('/circulars/:id/analytics', CircularController.getCircularAnalytics);

// Reminders
router.post('/circulars/:id/remind', CircularController.remindRecipients);

export default router;
