"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const masters_controller_1 = require("./masters.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new masters_controller_1.MastersController();
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('masters:read'), controller.list);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('masters:write'), controller.create);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('masters:write'), controller.delete);
exports.default = router;
//# sourceMappingURL=masters.routes.js.map