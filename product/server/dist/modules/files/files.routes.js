"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const files_controller_1 = require("./files.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new files_controller_1.FilesController();
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('files:read'), controller.list);
router.post('/upload', auth_middleware_1.requireAuth, (req, res, next) => {
    const user = req.user;
    if (user && ['Student', 'HOD', 'Faculty', 'Super Admin', 'College Admin', 'Principal', 'Vice Principal'].includes(user.role)) {
        return next();
    }
    return (0, auth_middleware_1.requirePermission)('files:write')(req, res, next);
}, controller.upload);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requirePermission)('files:write'), controller.delete);
exports.default = router;
//# sourceMappingURL=files.routes.js.map