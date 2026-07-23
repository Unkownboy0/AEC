import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class RolesService {
  /**
   * List all roles with user counts and permissions
   */
  async listRoles(params: any) {
    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }
    if (params.search) {
      where.name = { contains: params.search };
    }
    if (params.isSystem !== undefined) {
      where.isSystem = params.isSystem === 'true';
    }

    const roles = await prisma.role.findMany({
      where,
      orderBy: [
        { hierarchy: 'asc' },
        { priority: 'asc' }
      ],
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    return roles;
  }

  /**
   * Get single role details
   */
  async getRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  /**
   * Create a custom role
   */
  async createRole(data: any, createdBy: string) {
    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Role name already exists');

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#6366f1',
        icon: data.icon || 'Shield',
        priority: data.priority || 0,
        hierarchy: data.hierarchy || 99,
        isSystem: false,
        status: data.status || 'ACTIVE',
        createdBy,
      }
    });

    return role;
  }

  /**
   * Update role details
   */
  async updateRole(id: string, data: any, updatedBy: string) {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystem) {
      // Prevent changing name of system roles
      if (data.name && data.name !== role.name) {
        throw new BadRequestException('System protected roles cannot be renamed');
      }
      // System roles status cannot be made inactive/archived
      if (data.status && data.status !== 'ACTIVE') {
        throw new BadRequestException('System protected roles cannot be archived or inactivated');
      }
    }

    if (data.name && data.name !== role.name) {
      const existing = await prisma.role.findUnique({ where: { name: data.name } });
      if (existing) throw new BadRequestException('Role name already exists');
    }

    const updated = await prisma.role.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        priority: data.priority,
        hierarchy: data.hierarchy,
        status: data.status,
      }
    });

    return updated;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string, deletedBy: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    if (!role) throw new NotFoundException('Role not found');

    if (role.isSystem) {
      throw new BadRequestException(`System role '${role.name}' is protected and cannot be deleted`);
    }

    if (role._count.users > 0) {
      throw new BadRequestException(`Cannot delete role '${role.name}' because it has ${role._count.users} assigned users. Please transfer the users first.`);
    }

    await prisma.role.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Clone permissions and details of a role
   */
  async cloneRole(id: string, data: { name: string; description?: string }, createdBy: string) {
    const sourceRole = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true }
    });
    if (!sourceRole) throw new NotFoundException('Source role not found');

    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Role name already exists');

    const cloned = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description || `Cloned from ${sourceRole.name}`,
        color: sourceRole.color,
        icon: sourceRole.icon,
        priority: sourceRole.priority,
        hierarchy: sourceRole.hierarchy,
        isSystem: false,
        status: 'ACTIVE',
        createdBy,
      }
    });

    // Copy permission maps
    if (sourceRole.permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: sourceRole.permissions.map((p) => ({
          roleId: cloned.id,
          permissionId: p.permissionId
        }))
      });
    }

    return cloned;
  }

  /**
   * Get all system permissions
   */
  async listPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Sync permission list for a role
   */
  async syncPermissions(roleId: string, permissionIds: string[]) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    if (role.name === 'Super Admin') {
      throw new BadRequestException('Super Admin permissions are system locked');
    }

    // Validate permission IDs
    const validPermissionsCount = await prisma.permission.count({
      where: { id: { in: permissionIds } }
    });
    if (validPermissionsCount !== permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Sync
    await prisma.rolePermission.deleteMany({ where: { roleId } });

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId,
          permissionId: pId
        }))
      });
    }

    RolesService.bumpPermissionVersion();
    return { success: true };
  }

  /**
   * Get users belonging to a role
   */
  async getRoleUsers(roleId: string, params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;

    const where: any = { roleId };
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search } },
        { lastName: { contains: params.search } },
        { email: { contains: params.search } }
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return { users, totalCount, page, pageSize };
  }

  /**
   * Bulk assign users to a role
   */
  async bulkAssignUsers(roleId: string, userIds: string[]) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    // Update users
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { roleId }
    });

    return { success: true };
  }

  /**
   * Unassign user (transfers them to Student baseline role)
   */
  async unassignUser(roleId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new NotFoundException('User not found');
    if (user.roleId !== roleId) {
      throw new BadRequestException('User is not assigned to this role');
    }

    // If user is Super Admin, check if they are the last active Super Admin
    if (user.role.name === 'Super Admin') {
      const superAdminCount = await prisma.user.count({
        where: { role: { name: 'Super Admin' }, status: 'ACTIVE' }
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot remove the last active Super Admin');
      }
    }

    // Find fallback Student role
    const studentRole = await prisma.role.findUnique({ where: { name: 'Student' } });
    if (!studentRole) throw new NotFoundException('Baseline student role not found');

    await prisma.user.update({
      where: { id: userId },
      data: { roleId: studentRole.id }
    });

    return { success: true };
  }

  /**
   * Templates CRUD
   */
  async listTemplates() {
    return prisma.permissionTemplate.findMany({
      include: {
        permissions: {
          select: { permissionId: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getTemplate(id: string) {
    const template = await prisma.permissionTemplate.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(data: any) {
    const existing = await prisma.permissionTemplate.findUnique({ where: { name: data.name } });
    if (existing) throw new BadRequestException('Template name already exists');

    const template = await prisma.permissionTemplate.create({
      data: {
        name: data.name,
        description: data.description
      }
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await prisma.permissionTemplateMapping.createMany({
        data: data.permissionIds.map((pId: string) => ({
          templateId: template.id,
          permissionId: pId
        }))
      });
    }

    return this.getTemplate(template.id);
  }

  async updateTemplate(id: string, data: any) {
    const template = await prisma.permissionTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    if (data.name && data.name !== template.name) {
      const existing = await prisma.permissionTemplate.findUnique({ where: { name: data.name } });
      if (existing) throw new BadRequestException('Template name already exists');
    }

    await prisma.permissionTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });

    if (data.permissionIds) {
      await prisma.permissionTemplateMapping.deleteMany({ where: { templateId: id } });
      if (data.permissionIds.length > 0) {
        await prisma.permissionTemplateMapping.createMany({
          data: data.permissionIds.map((pId: string) => ({
            templateId: id,
            permissionId: pId
          }))
        });
      }
    }

    return this.getTemplate(id);
  }

  async deleteTemplate(id: string) {
    const template = await prisma.permissionTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');

    await prisma.permissionTemplate.delete({ where: { id } });
    return { success: true };
  }

  async applyTemplate(templateId: string, roleId: string) {
    const [template, role] = await Promise.all([
      prisma.permissionTemplate.findUnique({
        where: { id: templateId },
        include: { permissions: true }
      }),
      prisma.role.findUnique({ where: { id: roleId } })
    ]);

    if (!template) throw new NotFoundException('Template not found');
    if (!role) throw new NotFoundException('Role not found');

    if (role.name === 'Super Admin') {
      throw new BadRequestException('Super Admin permissions are system locked');
    }

    const permissionIds = template.permissions.map((p) => p.permissionId);

    // Sync role permissions
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId,
          permissionId: pId
        }))
      });
    }

    return { success: true };
  }

  // Global permission versioning timestamp for real-time invalidation & matrix sync
  private static globalPermissionVersion = Date.now();

  static getPermissionVersion() {
    return this.globalPermissionVersion;
  }

  static bumpPermissionVersion() {
    this.globalPermissionVersion = Date.now();
    return this.globalPermissionVersion;
  }

  /**
   * Get current matrix permission version timestamp
   */
  async getMatrixVersion() {
    return { version: RolesService.getPermissionVersion() };
  }

  /**
   * Simulate target role view for Super Admin
   */
  async simulateRole(targetRoleName: string, requestingUser: any) {
    if (requestingUser.role !== 'Super Admin' && requestingUser.role !== 'College Admin') {
      throw new BadRequestException('Only Super Admin or College Admin can simulate role views');
    }

    const targetRole = await prisma.role.findUnique({
      where: { name: targetRoleName },
      include: { permissions: { include: { permission: true } } }
    });

    if (!targetRole) throw new NotFoundException(`Role '${targetRoleName}' not found`);

    const permissions = targetRole.name === 'Super Admin' 
      ? ['*:*']
      : targetRole.permissions.map(p => p.permission.name);

    return {
      simulationMode: true,
      originalRole: requestingUser.role,
      simulatedRole: targetRole.name,
      permissions,
      simulatedUser: {
        id: requestingUser.id,
        email: requestingUser.email,
        role: targetRole.name,
        permissions
      }
    };
  }

  /**
   * Bulk role assignment & department transfer
   */
  async bulkOperation(data: { userIds: string[]; targetRoleId?: string; departmentId?: string }) {
    const { userIds, targetRoleId, departmentId } = data;
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('userIds list cannot be empty');
    }

    const updateData: any = {};
    if (targetRoleId) updateData.roleId = targetRoleId;
    if (departmentId) updateData.departmentId = departmentId;

    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: updateData
    });

    RolesService.bumpPermissionVersion();
    return { success: true, count: userIds.length };
  }
}
