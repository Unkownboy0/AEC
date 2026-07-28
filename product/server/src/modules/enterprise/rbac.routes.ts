import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';

const router = Router();
const controller = new RbacController();

// SSE Stream Endpoint (Realtime permissions sync)
router.get('/stream', controller.streamRealtimeEvents.bind(controller));

// Public/Auth routes for getting user's active RBAC set
router.get('/me', requireAuth, controller.getMyRBAC.bind(controller));

// Master Authority & Super Admin Routes
router.get('/matrix', requireAuth, controller.getMasterMatrix.bind(controller));
router.post('/roles', requireAuth, controller.createRole.bind(controller));
router.patch('/roles/:roleId/rename', requireAuth, controller.renameRole.bind(controller));
router.delete('/roles/:roleId', requireAuth, controller.deleteRole.bind(controller));
router.post('/roles/clone', requireAuth, controller.cloneRole.bind(controller));
router.post('/roles/merge', requireAuth, controller.mergeRoles.bind(controller));
router.put('/roles/:roleId/config', requireAuth, controller.updateRoleConfig.bind(controller));

// Bulk operations
router.post('/bulk/role-assignment', requireAuth, controller.bulkRoleAssignment.bind(controller));
router.post('/bulk/permission-update', requireAuth, controller.bulkPermissionUpdate.bind(controller));

// Super Admin User Control
router.patch('/users/:userId', requireAuth, controller.adminUpdateUser.bind(controller));

// Approval Matrix Rules
router.get('/approval-rules', requireAuth, controller.getApprovalRules.bind(controller));
router.post('/approval-rules', requireAuth, controller.setApprovalRule.bind(controller));

// Audit Logs
router.get('/audit-logs', requireAuth, controller.getAuditLogs.bind(controller));

export default router;

