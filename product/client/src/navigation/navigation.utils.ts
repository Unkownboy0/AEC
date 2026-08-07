import { ROUTE_REGISTRY, NAV_GROUP_CONFIGS } from './route-registry';
import type { NavEntry, NavGroup, NavGroupConfig } from './navigation.types';

/*
  CAMPUSOS NAVIGATION UTILS
  
  Functions that filter the ROUTE_REGISTRY for a specific user role
  and return structured sidebar groups or mobile nav configs.
*/

/** Normalize role string to uppercase for registry matching */
function normalizeRole(role?: string): string {
  return (role || '').toUpperCase().trim();
}

/**
 * Get all NavEntries visible to a given role
 */
export function getEntriesForRole(role?: string): NavEntry[] {
  const r = normalizeRole(role);
  return ROUTE_REGISTRY.filter((entry) =>
    entry.roles.some((er) => er.toUpperCase() === r)
  ).sort((a, b) => a.order - b.order);
}

/**
 * Get sidebar group structure for a role
 * Returns groups that have at least one entry, in canonical order
 */
export interface SidebarGroup {
  group: NavGroup;
  label: string;
  items: NavEntry[];
}

const GROUP_ORDER: NavGroup[] = [
  'overview',
  'monitoring',
  'teaching',
  'academics',
  'communication',
  'management',
  'requests',
  'responsibilities',
  'insights',
  'career',
  'account',
  'system',
];

export function getSidebarGroupsForRole(role?: string): SidebarGroup[] {
  const entries = getEntriesForRole(role);
  const grouped: Map<NavGroup, NavEntry[]> = new Map();

  for (const entry of entries) {
    const g = entry.group;
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(entry);
  }

  const groupLabelMap: Record<NavGroup, string> = Object.fromEntries(
    NAV_GROUP_CONFIGS.map((g) => [g.id, g.label])
  ) as Record<NavGroup, string>;

  return GROUP_ORDER
    .filter((g) => grouped.has(g))
    .map((g) => ({
      group: g,
      label: groupLabelMap[g] ?? g,
      items: (grouped.get(g) ?? []).sort((a, b) => a.order - b.order),
    }));
}

/**
 * Get the 5 bottom-nav tabs for a role
 * Returns entries where mobilePlacement === 'tab', capped at 5
 */
export function getMobileTabsForRole(role?: string): NavEntry[] {
  return getEntriesForRole(role)
    .filter((e) => e.mobilePlacement === 'tab')
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
}

/**
 * Get More page entries grouped by section
 */
export interface MoreSection {
  group: NavGroup;
  label: string;
  items: NavEntry[];
}

export function getMorePageSectionsForRole(role?: string): MoreSection[] {
  const entries = getEntriesForRole(role).filter(
    (e) => e.mobilePlacement === 'more'
  );

  const grouped: Map<NavGroup, NavEntry[]> = new Map();
  for (const entry of entries) {
    if (!grouped.has(entry.group)) grouped.set(entry.group, []);
    grouped.get(entry.group)!.push(entry);
  }

  const groupLabelMap: Record<NavGroup, string> = Object.fromEntries(
    NAV_GROUP_CONFIGS.map((g) => [g.id, g.label])
  ) as Record<NavGroup, string>;

  return GROUP_ORDER
    .filter((g) => grouped.has(g))
    .map((g) => ({
      group: g,
      label: groupLabelMap[g] ?? g,
      items: (grouped.get(g) ?? []).sort((a, b) => a.order - b.order),
    }));
}

/**
 * Get a single entry by ID
 */
export function getEntryById(id: string): NavEntry | undefined {
  return ROUTE_REGISTRY.find((e) => e.id === id);
}

/**
 * Get a single entry by exact path
 */
export function getEntryByPath(path: string): NavEntry | undefined {
  return ROUTE_REGISTRY.find((e) => e.path === path);
}

/**
 * Check if a path is active (supports exact + prefix matching)
 */
export function isPathActive(currentPath: string, entryPath: string): boolean {
  if (entryPath === '/') return currentPath === '/';
  return currentPath === entryPath || currentPath.startsWith(entryPath + '/');
}
