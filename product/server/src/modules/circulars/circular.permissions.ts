/**
 * Circular Permission Guards
 * Defines which roles can publish circulars and at which scope.
 */

export type CircularScope = 'DEPARTMENT' | 'INSTITUTION';

export const CIRCULAR_PUBLISHER_ROLES: Record<string, CircularScope[]> = {
  HOD: ['DEPARTMENT'],
  'Head of Department': ['DEPARTMENT'],
  Principal: ['INSTITUTION'],
  'Vice Principal': ['INSTITUTION'],
  VP: ['INSTITUTION'],
  'Academic Dean': ['INSTITUTION'],
  'Admission Dean': ['INSTITUTION'],
  'IQAC Dean': ['INSTITUTION'],
  'Controller of Examinations': ['INSTITUTION'],
  'Super Admin': ['DEPARTMENT', 'INSTITUTION'],
};

export const INSTITUTION_LEVEL_ROLES = [
  'Principal',
  'Vice Principal',
  'VP',
  'Academic Dean',
  'Admission Dean',
  'IQAC Dean',
  'Controller of Examinations',
  'Super Admin',
];

export const DEPARTMENT_LEVEL_ROLES = [
  'HOD',
  'Head of Department',
];

/**
 * Returns the allowed scope(s) for a given role name.
 */
export function getAllowedScopes(roleName: string): CircularScope[] {
  return CIRCULAR_PUBLISHER_ROLES[roleName] ?? [];
}

/**
 * Returns true if the role can publish department-scoped circulars.
 */
export function canPublishDepartmentCircular(roleName: string): boolean {
  if (!roleName) return false;
  if (isHodRole(roleName)) return true;
  return getAllowedScopes(roleName).includes('DEPARTMENT');
}

/**
 * Returns true if the role can publish institution-wide circulars.
 */
export function canPublishInstitutionCircular(roleName: string): boolean {
  return getAllowedScopes(roleName).includes('INSTITUTION');
}

/**
 * Returns true if the role is an HOD (department head).
 */
export function isHodRole(roleName: string): boolean {
  return DEPARTMENT_LEVEL_ROLES.includes(roleName) ||
    roleName.toLowerCase().includes('hod');
}

/**
 * Returns the human-readable published-as label for a role.
 * VP acting as Principal gets a special label.
 */
export function getPublishedAsLabel(
  roleName: string,
  isActingPrincipal = false
): string {
  if ((roleName === 'Vice Principal' || roleName === 'VP') && isActingPrincipal) {
    return 'Vice Principal — Acting Principal';
  }
  const labels: Record<string, string> = {
    HOD: 'Head of Department',
    'Head of Department': 'Head of Department',
    Principal: 'Principal',
    'Vice Principal': 'Vice Principal',
    VP: 'Vice Principal',
    'Academic Dean': 'Academic Dean',
    'Admission Dean': 'Admission Dean',
    'IQAC Dean': 'IQAC Dean',
    'Controller of Examinations': 'Controller of Examinations',
    'Super Admin': 'Administrator',
  };
  return labels[roleName] ?? roleName;
}
