/*
  CAMPUSOS MOBILE NAVIGATION — Rule 20 Enforcement
  
  Max 5 bottom navigation tabs per role with clear icons + visible labels.
*/

import type { NavEntry, RoleBottomNavConfig } from './navigation.types';
import { getNavEntriesForRole, getNavEntryById } from './role-navigation';

export const ROLE_BOTTOM_NAV_CONFIGS: RoleBottomNavConfig[] = [
  {
    role: 'STUDENT',
    tabs: ['student-dashboard', 'student-leave-od', 'student-timetable', 'student-notifications'],
  },
  {
    role: 'FACULTY',
    tabs: ['faculty-dashboard', 'faculty-timetable', 'faculty-tasks', 'faculty-notifications'],
  },
  {
    role: 'FACULTY_MEMBER',
    tabs: ['faculty-dashboard', 'faculty-timetable', 'faculty-tasks', 'faculty-notifications'],
  },
  {
    role: 'MENTOR',
    tabs: ['mentor-dashboard', 'mentor-students', 'mentor-attendance', 'mentor-leave-od'],
  },
  {
    role: 'CLASS_ADVISER',
    tabs: ['class-adviser-dashboard', 'class-adviser-students', 'class-adviser-attendance', 'class-adviser-approvals'],
  },
  {
    role: 'CLASS_ADVISOR',
    tabs: ['class-adviser-dashboard', 'class-adviser-students', 'class-adviser-attendance', 'class-adviser-approvals'],
  },
  {
    role: 'HOD',
    tabs: ['hod-dashboard', 'hod-department-overview', 'hod-approvals', 'hod-notifications'],
  },
  {
    role: 'HEAD_OF_DEPARTMENT',
    tabs: ['hod-dashboard', 'hod-department-overview', 'hod-approvals', 'hod-notifications'],
  },
  {
    role: 'PRINCIPAL',
    tabs: ['principal-dashboard', 'principal-approvals', 'principal-departments', 'principal-notifications'],
  },
  {
    role: 'VICE_PRINCIPAL',
    tabs: ['vp-dashboard', 'vp-leave-approvals', 'vp-departments', 'vp-notifications'],
  },
  {
    role: 'VP',
    tabs: ['vp-dashboard', 'vp-leave-approvals', 'vp-departments', 'vp-notifications'],
  },
  {
    role: 'ACADEMIC_DEAN',
    tabs: ['academic-dean-dashboard', 'academic-dean-availability', 'academic-dean-academics', 'academic-dean-approvals'],
  },
  {
    role: 'ADMISSION_DEAN',
    tabs: ['admission-dean-dashboard', 'admission-dean-admissions', 'admission-dean-services', 'admission-dean-approvals'],
  },
  {
    role: 'ADMISSION_AND_ADMINISTRATION_DEAN',
    tabs: ['admission-dean-dashboard', 'admission-dean-admissions', 'admission-dean-services', 'admission-dean-approvals'],
  },
  {
    role: 'ADMINISTRATION_DEAN',
    tabs: ['admission-dean-dashboard', 'admission-dean-admissions', 'admission-dean-services', 'admission-dean-approvals'],
  },
  {
    role: 'A_AND_A_DEAN',
    tabs: ['admission-dean-dashboard', 'admission-dean-admissions', 'admission-dean-services', 'admission-dean-approvals'],
  },
  {
    role: 'IQAC',
    tabs: ['iqac-dashboard', 'iqac-evidence', 'iqac-accreditation', 'iqac-tasks'],
  },
  {
    role: 'IQAC_DEAN',
    tabs: ['iqac-dashboard', 'iqac-evidence', 'iqac-accreditation', 'iqac-tasks'],
  },
  {
    role: 'COE',
    tabs: ['coe-dashboard', 'coe-exams', 'coe-schedules', 'coe-marks'],
  },
  {
    role: 'EXAMINATION_CELL',
    tabs: ['coe-dashboard', 'coe-exams', 'coe-schedules', 'coe-marks'],
  },
  {
    role: 'CONTROLLER_OF_EXAMINATIONS',
    tabs: ['coe-dashboard', 'coe-exams', 'coe-schedules', 'coe-marks'],
  },
  {
    role: 'PARENT',
    tabs: ['parent-dashboard', 'parent-attendance', 'parent-marks', 'parent-fees'],
  },
  {
    role: 'ACCOUNTANT',
    tabs: ['accountant-dashboard', 'accountant-fee-collection', 'accountant-transactions', 'accountant-daily-collection'],
  },
  {
    role: 'ACCOUNTS_STAFF',
    tabs: ['accountant-dashboard', 'accountant-fee-collection', 'accountant-transactions', 'accountant-daily-collection'],
  },
  {
    role: 'AO',
    tabs: ['ao-dashboard', 'ao-collection-overview', 'ao-closing-approvals', 'ao-reconciliation'],
  },
  {
    role: 'ACCOUNTS_OFFICER',
    tabs: ['ao-dashboard', 'ao-collection-overview', 'ao-closing-approvals', 'ao-reconciliation'],
  },
  {
    role: 'SUPER_ADMIN',
    tabs: ['super-admin-dashboard', 'super-admin-users', 'super-admin-workflows', 'super-admin-iam'],
  },
  {
    role: 'COLLEGE_ADMIN',
    tabs: ['super-admin-dashboard', 'super-admin-users', 'super-admin-workflows', 'super-admin-iam'],
  },
  {
    role: 'ADMIN',
    tabs: ['super-admin-dashboard', 'super-admin-users', 'super-admin-workflows', 'super-admin-iam'],
  },
];

export function getMobileTabEntriesForRole(role: string): NavEntry[] {
  if (!role) return [];
  const normalizedRole = role.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const config = ROLE_BOTTOM_NAV_CONFIGS.find(
    (c) => c.role === normalizedRole || c.role === role.toUpperCase()
  );

  if (config) {
    const tabs = config.tabs
      .map((id) => getNavEntryById(id))
      .filter((e): e is NavEntry => Boolean(e));
    if (tabs.length > 0) return tabs;
  }

  // Fallback: Pick top 4 'tab' mobilePlacement entries for this role
  const allRoleEntries = getNavEntriesForRole(role);
  return allRoleEntries
    .filter((e) => e.mobilePlacement === 'tab')
    .slice(0, 4);
}

export function getMobileMoreEntriesForRole(role: string): { groupName: string; entries: NavEntry[] }[] {
  const allEntries = getNavEntriesForRole(role);
  const moreEntries = allEntries.filter((e) => e.mobilePlacement === 'more' || e.mobilePlacement === 'tab');

  const groupsMap = new Map<string, NavEntry[]>();

  moreEntries.forEach((entry) => {
    const groupKey = entry.group || 'general';
    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, []);
    }
    groupsMap.get(groupKey)!.push(entry);
  });

  const groupLabels: Record<string, string> = {
    overview: 'OVERVIEW',
    teaching: 'TEACHING & CLASSES',
    academics: 'ACADEMICS & EXAMS',
    management: 'DEPARTMENT MANAGEMENT',
    monitoring: 'INSTITUTION MONITORING',
    responsibilities: 'RESPONSIBILITIES & MENTORING',
    requests: 'REQUESTS & FINANCE',
    communication: 'COMMUNICATION & NOTICES',
    insights: 'REPORTS & ANALYTICS',
    career: 'CAREER & PLACEMENTS',
    account: 'MY ACCOUNT',
    system: 'SYSTEM & SETTINGS',
  };

  const result: { groupName: string; entries: NavEntry[] }[] = [];

  groupsMap.forEach((entries, groupKey) => {
    result.push({
      groupName: groupLabels[groupKey] || groupKey.toUpperCase(),
      entries: entries.sort((a, b) => a.order - b.order),
    });
  });

  return result;
}
