import type { User } from '../auth/session-manager';

const normalizeRole = (value?: string) =>
  (value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');

const ROLE_HOME: Record<string, string> = {
  STUDENT: '/student/dashboard',
  FACULTY: '/faculty/dashboard',
  FACULTY_MEMBER: '/faculty/dashboard',
  MENTOR: '/faculty/mentor/dashboard',
  HOD: '/hod/dashboard',
  HEAD_OF_DEPARTMENT: '/hod/dashboard',
  PRINCIPAL: '/principal/dashboard',
  VICE_PRINCIPAL: '/vp/dashboard',
  VP: '/vp/dashboard',
  ACADEMIC_DEAN: '/academic-dean/dashboard',
  ADMISSION_DEAN: '/admission-dean/dashboard',
  ADMISSION_AND_ADMINISTRATION_DEAN: '/admission-dean/dashboard',
  ADMISSION_ADMINISTRATION_DEAN: '/admission-dean/dashboard',
  IQAC: '/iqac/dashboard',
  IQAC_DEAN: '/iqac/dashboard',
  IQAC_EXECUTIVE_OFFICER: '/iqac-executive',
  IQAC_DOCUMENTATION_OFFICER: '/iqac-documentation',
  PARENT: '/parent/dashboard',
  ACCOUNTANT: '/accountant/dashboard',
  ACCOUNTS_STAFF: '/accountant/dashboard',
  ACCOUNTS_OFFICER: '/ao/dashboard',
  AO: '/ao/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
  COLLEGE_ADMIN: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  ADMINISTRATOR: '/admin/dashboard',
  OFFICE: '/admin/dashboard',
  OFFICE_ADMINISTRATION: '/admin/dashboard',
  PLACEMENT: '/placement',
  PLACEMENT_OFFICER: '/placement',
  LIBRARY: '/library',
  LIBRARIAN: '/library',
  EXAMINATION_CELL: '/coe/dashboard',
  COE: '/coe/dashboard',
  CONTROLLER_OF_EXAMINATIONS: '/coe/dashboard',
  HOSTEL: '/hostel',
  HOSTEL_WARDEN: '/hostel',
  TRANSPORT: '/transport',
  TRANSPORT_MANAGER: '/transport',
  HR: '/admin/dashboard',
  MANAGEMENT: '/management/dashboard',
  GOVERNING_BODY: '/governing-body/dashboard',
  SECURITY: '/security',
};

export function getRoleHome(user?: Pick<User, 'role' | 'activeWorkspace' | 'menus'> | null): string {
  if (!user) return '/login';

  const activeRole = normalizeRole(user.activeWorkspace || user.role);
  const mappedHome = ROLE_HOME[activeRole];
  if (mappedHome) return mappedHome;

  const dashboardMenu = user.menus?.find((menu: any) =>
    menu?.path && (menu.componentKey === 'dashboard' || /\/dashboard\/?$/i.test(menu.path)),
  );
  if (dashboardMenu?.path) {
    return dashboardMenu.path === '/' ? '/admin/dashboard' : dashboardMenu.path;
  }

  // A valid authenticated account should land in the shared dashboard shell,
  // never be silently redirected to Profile because a new role alias was added.
  return '/admin/dashboard';
}
