"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assignments_controller_1 = require("./assignments.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new assignments_controller_1.AssignmentController();
router.use(auth_middleware_1.requireAuth);
// Assignment CRUD
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
// Submissions
router.post('/:id/submit', controller.submit);
router.get('/:id/submissions', controller.getSubmissions);
router.put('/submissions/:submissionId/grade', controller.grade);
exports.default = router;
//# sourceMappingURL=assignments.routes.js.map