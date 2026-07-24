"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesController = void 0;
const roles_service_1 = require("./roles.service");
const roles_validator_1 = require("./roles.validator");
const exceptions_1 = require("../../utils/exceptions");
const prisma_1 = require("../../lib/prisma");
class RolesController {
    service = new roles_service_1.RolesService();
    /**
     * List roles
     */
    list = async (req, res, next) => {
        try {
            const roles = await this.service.listRoles(req.query);
            res.status(200).json({
                status: 'success',
                data: roles,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get single role details
     */
    getRole = async (req, res, next) => {
        try {
            const role = await this.service.getRole(req.params.id);
            res.status(200).json({
                status: 'success',
                data: role,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Create role
     */
    create = async (req, res, next) => {
        try {
            const validation = roles_validator_1.createRoleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const role = await this.service.createRole(validation.data, req.user.id);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update role
     */
    update = async (req, res, next) => {
        try {
            const validation = roles_validator_1.updateRoleSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const updated = await this.service.updateRole(req.params.id, validation.data, req.user.id);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete role
     */
    delete = async (req, res, next) => {
        try {
            const role = await prisma_1.prisma.role.findUnique({ where: { id: req.params.id } });
            if (!role)
                throw new exceptions_1.BadRequestException('Role not found');
            await this.service.deleteRole(req.params.id, req.user.id);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Clone permissions from one role to a new role
     */
    clone = async (req, res, next) => {
        try {
            const { name, description } = req.body;
            if (!name)
                throw new exceptions_1.BadRequestException('Cloned role name is required');
            const cloned = await this.service.cloneRole(req.params.id, { name, description }, req.user.id);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get Role Permission Matrix Grid
     */
    getMatrix = async (req, res, next) => {
        try {
            const [roles, permissions] = await Promise.all([
                prisma_1.prisma.role.findMany({
                    include: {
                        permissions: {
                            select: { permissionId: true },
                        },
                    },
                    orderBy: { hierarchy: 'asc' },
                }),
                prisma_1.prisma.permission.findMany({
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update permissions matrix for a role
     */
    updateMatrix = async (req, res, next) => {
        try {
            const { roleId, permissionIds } = req.body;
            if (!roleId || !Array.isArray(permissionIds)) {
                throw new exceptions_1.BadRequestException('roleId and permissionIds array are required');
            }
            await this.service.syncPermissions(roleId, permissionIds);
            // Audit Log
            const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get all permissions flat list
     */
    getPermissions = async (req, res, next) => {
        try {
            const permissions = await this.service.listPermissions();
            res.status(200).json({
                status: 'success',
                data: permissions,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Sync permission list for a role
     */
    updatePermissions = async (req, res, next) => {
        try {
            const validation = roles_validator_1.syncPermissionsSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            await this.service.syncPermissions(req.params.id, validation.data.permissionIds);
            // Audit Log
            const role = await prisma_1.prisma.role.findUnique({ where: { id: req.params.id } });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get users assigned to a role
     */
    getUsers = async (req, res, next) => {
        try {
            const result = await this.service.getRoleUsers(req.params.id, req.query);
            res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Add users to a role
     */
    addUsers = async (req, res, next) => {
        try {
            const validation = roles_validator_1.bulkAssignUsersSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            await this.service.bulkAssignUsers(req.params.id, validation.data.userIds);
            // Audit Log
            const role = await prisma_1.prisma.role.findUnique({ where: { id: req.params.id } });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Remove a user from a role
     */
    removeUser = async (req, res, next) => {
        try {
            const { id: roleId, userId } = req.params;
            await this.service.unassignUser(roleId, userId);
            // Audit Log
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Templates endpoints
     */
    listTemplates = async (req, res, next) => {
        try {
            const templates = await this.service.listTemplates();
            res.status(200).json({
                status: 'success',
                data: templates,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getTemplate = async (req, res, next) => {
        try {
            const template = await this.service.getTemplate(req.params.id);
            res.status(200).json({
                status: 'success',
                data: template,
            });
        }
        catch (error) {
            next(error);
        }
    };
    createTemplate = async (req, res, next) => {
        try {
            const validation = roles_validator_1.createTemplateSchema.safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const template = await this.service.createTemplate(validation.data);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    updateTemplate = async (req, res, next) => {
        try {
            const validation = roles_validator_1.createTemplateSchema.partial().safeParse(req.body);
            if (!validation.success) {
                throw new exceptions_1.BadRequestException(validation.error.errors[0].message);
            }
            const template = await this.service.updateTemplate(req.params.id, validation.data);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    deleteTemplate = async (req, res, next) => {
        try {
            const template = await prisma_1.prisma.permissionTemplate.findUnique({ where: { id: req.params.id } });
            if (!template)
                throw new exceptions_1.BadRequestException('Template not found');
            await this.service.deleteTemplate(req.params.id);
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    applyTemplate = async (req, res, next) => {
        try {
            const { roleId } = req.body;
            if (!roleId)
                throw new exceptions_1.BadRequestException('roleId is required');
            await this.service.applyTemplate(req.params.id, roleId);
            const template = await prisma_1.prisma.permissionTemplate.findUnique({ where: { id: req.params.id } });
            const role = await prisma_1.prisma.role.findUnique({ where: { id: roleId } });
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get matrix version timestamp for real-time permission invalidation
     */
    getMatrixVersion = async (req, res, next) => {
        try {
            const data = await this.service.getMatrixVersion();
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Simulate role preview
     */
    simulateRole = async (req, res, next) => {
        try {
            const { targetRoleName } = req.body;
            if (!targetRoleName)
                throw new exceptions_1.BadRequestException('targetRoleName is required');
            const data = await this.service.simulateRole(targetRoleName, req.user);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Bulk role & department operation
     */
    bulkOperation = async (req, res, next) => {
        try {
            const data = await this.service.bulkOperation(req.body);
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UPDATE',
                    module: 'ROLE',
                    description: `Performed bulk role/department assignment for ${data.count} users`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.RolesController = RolesController;
//# sourceMappingURL=roles.controller.js.map