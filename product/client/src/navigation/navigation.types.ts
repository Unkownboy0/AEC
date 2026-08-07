/*
  CAMPUSOS NAVIGATION TYPES
  Single source of truth for all navigation configuration.
*/

export type MobilePlacement = 'tab' | 'more' | 'hidden';
export type DesktopPlacement = 'sidebar' | 'header' | 'user_menu' | 'hidden';

export type NavGroup =
  | 'overview'
  | 'monitoring'
  | 'teaching'
  | 'academics'
  | 'communication'
  | 'management'
  | 'requests'
  | 'responsibilities'
  | 'insights'
  | 'career'
  | 'account'
  | 'system';

export interface NavEntry {
  /** Unique stable ID — used for permissions, breadcrumbs, deep links */
  id: string;
  /** Human-readable label — FULL, no ellipsis */
  label: string;
  /** Optional concise label for bottom navigation tabs */
  shortLabel?: string;
  /** One-line description for More page rows and tooltips */
  description: string;
  /** Lucide icon name from icon-map.ts */
  icon: string;
  /** Exact route path */
  path: string;
  /** Role IDs that can see this entry */
  roles: string[];
  /** Permission key checked via RBACContext */
  permission?: string;
  /** Sidebar group this belongs to */
  group: NavGroup;
  /** Desktop placement type */
  desktopPlacement?: DesktopPlacement;
  /** Where it appears on mobile */
  mobilePlacement: MobilePlacement;
  /** Sort order within group */
  order: number;
  /** Optional badge count source (key into a badge store) */
  badgeKey?: string;
  /** Optional deep link URI pattern */
  deepLinkPattern?: string;
  /** Workspace context ID */
  workspace?: string;
}

export interface NavGroupConfig {
  id: NavGroup;
  label: string;
}

export interface RoleBottomNavConfig {
  role: string;
  tabs: string[]; // NavEntry IDs for max 5 tabs
}
