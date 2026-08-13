import { ROUTE_REGISTRY as NAVIGATION_REGISTRY } from '../navigation/route-registry';
import { getEntriesForRole } from '../navigation/navigation.utils';

export interface RouteDefinition {
  id: string;
  path: string;
  label: string;
  role: string;
  icon: string;
  inSidebar?: boolean;
  inBottomNav?: boolean;
  badgeKey?: string;
}

const toLegacyDefinition = (entry: typeof NAVIGATION_REGISTRY[number], role: string): RouteDefinition => ({
  id: entry.id,
  path: entry.path,
  label: entry.label,
  role,
  icon: entry.icon,
  inSidebar: entry.desktopPlacement !== 'hidden',
  inBottomNav: entry.mobilePlacement === 'tab',
  badgeKey: entry.badgeKey,
});

export const ROUTE_REGISTRY: RouteDefinition[] = NAVIGATION_REGISTRY.flatMap((entry) =>
  entry.roles.map((role) => toLegacyDefinition(entry, role))
);

export function getRoutesForRole(role: string): RouteDefinition[] {
  return getEntriesForRole(role).map((entry) => toLegacyDefinition(entry, role));
}
