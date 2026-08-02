import { Request, Response, NextFunction } from 'express';
import { RbacService } from './rbac.service';
import { registerSSEClient, removeSSEClient } from '../../lib/socket';

const rbacService = new RbacService();

export class RbacController {
  // SSE stream for real-time synchronization
  async streamRealtimeEvents(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req.query.userId as string);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    registerSSEClient(userId || 'anonymous', res);

    req.on('close', () => {
      removeSSEClient(res);
    });
  }

  // Get current user's dynamic RBAC profile
  async getMyRBAC(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const data = await rbacService.evaluateUserRBAC(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  // Get master role permission matrix (Super Admin)
  async getMasterMatrix(req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await rbacService.getMasterMatrix();
      res.status(200).json({ status: 'success', data: roles });
    } catch (err) {
      next(err);
    }
  }

  // Create Custom Role
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const role = await rbacService.createRole(req.body, adminId);
      res.status(201).json({ status: 'success', data: role });
    } catch (err) {
      next(err);
    }
  }

  // Rename Role
  async renameRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const role = await rbacService.renameRole(req.params.roleId, req.body.name, adminId);
      res.status(200).json({ status: 'success', data: role });
    } catch (err) {
      next(err);
    }
  }

  // Delete Role
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const result = await rbacService.deleteRole(req.params.roleId, adminId);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  // Clone Role
  async cloneRole(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const { sourceRoleId, newRoleName, newRoleCode } = req.body;
      const role = await rbacService.cloneRole(sourceRoleId, newRoleName, newRoleCode, adminId);
      res.status(201).json({ status: 'success', data: role });
    } catch (err) {
      next(err);
    }
  }

  // Merge Roles
  async mergeRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const { sourceRoleId, targetRoleId, deleteSource } = req.body;
      const result = await rbacService.mergeRoles(sourceRoleId, targetRoleId, deleteSource, adminId);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  // Update Role Configuration
  async updateRoleConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const role = await rbacService.updateRoleConfig(req.params.roleId, req.body, adminId);
      res.status(200).json({ status: 'success', data: role });
    } catch (err) {
      next(err);
    }
  }

  // Bulk Role Assignment
  async bulkRoleAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const { userIds, roleId } = req.body;
      const result = await rbacService.bulkRoleAssignment(userIds, roleId, adminId);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  // Bulk Permission Update
  async bulkPermissionUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const { roleIds, moduleName, actionName, value } = req.body;
      const result = await rbacService.bulkPermissionUpdate(roleIds, moduleName, actionName, value, adminId);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  // Super Admin User Control
  async adminUpdateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const user = await rbacService.adminUpdateUser(req.params.userId, req.body, adminId);
      res.status(200).json({ status: 'success', data: user });
    } catch (err) {
      next(err);
    }
  }

  // Approval Matrix
  async getApprovalRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await rbacService.getApprovalRules();
      res.status(200).json({ status: 'success', data: rules });
    } catch (err) {
      next(err);
    }
  }

  async setApprovalRule(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'SUPER_ADMIN';
      const { workflowType, stepOrder, approverRole, conditions } = req.body;
      const rule = await rbacService.setApprovalRule(workflowType, stepOrder, approverRole, conditions, adminId);
      res.status(200).json({ status: 'success', data: rule });
    } catch (err) {
      next(err);
    }
  }

  // Audit Logs
  async getAuditLogs(req: Request, res: Response, NextFunction: NextFunction) {
    try {
      const logs = await rbacService.getAuditLogs({
        entityType: req.query.entityType as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      });
      res.status(200).json({ status: 'success', data: logs });
    } catch (err) {
      NextFunction(err);
    }
  }

  // Permission Groups (Phase 1)
  async getPermissionGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await rbacService.getPermissionGroups();
      res.status(200).json({ status: 'success', data: groups });
    } catch (err) {
      next(err);
    }
  }

  // Permission Audits (Phase 1 Denied Request & Permission Changes)
  async getPermissionAudits(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await rbacService.getPermissionAuditLogs({
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        userId: req.query.userId as string,
        action: req.query.action as string,
      });
      res.status(200).json({ status: 'success', data: logs });
    } catch (err) {
      next(err);
    }
  }
}
