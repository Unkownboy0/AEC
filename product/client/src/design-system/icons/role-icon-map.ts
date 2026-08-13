/*
  CAMPUSOS ROLE ICON MAP — Central role-to-icon registry
  
  Provides role visual mapping for all user roles:
  Super Admin, Principal, Vice Principal, Deans, HOD, Faculty,
  Mentor, Student, Parent, Accountant, Librarian, Transport, Security, etc.
*/

export const roleIconMap = {
  super_admin: 'Crown',
  SUPER_ADMIN: 'Crown',
  principal: 'Crown',
  PRINCIPAL: 'Crown',
  vice_principal: 'ShieldCheck',
  VICE_PRINCIPAL: 'ShieldCheck',
  VP: 'ShieldCheck',
  academic_dean: 'GraduationCap',
  ACADEMIC_DEAN: 'GraduationCap',
  admission_dean: 'UserPlus',
  ADMISSION_DEAN: 'UserPlus',
  iqac_dean: 'Award',
  IQAC_DEAN: 'Award',
  coe: 'BadgeCheck',
  COE: 'BadgeCheck',
  hod: 'Building2',
  HOD: 'Building2',
  HEAD_OF_DEPARTMENT: 'Building2',
  faculty: 'UserRound',
  FACULTY: 'UserRound',
  mentor: 'HeartHandshake',
  MENTOR: 'HeartHandshake',
  student: 'GraduationCap',
  STUDENT: 'GraduationCap',
  parent: 'Users',
  PARENT: 'Users',
  accountant: 'Calculator',
  ACCOUNTANT: 'Calculator',
  librarian: 'BookOpen',
  LIBRARIAN: 'BookOpen',
  transport_incharge: 'Bus',
  TRANSPORT: 'Bus',
  security: 'Shield',
  SECURITY: 'Shield',
  default: 'CircleUserRound',
} as const;

export type RoleIconKey = keyof typeof roleIconMap;

export function getRoleIconName(role: string): string {
  if (!role) return 'CircleUserRound';
  return (roleIconMap as Record<string, string>)[role] || (roleIconMap as Record<string, string>)[role.toUpperCase()] || 'CircleUserRound';
}
