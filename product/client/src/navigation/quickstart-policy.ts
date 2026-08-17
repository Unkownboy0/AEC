/**
 * CAMPUSOS QUICK START (FAB) VISIBILITY POLICY
 *
 * Centralized business logic defining when the floating Quick Action button (+)
 * is allowed to appear on screen.
 *
 * Collision Rules:
 * 1. KEYBOARD: The FAB is STRICTLY HIDDEN whenever the software keyboard is open.
 * 2. CHAT / MESSAGES: The FAB is STRICTLY HIDDEN on any messaging or chat route to prevent
 *    covering the composer bar or send buttons.
 * 3. FORMS / LEAVE-OD: The FAB is STRICTLY HIDDEN on Leave/OD, approval workflows, and data entry
 *    forms where primary save/submit actions occupy the lower screen.
 * 4. WORKSPACE EDITORS: The FAB is STRICTLY HIDDEN in full-screen document, sheet, slide, and form builders.
 */

export interface QuickStartPolicyContext {
  pathname: string;
  isKeyboardOpen: boolean;
  hasActions: boolean;
  isModalOpen?: boolean;
}

/**
 * Route prefixes where the floating action button should NOT appear
 * because the screen has its own primary action, message composer, or full editor.
 */
const BLOCKED_ROUTE_PATTERNS: RegExp[] = [
  // ── Messages & Chat Screens ──────────────────────────────────
  /\/messages(\/.*)?$/i,
  /\/chat(\/.*)?$/i,
  /\/student\/messages/i,
  /\/faculty\/messages/i,
  /\/parent\/messages/i,
  /\/faculty\/mentor\/messages/i,

  // ── Leave & OD Request and Approval Screens ───────────────────
  /\/leave-od(\/.*)?$/i,
  /\/leave(\/.*)?$/i,
  /\/faculty\/leave-od(\/.*)?$/i,
  /\/faculty\/leave-request(\/.*)?$/i,
  /\/mentor\/leave-od(\/.*)?$/i,
  /\/faculty\/mentor\/leave-od(\/.*)?$/i,
  /\/hod\/leave-od(\/.*)?$/i,
  /\/hod\/leave-approvals(\/.*)?$/i,
  /\/hod\/approvals(\/.*)?$/i,
  /\/hod\/faculty-requests(\/.*)?$/i,
  /\/vp\/leave-approvals(\/.*)?$/i,
  /\/vp\/acting-principal\/approvals(\/.*)?$/i,
  /\/approval-center(\/.*)?$/i,
  /\/principal\/approval-center(\/.*)?$/i,

  // ── Campus Workspace Full-Screen Editors ──────────────────────
  /\/workspace\/docs(\/.*)?$/i,
  /\/workspace\/sheets(\/.*)?$/i,
  /\/workspace\/slides(\/.*)?$/i,
  /\/workspace\/forms(\/.*)?$/i,
  /\/workspace\/quiz(\/.*)?$/i,
  /\/workspace\/notes(\/.*)?$/i,
  /\/workspace\/reports(\/.*)?$/i,
  /\/workspace\/report(\/.*)?$/i,
  /\/workspace\/pdf(\/.*)?$/i,

  // ── Intensive Forms & Data Entry ─────────────────────────────
  /\/faculty\/attendance(\/.*)?$/i,
  /\/faculty\/assignments(\/.*)?$/i,
  /\/faculty\/internal-marks(\/.*)?$/i,
  /\/faculty\/marks(\/.*)?$/i,
  /\/student\/complaints(\/.*)?$/i,
  /\/student\/fees(\/.*)?$/i,
  /\/admin\/settings(\/.*)?$/i,
  /\/admin\/users(\/.*)?$/i,
  /\/roles(\/.*)?$/i,
  /\/rbac(\/.*)?$/i,
  /\/iam(\/.*)?$/i,
];

export function shouldShowQuickStart(context: QuickStartPolicyContext): boolean {
  const { pathname, isKeyboardOpen, hasActions, isModalOpen } = context;

  // 1. Never show when software keyboard is open
  if (isKeyboardOpen) {
    return false;
  }

  // 2. Never show when modal or drawer with primary action is open
  if (isModalOpen) {
    return false;
  }

  // 3. Must have available contextual actions for current role
  if (!hasActions) {
    return false;
  }

  // 4. Normalize pathname
  const normalizedPath = pathname.trim().toLowerCase();

  // 5. Check if route matches any blocked pattern
  const isBlocked = BLOCKED_ROUTE_PATTERNS.some((pattern) => pattern.test(normalizedPath));
  if (isBlocked) {
    return false;
  }

  return true;
}
