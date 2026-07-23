import { Router } from 'express';
import { ChatController } from './chat.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new ChatController();

router.use(requireAuth);

router.get('/students/search', controller.searchStudents);
router.get('/faculty/list', controller.listAvailableFaculty);
router.get('/conversations', controller.listConversations);
router.get('/messages/:conversationId', controller.getMessages);
router.post('/messages', controller.sendMessage);
router.put('/messages/:messageId', controller.editMessage);
router.delete('/messages/:messageId', controller.deleteMessage);
router.post('/messages/:messageId/forward', controller.forwardMessage);

export default router;
