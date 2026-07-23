"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("./chat.controller");
const auth_middleware_1 = require("../../core/middlewares/auth.middleware");
const router = (0, express_1.Router)();
const controller = new chat_controller_1.ChatController();
router.use(auth_middleware_1.requireAuth);
router.get('/students/search', controller.searchStudents);
router.get('/faculty/list', controller.listAvailableFaculty);
router.get('/conversations', controller.listConversations);
router.get('/messages/:conversationId', controller.getMessages);
router.post('/messages', controller.sendMessage);
router.put('/messages/:messageId', controller.editMessage);
router.delete('/messages/:messageId', controller.deleteMessage);
router.post('/messages/:messageId/forward', controller.forwardMessage);
exports.default = router;
//# sourceMappingURL=chat.routes.js.map