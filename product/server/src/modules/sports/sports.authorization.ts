const normalizeRole = (role: string) => String(role || '').trim().toUpperCase().replace(/[\s_-]+/g, '');

const SPORTS_ADMIN_ROLES = new Set([
  'SUPERADMIN',
  'COLLEGEADMIN',
  'PRINCIPAL',
  'SPORTS',
  'SPORTSCOORDINATOR',
  'PHYSICALEDUCATIONDIRECTOR',
]);

export const canManageSports = (role: string) => SPORTS_ADMIN_ROLES.has(normalizeRole(role));
