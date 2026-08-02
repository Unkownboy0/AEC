"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
// Profile & Directory routes (must be above /:id to avoid parameter collision)
router.put('/profile', auth_middleware_1.requireAuth, controller.updateProfile);
router.get('/directory-stats', auth_middleware_1.requireAuth, controller.getDirectoryStats);
router.post('/generate-credentials', auth_middleware_1.requireAuth, controller.generateCredentials);
router.post('/assign-subjects', auth_middleware_1.requireAuth, controller.assignSubjects);
router.post('/assign-mentor', auth_middleware_1.requireAuth, controller.assignMentor);
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.create);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.update);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.delete);
router.post('/:id/reset-password', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.resetPassword);
router.post('/:id/regenerate-credentials', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.regenerateUserCredentials);
router.post('/:id/unlock', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.unlockUserAccount);
router.post('/import', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.import);
exports.default = router;
//# sourceMappingURL=users.routes.js.map