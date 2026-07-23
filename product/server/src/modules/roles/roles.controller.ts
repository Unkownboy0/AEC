import { Request, Response, NextFunction } from 'express';
import { RolesService } from './roles.service';
import { createRoleSchema, updateRoleSchema, syncPermissionsSchema, bulkAssignUsersSchema, createTemplateSchema } from './roles.validator';
import { BadRequestException } from '../../utils/exceptions';
import { prisma } from '../../lib/prisma';

export class RolesController {
  private service = new RolesService();

  /**
   * List roles
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await this.service.listRoles(req.query);
      res.status(200).json({
        status: 'success',
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get single role details
   */
  getRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await this.service.getRole(req.params.id);
      res.status(200).json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create role
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createRoleSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      const role = await this.service.createRole(validation.data, req.user!.id);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          module: 'ROLE',
          description: `Created role '${role.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        status: 'success',
        data: role,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update role
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = updateRoleSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      const updated = await this.service.updateRole(req.params.id, validation.data, req.user!.id);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Updated role details for '${updated.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete role
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await prisma.role.findUnique({ where: { id: req.params.id } });
      if (!role) throw new BadRequestException('Role not found');

      await this.service.deleteRole(req.params.id, req.user!.id);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          module: 'ROLE',
          description: `Deleted role '${role.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Role deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clone permissions from one role to a new role
   */
  clone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, description } = req.body;
      if (!name) throw new BadRequestException('Cloned role name is required');

      const cloned = await this.service.cloneRole(req.params.id, { name, description }, req.user!.id);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          module: 'ROLE',
          description: `Cloned role ID '${req.params.id}' as '${cloned.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        status: 'success',
        data: cloned,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Role Permission Matrix Grid
   */
  getMatrix = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [roles, permissions] = await Promise.all([
        prisma.role.findMany({
          include: {
            permissions: {
              select: { permissionId: true },
            },
          },
          orderBy: { hierarchy: 'asc' },
        }),
        prisma.permission.findMany({
          orderBy: { name: 'asc' },
        }),
      ]);

      const matrix = roles.map((role) => ({
        roleId: role.id,
        roleName: role.name,
        permissionIds: role.permissions.map((p) => p.permissionId),
      }));

      res.status(200).json({
        status: 'success',
        data: {
          matrix,
          permissions,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update permissions matrix for a role
   */
  updateMatrix = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId, permissionIds } = req.body;
      if (!roleId || !Array.isArray(permissionIds)) {
        throw new BadRequestException('roleId and permissionIds array are required');
      }

      await this.service.syncPermissions(roleId, permissionIds);

      // Audit Log
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Updated permissions matrix for role '${role?.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Permissions synced successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all permissions flat list
   */
  getPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await this.service.listPermissions();
      res.status(200).json({
        status: 'success',
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sync permission list for a role
   */
  updatePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = syncPermissionsSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      await this.service.syncPermissions(req.params.id, validation.data.permissionIds);

      // Audit Log
      const role = await prisma.role.findUnique({ where: { id: req.params.id } });
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Updated permissions list for role '${role?.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Role permissions updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get users assigned to a role
   */
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getRoleUsers(req.params.id, req.query);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add users to a role
   */
  addUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = bulkAssignUsersSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      await this.service.bulkAssignUsers(req.params.id, validation.data.userIds);

      // Audit Log
      const role = await prisma.role.findUnique({ where: { id: req.params.id } });
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Assigned ${validation.data.userIds.length} users to role '${role?.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Users assigned to role successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove a user from a role
   */
  removeUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: roleId, userId } = req.params;
      await this.service.unassignUser(roleId, userId);

      // Audit Log
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Unassigned user '${user?.email}' from role '${role?.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'User unassigned from role successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Templates endpoints
   */
  listTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await this.service.listTemplates();
      res.status(200).json({
        status: 'success',
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await this.service.getTemplate(req.params.id);
      res.status(200).json({
        status: 'success',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createTemplateSchema.safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      const template = await this.service.createTemplate(validation.data);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE',
          module: 'ROLE',
          description: `Created permission template '${template.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        status: 'success',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = createTemplateSchema.partial().safeParse(req.body);
      if (!validation.success) {
        throw new BadRequestException(validation.error.errors[0].message);
      }

      const template = await this.service.updateTemplate(req.params.id, validation.data);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Updated permission template '${template.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const template = await prisma.permissionTemplate.findUnique({ where: { id: req.params.id } });
      if (!template) throw new BadRequestException('Template not found');

      await this.service.deleteTemplate(req.params.id);

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          module: 'ROLE',
          description: `Deleted permission template '${template.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  applyTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = req.body;
      if (!roleId) throw new BadRequestException('roleId is required');

      await this.service.applyTemplate(req.params.id, roleId);

      const template = await prisma.permissionTemplate.findUnique({ where: { id: req.params.id } });
      const role = await prisma.role.findUnique({ where: { id: roleId } });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Applied permission template '${template?.name}' to role '${role?.name}'`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Template applied successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get matrix version timestamp for real-time permission invalidation
   */
  getMatrixVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getMatrixVersion();
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Simulate role preview
   */
  simulateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetRoleName } = req.body;
      if (!targetRoleName) throw new BadRequestException('targetRoleName is required');

      const data = await this.service.simulateRole(targetRoleName, req.user);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk role & department operation
   */
  bulkOperation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.bulkOperation(req.body);

      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE',
          module: 'ROLE',
          description: `Performed bulk role/department assignment for ${data.count} users`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}
