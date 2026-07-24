"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reports_controller_1 = require("./reports.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new reports_controller_1.ReportsController();
router.get('/admissions', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('reports:read'), controller.getAdmissions);
router.get('/revenue', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('reports:read'), controller.getRevenue);
router.get('/system', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('reports:read'), controller.getSystem);
router.get('/export', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('reports:read'), controller.exportReport);
exports.default = router;
//# sourceMappingURL=reports.routes.js.map