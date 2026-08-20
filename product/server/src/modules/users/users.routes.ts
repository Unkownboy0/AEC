import { Router } from 'express';
import { UsersController } from './users.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new UsersController();

// Profile & Directory routes (must be above /:id to avoid parameter collision)
router.put('/profile', requireAuth, controller.updateProfile);
router.put('/profile/avatar', requireAuth, controller.uploadProfileAvatar);
router.delete('/profile/avatar', requireAuth, controller.removeProfileAvatar);
router.get('/profile/preferences', requireAuth, controller.getPreferences);
router.put('/profile/preferences', requireAuth, controller.updatePreferences);
router.get('/directory-stats', requireAuth, requirePermission('users:read'), controller.getDirectoryStats);
router.post('/generate-credentials', requireAuth, requirePermission('users:write'), controller.generateCredentials);
router.post('/assign-subjects', requireAuth, requirePermission('academics:write'), controller.assignSubjects);
router.post('/assign-mentor', requireAuth, requirePermission('users:write'), controller.assignMentor);
router.post('/import/preview', requireAuth, requirePermission('users:write'), controller.previewImport);
router.post('/import/commit', requireAuth, requirePermission('users:write'), controller.commitImport);
router.post('/import/file-preview', requireAuth, requirePermission('users:write'), controller.previewImportFile);
router.post('/import/file-commit', requireAuth, requirePermission('users:write'), controller.commitImportFile);

router.get('/', requireAuth, requirePermission('users:read'), controller.list);
router.get('/directory', requireAuth, requirePermission('users:read'), controller.list);
// Authenticated, minimal identity-image delivery; does not expose profile fields.
router.get('/:id/avatar', requireAuth, controller.getProfileAvatar);
router.get('/:id', requireAuth, requirePermission('users:read'), controller.getById);
router.post('/', requireAuth, requirePermission('users:write'), controller.create);
router.put('/:id', requireAuth, requirePermission('users:write'), controller.update);
router.delete('/:id', requireAuth, requirePermission('users:write'), controller.delete);
router.post('/:id/reset-password', requireAuth, requirePermission('users:write'), controller.resetPassword);
router.post('/:id/regenerate-credentials', requireAuth, requirePermission('users:write'), controller.regenerateUserCredentials);
router.post('/:id/unlock', requireAuth, requirePermission('users:write'), controller.unlockUserAccount);
router.post('/import', requireAuth, requirePermission('users:write'), controller.import);

export default router;
