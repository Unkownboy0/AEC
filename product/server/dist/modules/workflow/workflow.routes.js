"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflow_controller_1 = require("./workflow.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new workflow_controller_1.WorkflowController();
router.use(auth_middleware_1.requireAuth);
router.post('/requests', controller.createRequest);
router.get('/requests', controller.listRequests);
router.post('/requests/:id/action', controller.takeAction);
exports.default = router;
//# sourceMappingURL=workflow.routes.js.map