/*
  CAMPUSOS ROLE NAVIGATION — Role-based navigation query helpers
*/

import { ROUTE_REGISTRY, NAV_GROUP_CONFIGS } from './route-registry';
import type { NavEntry, NavGroupConfig } from './navigation.types';

export function getNavEntriesForRole(role: string): NavEntry[] {
  if (!role) return [];
  const normalizedRole = role.toLowerCase();
  return ROUTE_REGISTRY.filter((entry) =>
    entry.roles.some((r) => r.toLowerCase() === normalizedRole)
  );
}

export function getGroupedNavForRole(role: string): { group: NavGroupConfig; entries: NavEntry[] }[] {
  const entries = getNavEntriesForRole(role);
  const groups: { group: NavGroupConfig; entries: NavEntry[] }[] = [];

  NAV_GROUP_CONFIGS.forEach((groupConfig) => {
    const groupEntries = entries
      .filter((e) => e.group === groupConfig.id)
      .sort((a, b) => a.order - b.order);

    if (groupEntries.length > 0) {
      groups.push({
        group: groupConfig,
        entries: groupEntries,
      });
    }
  });

  return groups;
}

export function getNavEntryById(id: string): NavEntry | undefined {
  return ROUTE_REGISTRY.find((entry) => entry.id === id);
}

export function getNavEntryByPath(path: string): NavEntry | undefined {
  return ROUTE_REGISTRY.find((entry) => entry.path === path || path.startsWith(entry.path));
}
