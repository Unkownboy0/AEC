"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const users_controller_1 = require("../users/users.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new auth_controller_1.AuthController();
const usersController = new users_controller_1.UsersController();
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/refresh', controller.refresh);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
// Protected routes
router.get('/me', auth_middleware_1.requireAuth, controller.getMe);
router.post('/switch-workspace', auth_middleware_1.requireAuth, controller.switchWorkspace);
router.post('/change-password', auth_middleware_1.requireAuth, controller.changePassword);
router.post('/logout-all', auth_middleware_1.requireAuth, controller.logoutAll);
// Self-service profile update — available to ALL authenticated roles
// Frontend calls PUT /auth/profile, which proxies to the users updateProfile service
router.put('/profile', auth_middleware_1.requireAuth, usersController.updateProfile);
router.patch('/profile', auth_middleware_1.requireAuth, usersController.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map