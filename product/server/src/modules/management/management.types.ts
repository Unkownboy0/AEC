import { UserPayload } from '../../core/middlewares/auth.middleware';

export type ManagementQuery = {
  periodDays: number;
  departmentId?: string;
};

export type ManagementViewer = UserPayload & {
  canDrillDown: boolean;
  canExport: boolean;
};

export const normalizeManagementRole = (role: string) => role.trim().toUpperCase().replace(/[\s-]+/g, '_');

export const managementRoles = ['MANAGEMENT', 'GOVERNING_BODY', 'SUPER_ADMIN', 'COLLEGE_ADMIN'];

export const resolveManagementViewer = (user: UserPayload): ManagementViewer => {
  const permissions = user.permissions || [];
  const wildcard = permissions.includes('*:*') || permissions.includes('*');
  const canRead = wildcard || permissions.some((permission) => ['reports:read', 'reports:view', 'reports:manage', 'reports:*'].includes(permission));
  const canExport = wildcard || permissions.some((permission) => ['reports:export', 'reports:manage', 'reports:*'].includes(permission));
  return { ...user, canDrillDown: canRead, canExport };
};
