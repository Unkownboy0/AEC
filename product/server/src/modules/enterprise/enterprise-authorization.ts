import { ForbiddenException } from '../../utils/exceptions';

const normalizeRole = (role: string) => String(role || '').trim().toUpperCase().replace(/[\s_-]+/g, '');

const ENTERPRISE_BULK_ROLES = new Set([
  'SUPERADMIN',
  'COLLEGEADMIN',
]);

const COMPLAINT_ARCHIVE_ROLES = new Set([
  'SUPERADMIN',
  'COLLEGEADMIN',
  'PRINCIPAL',
  'VICEPRINCIPAL',
  'VP',
  'ACADEMICDEAN',
  'ADMISSIONDEAN',
  'IQACDEAN',
  'GRIEVANCE',
  'GRIEVANCEOFFICER',
]);

export const canRunEnterpriseBulkAction = (role: string) =>
  ENTERPRISE_BULK_ROLES.has(normalizeRole(role));

export const canArchiveComplaint = (role: string) =>
  COMPLAINT_ARCHIVE_ROLES.has(normalizeRole(role));

export const assertEnterpriseBulkAccess = (role: string) => {
  if (!canRunEnterpriseBulkAction(role)) {
    throw new ForbiddenException('Your active workspace cannot perform enterprise bulk operations.');
  }
};

export const assertComplaintArchiveAccess = (role: string) => {
  if (!canArchiveComplaint(role)) {
    throw new ForbiddenException('Your active workspace cannot archive complaints.');
  }
};
