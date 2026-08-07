/*
  CAMPUSOS MOBILE NAVIGATION — Rule 20 Enforcement
  
  Max 5 bottom navigation tabs per role with clear icons + visible labels.
*/

import type { NavEntry, RoleBottomNavConfig } from './navigation.types';
import { getNavEntriesForRole, getNavEntryById } from './role-navigation';

export const ROLE_BOTTOM_NAV_CONFIGS: RoleBottomNavConfig[] = [
  {
    role: 'STUDENT',
    tabs: ['student-dashboard', 'student-timetable', 'student-leave-od', 'student-messages'],
  },
  {
    role: 'FACULTY',
    tabs: ['faculty-dashboard', 'faculty-attendance', 'faculty-students', 'faculty-tasks'],
  },
  {
    role: 'HOD',
    tabs: ['hod-dashboard', 'hod-approvals', 'hod-availability', 'hod-tasks'],
  },
  {
    role: 'PRINCIPAL',
    tabs: ['principal-dashboard', 'principal-approvals', 'principal-search', 'principal-reports'],
  },
  {
    role: 'VICE_PRINCIPAL',
    tabs: ['vp-dashboard', 'vp-leave-approvals', 'vp-availability', 'vp-notifications'],
  },
  {
    role: 'PARENT',
    tabs: ['parent-dashboard', 'parent-attendance', 'parent-fees', 'parent-messages'],
  },
];

export function getMobileTabEntriesForRole(role: string): NavEntry[] {
  if (!role) return [];
  const normalizedRole = role.toUpperCase();
  const config = ROLE_BOTTOM_NAV_CONFIGS.find(
    (c) => c.role === normalizedRole || c.role === role
  );

  if (config) {
    const tabs = config.tabs
      .map((id) => getNavEntryById(id))
      .filter((e): e is NavEntry => Boolean(e));
    return tabs;
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
