"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class RolesService {
    /**
     * List all roles with user counts and permissions
     */
    async listRoles(params) {
        const where = {};
        if (params.status) {
            where.status = params.status;
        }
        if (params.search) {
            where.name = { contains: params.search };
        }
        if (params.isSystem !== undefined) {
            where.isSystem = params.isSystem === 'true';
        }
        const roles = await prisma_1.prisma.role.findMany({
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
    async getRole(id) {
        const role = await prisma_1.prisma.role.findUnique({
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
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        return role;
    }
    /**
     * Create a custom role
     */
    async createRole(data, createdBy) {
        const existing = await prisma_1.prisma.role.findUnique({ where: { name: data.name } });
        if (existing)
            throw new exceptions_1.BadRequestException('Role name already exists');
        const role = await prisma_1.prisma.role.create({
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
    async updateRole(id, data, updatedBy) {
        const role = await prisma_1.prisma.role.findUnique({ where: { id } });
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        if (role.isSystem) {
            // Prevent changing name of system roles
            if (data.name && data.name !== role.name) {
                throw new exceptions_1.BadRequestException('System protected roles cannot be renamed');
            }
            // System roles status cannot be made inactive/archived
            if (data.status && data.status !== 'ACTIVE') {
                throw new exceptions_1.BadRequestException('System protected roles cannot be archived or inactivated');
            }
        }
        if (data.name && data.name !== role.name) {
            const existing = await prisma_1.prisma.role.findUnique({ where: { name: data.name } });
            if (existing)
                throw new exceptions_1.BadRequestException('Role name already exists');
        }
        const updated = await prisma_1.prisma.role.update({
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
    async deleteRole(id, deletedBy) {
        const role = await prisma_1.prisma.role.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        if (role.isSystem) {
            throw new exceptions_1.BadRequestException(`System role '${role.name}' is protected and cannot be deleted`);
        }
        if (role._count.users > 0) {
            throw new exceptions_1.BadRequestException(`Cannot delete role '${role.name}' because it has ${role._count.users} assigned users. Please transfer the users first.`);
        }
        await prisma_1.prisma.role.delete({ where: { id } });
        return { success: true };
    }
    /**
     * Clone permissions and details of a role
     */
    async cloneRole(id, data, createdBy) {
        const sourceRole = await prisma_1.prisma.role.findUnique({
            where: { id },
            include: { permissions: true }
        });
        if (!sourceRole)
            throw new exceptions_1.NotFoundException('Source role not found');
        const existing = await prisma_1.prisma.role.findUnique({ where: { name: data.name } });
        if (existing)
            throw new exceptions_1.BadRequestException('Role name already exists');
        const cloned = await prisma_1.prisma.role.create({
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
            await prisma_1.prisma.rolePermission.createMany({
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
        return prisma_1.prisma.permission.findMany({
            orderBy: { name: 'asc' }
        });
    }
    /**
     * Sync permission list for a role
     */
    async syncPermissions(roleId, permissionIds) {
        const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        if (role.name === 'Super Admin') {
            throw new exceptions_1.BadRequestException('Super Admin permissions are system locked');
        }
        // Validate permission IDs
        const validPermissionsCount = await prisma_1.prisma.permission.count({
            where: { id: { in: permissionIds } }
        });
        if (validPermissionsCount !== permissionIds.length) {
            throw new exceptions_1.BadRequestException('One or more permission IDs are invalid');
        }
        // Sync
        await prisma_1.prisma.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length > 0) {
            await prisma_1.prisma.rolePermission.createMany({
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
    async getRoleUsers(roleId, params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const where = { roleId };
        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search } },
                { lastName: { contains: params.search } },
                { email: { contains: params.search } }
            ];
        }
        const [users, totalCount] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            prisma_1.prisma.user.count({ where })
        ]);
        return { users, totalCount, page, pageSize };
    }
    /**
     * Bulk assign users to a role
     */
    async bulkAssignUsers(roleId, userIds) {
        const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        // Update users
        await prisma_1.prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: { roleId }
        });
        return { success: true };
    }
    /**
     * Unassign user (transfers them to Student baseline role)
     */
    async unassignUser(roleId, userId) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user)
            throw new exceptions_1.NotFoundException('User not found');
        if (user.roleId !== roleId) {
            throw new exceptions_1.BadRequestException('User is not assigned to this role');
        }
        // If user is Super Admin, check if they are the last active Super Admin
        if (user.role.name === 'Super Admin') {
            const superAdminCount = await prisma_1.prisma.user.count({
                where: { role: { name: 'Super Admin' }, status: 'ACTIVE' }
            });
            if (superAdminCount <= 1) {
                throw new exceptions_1.BadRequestException('Cannot remove the last active Super Admin');
            }
        }
        // Find fallback Student role
        const studentRole = await prisma_1.prisma.role.findUnique({ where: { name: 'Student' } });
        if (!studentRole)
            throw new exceptions_1.NotFoundException('Baseline student role not found');
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { roleId: studentRole.id }
        });
        return { success: true };
    }
    /**
     * Templates CRUD
     */
    async listTemplates() {
        return prisma_1.prisma.permissionTemplate.findMany({
            include: {
                permissions: {
                    select: { permissionId: true }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async getTemplate(id) {
        const template = await prisma_1.prisma.permissionTemplate.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        if (!template)
            throw new exceptions_1.NotFoundException('Template not found');
        return template;
    }
    async createTemplate(data) {
        const existing = await prisma_1.prisma.permissionTemplate.findUnique({ where: { name: data.name } });
        if (existing)
            throw new exceptions_1.BadRequestException('Template name already exists');
        const template = await prisma_1.prisma.permissionTemplate.create({
            data: {
                name: data.name,
                description: data.description
            }
        });
        if (data.permissionIds && data.permissionIds.length > 0) {
            await prisma_1.prisma.permissionTemplateMapping.createMany({
                data: data.permissionIds.map((pId) => ({
                    templateId: template.id,
                    permissionId: pId
                }))
            });
        }
        return this.getTemplate(template.id);
    }
    async updateTemplate(id, data) {
        const template = await prisma_1.prisma.permissionTemplate.findUnique({ where: { id } });
        if (!template)
            throw new exceptions_1.NotFoundException('Template not found');
        if (data.name && data.name !== template.name) {
            const existing = await prisma_1.prisma.permissionTemplate.findUnique({ where: { name: data.name } });
            if (existing)
                throw new exceptions_1.BadRequestException('Template name already exists');
        }
        await prisma_1.prisma.permissionTemplate.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description
            }
        });
        if (data.permissionIds) {
            await prisma_1.prisma.permissionTemplateMapping.deleteMany({ where: { templateId: id } });
            if (data.permissionIds.length > 0) {
                await prisma_1.prisma.permissionTemplateMapping.createMany({
                    data: data.permissionIds.map((pId) => ({
                        templateId: id,
                        permissionId: pId
                    }))
                });
            }
        }
        return this.getTemplate(id);
    }
    async deleteTemplate(id) {
        const template = await prisma_1.prisma.permissionTemplate.findUnique({ where: { id } });
        if (!template)
            throw new exceptions_1.NotFoundException('Template not found');
        await prisma_1.prisma.permissionTemplate.delete({ where: { id } });
        return { success: true };
    }
    async applyTemplate(templateId, roleId) {
        const [template, role] = await Promise.all([
            prisma_1.prisma.permissionTemplate.findUnique({
                where: { id: templateId },
                include: { permissions: true }
            }),
            prisma_1.prisma.role.findUnique({ where: { id: roleId } })
        ]);
        if (!template)
            throw new exceptions_1.NotFoundException('Template not found');
        if (!role)
            throw new exceptions_1.NotFoundException('Role not found');
        if (role.name === 'Super Admin') {
            throw new exceptions_1.BadRequestException('Super Admin permissions are system locked');
        }
        const permissionIds = template.permissions.map((p) => p.permissionId);
        // Sync role permissions
        await prisma_1.prisma.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length > 0) {
            await prisma_1.prisma.rolePermission.createMany({
                data: permissionIds.map((pId) => ({
                    roleId,
                    permissionId: pId
                }))
            });
        }
        return { success: true };
    }
    // Global permission versioning timestamp for real-time invalidation & matrix sync
    static globalPermissionVersion = Date.now();
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
    async simulateRole(targetRoleName, requestingUser) {
        if (requestingUser.role !== 'Super Admin' && requestingUser.role !== 'College Admin') {
            throw new exceptions_1.BadRequestException('Only Super Admin or College Admin can simulate role views');
        }
        const targetRole = await prisma_1.prisma.role.findUnique({
            where: { name: targetRoleName },
            include: { permissions: { include: { permission: true } } }
        });
        if (!targetRole)
            throw new exceptions_1.NotFoundException(`Role '${targetRoleName}' not found`);
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
    async bulkOperation(data) {
        const { userIds, targetRoleId, departmentId } = data;
        if (!userIds || userIds.length === 0) {
            throw new exceptions_1.BadRequestException('userIds list cannot be empty');
        }
        const updateData = {};
        if (targetRoleId)
            updateData.roleId = targetRoleId;
        if (departmentId)
            updateData.departmentId = departmentId;
        await prisma_1.prisma.user.updateMany({
            where: { id: { in: userIds } },
            data: updateData
        });
        RolesService.bumpPermissionVersion();
        return { success: true, count: userIds.length };
    }
}
exports.RolesService = RolesService;
//# sourceMappingURL=roles.service.js.map