"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = require("./users.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new users_controller_1.UsersController();
// Profile route (must be above /:id to avoid parameter collision)
router.put('/profile', auth_middleware_1.requireAuth, controller.updateProfile);
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.create);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.update);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.delete);
router.post('/:id/reset-password', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.resetPassword);
router.post('/import', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.import);
exports.default = router;
//# sourceMappingURL=users.routes.js.map