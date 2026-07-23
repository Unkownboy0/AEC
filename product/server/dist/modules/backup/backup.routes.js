"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backup_controller_1 = require("./backup.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new backup_controller_1.BackupController();
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('backups:read'), controller.list);
router.post('/trigger', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('backups:write'), controller.trigger);
router.get('/:id/download', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('backups:read'), controller.download);
router.post('/:id/restore', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('backups:write'), controller.restore);
exports.default = router;
//# sourceMappingURL=backup.routes.js.map