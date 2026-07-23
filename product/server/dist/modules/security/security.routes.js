"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const security_controller_1 = require("./security.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new security_controller_1.SecurityController();
router.get('/audits', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('audit:read'), controller.getAudits);
router.get('/logins', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('audit:read'), controller.getLogins);
router.get('/sessions', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('audit:read'), controller.getSessions);
router.patch('/sessions/:id/block', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.blockUser);
router.patch('/users/:id/unblock', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('users:write'), controller.unblockUser);
exports.default = router;
//# sourceMappingURL=security.routes.js.map