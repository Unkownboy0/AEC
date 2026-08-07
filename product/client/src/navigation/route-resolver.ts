/*
  CAMPUSOS ROUTE RESOLVER — Deep link and route path resolver
*/

import { getNavEntryByPath, getNavEntriesForRole } from './role-navigation';
import type { NavEntry } from './navigation.types';

export interface RouteResolveResult {
  status: 'valid' | 'unauthorized' | 'not_found' | 'removed';
  entry?: NavEntry;
  redirectPath?: string;
}

export function resolveRoutePath(pathname: string, userRole?: string): RouteResolveResult {
  if (!pathname || pathname === '/') {
    return {
      status: 'valid',
      redirectPath: userRole ? `/${userRole.toLowerCase()}/dashboard` : '/login',
    };
  }

  const entry = getNavEntryByPath(pathname);

  if (!entry) {
    return {
      status: 'not_found',
    };
  }

  if (userRole) {
    const roleMatch = entry.roles.some((r) => r.toLowerCase() === userRole.toLowerCase());
    if (!roleMatch) {
      return {
        status: 'unauthorized',
        entry,
      };
    }
  }

  return {
    status: 'valid',
    entry,
  };
}

export function getRoleDefaultDashboard(userRole: string): string {
  const entries = getNavEntriesForRole(userRole);
  const dashboard = entries.find((e) => e.id.includes('dashboard') || e.group === 'overview');
  return dashboard ? dashboard.path : `/${userRole.toLowerCase()}/dashboard`;
}
