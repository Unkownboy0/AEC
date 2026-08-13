import { Router } from 'express';
import { RbacController } from './rbac.controller';
import { requireAuth } from '../../core/middlewares/auth.middleware';
import { requireSuperAdmin } from '../../core/middlewares/rbac.middleware';

const router = Router();
const controller = new RbacController();

// SSE Stream Endpoint (Realtime permissions sync)
router.get('/stream', requireAuth, controller.streamRealtimeEvents.bind(controller));

// Public/Auth routes for getting user's active RBAC set
router.get('/me', requireAuth, controller.getMyRBAC.bind(controller));

// Master Authority & Super Admin Routes
router.get('/matrix', requireAuth, requireSuperAdmin(), controller.getMasterMatrix.bind(controller));
router.post('/roles', requireAuth, requireSuperAdmin(), controller.createRole.bind(controller));
router.patch('/roles/:roleId/rename', requireAuth, requireSuperAdmin(), controller.renameRole.bind(controller));
router.delete('/roles/:roleId', requireAuth, requireSuperAdmin(), controller.deleteRole.bind(controller));
router.post('/roles/clone', requireAuth, requireSuperAdmin(), controller.cloneRole.bind(controller));
router.post('/roles/merge', requireAuth, requireSuperAdmin(), controller.mergeRoles.bind(controller));
router.put('/roles/:roleId/config', requireAuth, requireSuperAdmin(), controller.updateRoleConfig.bind(controller));

// Bulk operations
router.post('/bulk/role-assignment', requireAuth, requireSuperAdmin(), controller.bulkRoleAssignment.bind(controller));
router.post('/bulk/permission-update', requireAuth, requireSuperAdmin(), controller.bulkPermissionUpdate.bind(controller));

// Super Admin User Control
router.patch('/users/:userId', requireAuth, requireSuperAdmin(), controller.adminUpdateUser.bind(controller));

// Approval Matrix Rules
router.get('/approval-rules', requireAuth, requireSuperAdmin(), controller.getApprovalRules.bind(controller));
router.post('/approval-rules', requireAuth, requireSuperAdmin(), controller.setApprovalRule.bind(controller));

// Audit Logs
router.get('/audit-logs', requireAuth, requireSuperAdmin(), controller.getAuditLogs.bind(controller));
router.get('/permission-audits', requireAuth, requireSuperAdmin(), controller.getPermissionAudits.bind(controller));

// Permission Groups (Phase 1)
router.get('/groups', requireAuth, requireSuperAdmin(), controller.getPermissionGroups.bind(controller));

export default router;
