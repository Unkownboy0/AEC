import { Router } from 'express';
import { CircularController } from './circular.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// List & Create
router.get('/', CircularController.listCirculars);
router.post('/', CircularController.createAndPublishCircular);

// Single circular
router.get('/:id', CircularController.getCircularById);
router.patch('/:id', CircularController.updateCircular);

// Lifecycle actions
router.post('/:id/publish', CircularController.publishCircular);
router.post('/:id/archive', CircularController.archiveCircular);
router.post('/:id/acknowledge', CircularController.acknowledgeCircular);
router.post('/:id/read', CircularController.markCircularRead);
router.post('/:id/clear', CircularController.clearCircular);
router.delete('/:id', CircularController.deleteCircular);

// Recipients & analytics
router.get('/:id/recipients', CircularController.getCircularRecipients);
router.get('/:id/analytics', CircularController.getCircularAnalytics);

// Reminders
router.post('/:id/remind', CircularController.remindRecipients);

export default router;
