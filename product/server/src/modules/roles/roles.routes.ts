import { Router } from 'express';
import { RolesController } from './roles.controller';
import { requireAuth, requirePermission } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new RolesController();

// Basic query routes
router.get('/permissions', requireAuth, requirePermission('roles:read'), controller.getPermissions);
router.get('/matrix', requireAuth, requirePermission('roles:read'), controller.getMatrix);
router.post('/matrix', requireAuth, requirePermission('roles:write'), controller.updateMatrix);
router.get('/version', requireAuth, controller.getMatrixVersion);
router.post('/simulate', requireAuth, controller.simulateRole);
router.post('/bulk-assign', requireAuth, requirePermission('roles:write'), controller.bulkOperation);

// Permission Templates routes
router.get('/templates', requireAuth, requirePermission('roles:read'), controller.listTemplates);
router.post('/templates', requireAuth, requirePermission('roles:write'), controller.createTemplate);
router.get('/templates/:id', requireAuth, requirePermission('roles:read'), controller.getTemplate);
router.put('/templates/:id', requireAuth, requirePermission('roles:write'), controller.updateTemplate);
router.delete('/templates/:id', requireAuth, requirePermission('roles:write'), controller.deleteTemplate);
router.post('/templates/:id/apply', requireAuth, requirePermission('roles:write'), controller.applyTemplate);

// Role CRUD routes
router.get('/', requireAuth, requirePermission('roles:read'), controller.list);
router.post('/', requireAuth, requirePermission('roles:write'), controller.create);
router.get('/:id', requireAuth, requirePermission('roles:read'), controller.getRole);
router.put('/:id', requireAuth, requirePermission('roles:write'), controller.update);
router.delete('/:id', requireAuth, requirePermission('roles:write'), controller.delete);
router.post('/:id/clone', requireAuth, requirePermission('roles:write'), controller.clone);

// Role mappings routes
router.put('/:id/permissions', requireAuth, requirePermission('roles:write'), controller.updatePermissions);
router.get('/:id/users', requireAuth, requirePermission('roles:read'), controller.getUsers);
router.post('/:id/users', requireAuth, requirePermission('roles:write'), controller.addUsers);
router.delete('/:id/users/:userId', requireAuth, requirePermission('roles:write'), controller.removeUser);

export default router;
