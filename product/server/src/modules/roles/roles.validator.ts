import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters long').max(50),
  description: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  icon: z.string().min(1).optional(),
  priority: z.number().int().nonnegative().optional(),
  hierarchy: z.number().int().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'INACTIVE']).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  icon: z.string().min(1).optional(),
  priority: z.number().int().nonnegative().optional(),
  hierarchy: z.number().int().nonnegative().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'INACTIVE']).optional(),
});

export const syncPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const bulkAssignUsersSchema = z.object({
  userIds: z.array(z.string().uuid()),
});

export const createTemplateSchema = z.object({
  name: z.string().min(2, 'Template name must be at least 2 characters').max(100),
  description: z.string().max(200).optional().nullable(),
  permissionIds: z.array(z.string().uuid()),
});
