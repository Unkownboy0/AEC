"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("./settings.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new settings_controller_1.SettingsController();
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('settings:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('settings:write'), controller.update);
router.get('/principal-availability', auth_middleware_1.requireAuth, controller.getPrincipalAvailability);
router.post('/principal-availability', auth_middleware_1.requireAuth, controller.setPrincipalAvailability);
exports.default = router;
//# sourceMappingURL=settings.routes.js.map