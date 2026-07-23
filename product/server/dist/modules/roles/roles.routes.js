"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roles_controller_1 = require("./roles.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new roles_controller_1.RolesController();
// Basic query routes
router.get('/permissions', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.getPermissions);
router.get('/matrix', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.getMatrix);
router.post('/matrix', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.updateMatrix);
// Permission Templates routes
router.get('/templates', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.listTemplates);
router.post('/templates', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.createTemplate);
router.get('/templates/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.getTemplate);
router.put('/templates/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.updateTemplate);
router.delete('/templates/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.deleteTemplate);
router.post('/templates/:id/apply', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.applyTemplate);
// Role CRUD routes
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.create);
router.get('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.getRole);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.update);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.delete);
router.post('/:id/clone', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.clone);
// Role mappings routes
router.put('/:id/permissions', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.updatePermissions);
router.get('/:id/users', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:read'), controller.getUsers);
router.post('/:id/users', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.addUsers);
router.delete('/:id/users/:userId', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('roles:write'), controller.removeUser);
exports.default = router;
//# sourceMappingURL=roles.routes.js.map