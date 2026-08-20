import { Router } from 'express';
import { ChatController } from './chat.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new ChatController();

router.use(requireAuth);

router.get('/students/search', controller.searchStudents);
router.get('/faculty/list', controller.listAvailableFaculty);
router.get('/recipients/search', controller.searchRecipients);
router.get('/conversations', controller.listConversations);
router.post('/conversations/group', controller.createGroup);
router.put('/conversations/group/:conversationId', controller.updateGroupDetails);
router.post('/conversations/group/:conversationId/members', controller.addGroupMembers);
router.delete('/conversations/group/:conversationId/members/:userId', controller.removeGroupMember);
router.put('/conversations/group/:conversationId/members/:userId/role', controller.changeGroupMemberRole);
router.post('/conversations/group/:conversationId/leave', controller.leaveGroup);
router.get('/messages/:conversationId', controller.getMessages);
router.post('/messages', controller.sendMessage);
router.put('/messages/:messageId', controller.editMessage);
router.delete('/messages/:messageId', controller.deleteMessage);
router.post('/messages/:messageId/forward', controller.forwardMessage);

export default router;
