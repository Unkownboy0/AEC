"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new dashboard_controller_1.DashboardController();
router.get('/stats', auth_middleware_1.requireAuth, controller.getStats);
router.get('/charts', auth_middleware_1.requireAuth, controller.getCharts);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map