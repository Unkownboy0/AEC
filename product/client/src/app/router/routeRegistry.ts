import { ROUTE_REGISTRY as NAVIGATION_REGISTRY } from '../../navigation/route-registry';
import { getEntriesForRole } from '../../navigation/navigation.utils';

export interface AppRouteDefinition {
  id: string;
  path: string;
  role?: string | string[];
  permission?: string;
  title: string;
  navigationGroup?: string;
  iconName?: string;
  mobileVisible?: boolean;
  deepLinkPattern?: string;
}

export const ROUTE_REGISTRY: Record<string, AppRouteDefinition> = Object.fromEntries(
  NAVIGATION_REGISTRY.map((entry) => [
    entry.id,
    {
      id: entry.id,
      path: entry.path,
      role: entry.roles,
      permission: entry.permission,
      title: entry.label,
      navigationGroup: entry.group,
      iconName: entry.icon,
      mobileVisible: entry.mobilePlacement === 'tab',
      deepLinkPattern: entry.deepLinkPattern,
    },
  ])
);

export const getRoutesForRole = (roleName: string): AppRouteDefinition[] =>
  getEntriesForRole(roleName).map((entry) => ROUTE_REGISTRY[entry.id]);
