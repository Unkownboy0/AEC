import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new UsersController();

// Profile & Directory routes (must be above /:id to avoid parameter collision)
router.put('/profile', requireAuth, controller.updateProfile);
router.get('/directory-stats', requireAuth, controller.getDirectoryStats);
router.post('/generate-credentials', requireAuth, controller.generateCredentials);
router.post('/assign-subjects', requireAuth, controller.assignSubjects);
router.post('/assign-mentor', requireAuth, controller.assignMentor);

router.get('/', requireAuth, requirePermission('users:read'), controller.list);
router.post('/', requireAuth, requirePermission('users:write'), controller.create);
router.put('/:id', requireAuth, requirePermission('users:write'), controller.update);
router.delete('/:id', requireAuth, requirePermission('users:write'), controller.delete);
router.post('/:id/reset-password', requireAuth, requirePermission('users:write'), controller.resetPassword);
router.post('/:id/regenerate-credentials', requireAuth, requirePermission('users:write'), controller.regenerateUserCredentials);
router.post('/:id/unlock', requireAuth, requirePermission('users:write'), controller.unlockUserAccount);
router.post('/import', requireAuth, requirePermission('users:write'), controller.import);

export default router;
