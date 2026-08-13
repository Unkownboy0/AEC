/*
  CAMPUSOS NAVIGATION — Barrel Export
*/

export { ROUTE_REGISTRY, NAV_GROUP_CONFIGS } from './route-registry';
export {
  getEntriesForRole,
  getSidebarGroupsForRole,
  getMobileTabsForRole,
  getMorePageSectionsForRole,
  getEntryById,
  getEntryByPath,
  isPathActive,
} from './navigation.utils';
export { getMobileTabEntriesForRole, getMobileMoreEntriesForRole, ROLE_BOTTOM_NAV_CONFIGS } from './mobile-navigation';
export { getNavEntriesForRole, getGroupedNavForRole, getNavEntryById, getNavEntryByPath } from './role-navigation';
export { resolveRoutePath, getRoleDefaultDashboard } from './route-resolver';
export { ProtectedRoute } from './route-guards';
export type { SidebarGroup, MoreSection } from './navigation.utils';
export type { NavEntry, NavGroup, NavGroupConfig, MobilePlacement, DesktopPlacement, RoleBottomNavConfig } from './navigation.types';
