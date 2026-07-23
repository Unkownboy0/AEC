"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("./ai.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new ai_controller_1.AiController();
router.use(auth_middleware_1.requireAuth);
router.post('/chat', controller.chat);
router.post('/revision', controller.generateRevision);
router.get('/history', controller.getChatHistory);
router.delete('/history', controller.clearHistory);
router.get('/predictions', controller.getPredictions);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map