import { Request, Response, NextFunction } from 'express';
import { PrincipalAvailabilityResolver } from './availability.resolver';
import { PrincipalAvailabilityContext } from './availability.types';
import { env } from '../../config/env';
import type { UserPayload } from '../../core/middlewares/auth.middleware';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
  actingDelegationId?: string;
}

export type AssignmentAuthorizationResult =
  | { ok: true }
  | { ok: false; status: number; code: string; error: string };

export type DelegatedAction = 'approve' | 'reject' | 'return' | 'request-info';

/**
 * Maps an ApprovalAssignment.requestType to the delegatedCategories vocabulary
 * used by the Principal availability modal (see AvailabilityModal.tsx CATEGORY_OPTIONS).
 */
export function categoryForRequestType(requestType: string): string {
  const t = (requestType || '').toUpperCase();
  if (t.startsWith('FACULTY')) return 'FACULTY_LEAVE';
  if (t.startsWith('HOD')) return 'HOD_LEAVE';
  if (t.startsWith('DEAN')) return 'DEAN_LEAVE';
  if (t.startsWith('DOCUMENT')) return 'DOCUMENT_APPROVAL';
  if (t.startsWith('CIRCULAR')) return 'CIRCULAR_APPROVAL';
  if (t.startsWith('TASK')) return 'TASK_APPROVAL';
  return t;
}

export function permissionForRequestAction(requestType: string, action: DelegatedAction): string {
  const type = (requestType || '').toUpperCase();
  const domain = type.includes('OD') ? 'od'
    : type.includes('LEAVE') ? 'leave'
    : type.includes('CIRCULAR') ? 'circular'
    : type.includes('FINANCE') || type.includes('FEE') ? 'finance'
    : type.includes('DOCUMENT') ? 'document'
    : type.includes('TASK') ? 'task'
    : type.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'unknown';
  const verb = domain === 'circular' && action === 'approve' ? 'publish' : action;
  return `${domain}.${verb}`;
}

/**
 * Single enforcement point for "can this Acting Principal (VP) act on this specific
 * assignment right now" — checked at every delegated approve/reject/return/request-info
 * action, not just at the route-level "is any delegation active" guard. Deny by default.
 */
export function authorizeDelegatedAssignmentAction(
  context: PrincipalAvailabilityContext,
  assignment: {
    assignedUserId: string;
    assignedRole: string;
    requestType: string;
    status: string;
    delegationId?: string | null;
    departmentId?: string | null;
    workflowStage?: string | null;
    financialAmount?: number | null;
  },
  vpUserId: string,
  action: DelegatedAction = 'approve',
  tenantId: string = env.CAMPUS_TENANT_ID,
): AssignmentAuthorizationResult {
  if (!context.canVpActAsPrincipal || !context.actingPrincipal || context.principalStatus === 'AVAILABLE' || !context.delegation) {
    return { ok: false, status: 403, code: 'DELEGATION_INACTIVE', error: 'Principal is currently Available. Vice Principal Acting Mode is inactive.' };
  }

  if (context.actingPrincipal.userId !== vpUserId) {
    return { ok: false, status: 403, code: 'DELEGATION_UNAUTHORIZED', error: 'You are not the designated Vice Principal for the current active delegation.' };
  }

  if (assignment.assignedUserId !== vpUserId && assignment.assignedRole !== 'ACTING_PRINCIPAL') {
    return { ok: false, status: 403, code: 'ASSIGNMENT_NOT_DELEGATED', error: 'This request is not assigned to you under the active delegation.' };
  }

  if (assignment.delegationId && assignment.delegationId !== context.delegation.id) {
    return { ok: false, status: 403, code: 'DELEGATION_MISMATCH', error: 'This request belongs to a delegation that is no longer active.' };
  }

  if (!assignment.delegationId) {
    return { ok: false, status: 403, code: 'DELEGATION_MISSING', error: 'This request is not linked to the active delegation.' };
  }

  const now = Date.now();
  if (new Date(context.delegation.startsAt).getTime() > now || new Date(context.delegation.endsAt).getTime() <= now) {
    return { ok: false, status: 403, code: 'DELEGATION_OUTSIDE_WINDOW', error: 'The delegation is not currently within its authorized time window.' };
  }

  const category = categoryForRequestType(assignment.requestType);
  const delegatedCategories = context.delegation.delegatedCategories || [];
  if (!delegatedCategories.includes(category)) {
    return { ok: false, status: 403, code: 'CATEGORY_NOT_DELEGATED', error: `The Principal did not delegate the "${category}" category to you.` };
  }

  const requiredPermission = permissionForRequestAction(assignment.requestType, action);
  if (!(context.delegation.permissions || []).includes(requiredPermission)) {
    return { ok: false, status: 403, code: 'PERMISSION_NOT_DELEGATED', error: `The Principal did not delegate the "${requiredPermission}" action to you.` };
  }

  const scope = context.delegation.scope || {};
  if (!scope.tenantId || scope.tenantId !== tenantId) {
    return { ok: false, status: 403, code: 'TENANT_SCOPE_MISMATCH', error: 'This delegation does not belong to the current institution tenant.' };
  }
  if (scope.requestTypes?.length && !scope.requestTypes.includes(assignment.requestType)) {
    return { ok: false, status: 403, code: 'RESOURCE_OUT_OF_SCOPE', error: 'This request type is outside the delegated scope.' };
  }
  if (scope.departmentIds?.length && (!assignment.departmentId || !scope.departmentIds.includes(assignment.departmentId))) {
    return { ok: false, status: 403, code: 'RESOURCE_OUT_OF_SCOPE', error: 'This request belongs to a department outside the delegated scope.' };
  }
  if (scope.workflowStages?.length && (!assignment.workflowStage || !scope.workflowStages.includes(assignment.workflowStage))) {
    return { ok: false, status: 403, code: 'WORKFLOW_STAGE_NOT_DELEGATED', error: 'This workflow stage is not eligible for delegation.' };
  }

  if (requiredPermission === 'finance.approve' && assignment.financialAmount != null) {
    const threshold = context.delegation.financialThreshold;
    if (threshold == null || assignment.financialAmount > threshold) {
      return { ok: false, status: 403, code: 'FINANCIAL_THRESHOLD_EXCEEDED', error: 'This financial approval exceeds the delegated threshold.' };
    }
  }

  if (assignment.status !== 'PENDING') {
    return { ok: false, status: 409, code: 'ALREADY_RESOLVED', error: 'This request has already been resolved.' };
  }

  return { ok: true };
}

/**
 * Guard for the direct (non-delegated) Principal approval endpoints
 * (POST /principal/approval-center/requests/:id/approve|reject), which previously had
 * no authorization check beyond "is authenticated" — any logged-in user of any role could
 * approve/reject any pending assignment. Requires Principal/Super Admin role, or that the
 * assignment is actually assigned to the caller.
 */
export function authorizeDirectPrincipalAction(
  userRoleName: string | undefined,
  principalUserId: string,
  assignment: { assignedUserId: string; status: string } | null
): AssignmentAuthorizationResult {
  const roleNorm = (userRoleName || '').toUpperCase();
  const isExecutive = roleNorm === 'PRINCIPAL' || roleNorm === 'SUPER ADMIN' || roleNorm === 'SUPERADMIN' || roleNorm === 'ADMIN';

  if (!isExecutive && (!assignment || assignment.assignedUserId !== principalUserId)) {
    return { ok: false, status: 403, code: 'NOT_ASSIGNED', error: 'This request is not assigned to you.' };
  }

  if (assignment && assignment.status !== 'PENDING') {
    return { ok: false, status: 409, code: 'ALREADY_RESOLVED', error: 'This request has already been resolved.' };
  }

  return { ok: true };
}

export class ActingPrincipalGuard {
  /**
   * Enforces that current user is authorized to act as Vice Principal (Acting Principal)
   * under a currently valid ACTIVE delegation.
   */
  static async requireActiveDelegation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          error: 'Authentication required',
        });
      }

      const context = await PrincipalAvailabilityResolver.resolveContext();

      if (!context.canVpActAsPrincipal || !context.actingPrincipal || context.principalStatus === 'AVAILABLE') {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          error: 'Principal is currently Available. Vice Principal Acting Mode is inactive.',
          principalStatus: context.principalStatus,
        });
      }

      const userRole = (typeof user.role === 'object' ? (user.role as any)?.name : String(user.role || '')).toUpperCase().replace(/[\s_]+/g, '');
      const isVpRole = userRole === 'VP' || userRole === 'VICEPRINCIPAL';

      if (!isVpRole || context.actingPrincipal.userId !== user.id) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_UNAUTHORIZED',
          error: 'You are not the designated Vice Principal for the current active delegation.',
        });
      }

      if (!context.delegation || context.delegationStatus !== 'ACTIVE') {
        return res.status(403).json({ success: false, code: 'DELEGATION_INACTIVE', error: 'No active delegation is available.' });
      }
      req.actingDelegationId = context.delegation.id;
      return next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Error validating acting principal authorization',
      });
    }
  }
}
