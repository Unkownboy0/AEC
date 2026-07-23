"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTemplateSchema = exports.bulkAssignUsersSchema = exports.syncPermissionsSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Role name must be at least 2 characters long').max(50),
    description: zod_1.z.string().max(200).optional().nullable(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    icon: zod_1.z.string().min(1).optional(),
    priority: zod_1.z.number().int().nonnegative().optional(),
    hierarchy: zod_1.z.number().int().nonnegative().optional(),
    status: zod_1.z.enum(['ACTIVE', 'ARCHIVED', 'INACTIVE']).optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Role name must be at least 2 characters').max(50).optional(),
    description: zod_1.z.string().max(200).optional().nullable(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    icon: zod_1.z.string().min(1).optional(),
    priority: zod_1.z.number().int().nonnegative().optional(),
    hierarchy: zod_1.z.number().int().nonnegative().optional(),
    status: zod_1.z.enum(['ACTIVE', 'ARCHIVED', 'INACTIVE']).optional(),
});
exports.syncPermissionsSchema = zod_1.z.object({
    permissionIds: zod_1.z.array(zod_1.z.string().uuid()),
});
exports.bulkAssignUsersSchema = zod_1.z.object({
    userIds: zod_1.z.array(zod_1.z.string().uuid()),
});
exports.createTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Template name must be at least 2 characters').max(100),
    description: zod_1.z.string().max(200).optional().nullable(),
    permissionIds: zod_1.z.array(zod_1.z.string().uuid()),
});
//# sourceMappingURL=roles.validator.js.map