"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_controller_1 = require("./notifications.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new notifications_controller_1.NotificationsController();
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('notifications:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('notifications:write'), controller.create);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('notifications:write'), controller.delete);
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map