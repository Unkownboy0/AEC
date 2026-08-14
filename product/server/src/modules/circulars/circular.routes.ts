import { Router } from 'express';
import { CircularController } from './circular.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

// Any authenticated user with issuing authority — recipient scope (institution
// vs department) is enforced inside the controller/service, not here.
const circularIssuerGuard = requireRole([
  'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
  'Academic Dean', 'Admission Dean', 'IQAC Dean', 'HOD',
]);

// List & Create
router.get('/', CircularController.listCirculars);
router.post('/', circularIssuerGuard, CircularController.createAndPublishCircular);

// Single circular
router.get('/:id', CircularController.getCircularById);
router.patch('/:id', circularIssuerGuard, CircularController.updateCircular);

// Lifecycle actions
router.post('/:id/publish', circularIssuerGuard, CircularController.publishCircular);
router.post('/:id/archive', circularIssuerGuard, CircularController.archiveCircular);
router.post('/:id/acknowledge', CircularController.acknowledgeCircular);
router.post('/:id/read', CircularController.markCircularRead);
router.post('/:id/clear', CircularController.clearCircular);
router.delete('/:id', circularIssuerGuard, CircularController.deleteCircular);

// Recipients & analytics
router.get('/:id/recipients', CircularController.getCircularRecipients);
router.get('/:id/analytics', CircularController.getCircularAnalytics);

// Reminders
router.post('/:id/remind', circularIssuerGuard, CircularController.remindRecipients);

export default router;
