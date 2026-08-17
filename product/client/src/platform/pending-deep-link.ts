/**
 * pending-deep-link.ts
 *
 * Holds the deep-link route from a push notification that was tapped while the
 * app was fully killed (cold launch). Because the React tree is not yet mounted
 * when Capacitor fires pushNotificationActionPerformed on cold launch, we cannot
 * call navigate() directly. Instead, we store the route here (module scope -
 * survives across re-renders but is cleared on next JS engine restart, unlike
 * localStorage which could surface a stale route hours later).
 *
 * Usage:
 *   setPendingDeepLink('/student/leave-od/abc123')  called by NotificationProvider on cold launch
 *   consumePendingDeepLink()                         called after login to navigate + clear
 */

let _pendingRoute: string | null = null;

/** Store a route to navigate to after login completes. */
export function setPendingDeepLink(route: string): void {
  _pendingRoute = route;
}

/**
 * Return and clear the pending deep-link route.
 * Returns null if no pending route exists.
 */
export function consumePendingDeepLink(): string | null {
  const route = _pendingRoute;
  _pendingRoute = null;
  return route;
}

/** Read the pending deep-link route without clearing it. */
export function peekPendingDeepLink(): string | null {
  return _pendingRoute;
}
