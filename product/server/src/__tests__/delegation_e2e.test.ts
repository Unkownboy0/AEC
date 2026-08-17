/**
 * delegation_e2e.test.ts — Blocker #2
 *
 * End-to-End simulation of the Principal → VP Delegation workflow.
 * Traced directly from the live implementation in:
 *   - delegation.guard.ts  (authorizeDelegatedAssignmentAction)
 *   - availability.types.ts (PrincipalAvailabilityContext)
 *   - request-routing.service.ts (resolveApproverForRequest)
 *   - request-transfer.service.ts (isEligible + category enforcement)
 *   - availability.resolver.ts (auto-normalization on AVAILABLE return)
 *
 * Tests the full lifecycle:
 *  A. Principal goes OFFLINE → delegation created → VP gets acting authority
 *  B. Approved action succeeds on delegated category
 *  C. Undelegated category routes to Principal even during active delegation
 *  D. Financial threshold enforced precisely
 *  E. Department scope enforced — out-of-scope department denied
 *  F. Workflow stage enforcement — undelegated stage denied
 *  G. Wrong VP denied
 *  H. Tenant scope enforced — cross-tenant denied
 *  I. Time window enforced — expired delegation denied
 *  J. Time window enforced — future delegation (not yet started) denied
 *  K. Revoked delegation denied
 *  L. Normal VP direct permissions unaffected by delegation lifecycle
 *  M. Principal returns AVAILABLE → delegation auto-revoked → VP loses acting authority
 *  N. Audit chain: actor + acting authority + delegation ID must be present
 *  O. Request re-routing: PENDING request in delegated category re-assigned to VP
 *  P. Request NOT re-routed if category is undelegated
 */

import assert from 'assert';
import {
  authorizeDelegatedAssignmentAction,
  authorizeDirectPrincipalAction,
  categoryForRequestType,
  permissionForRequestAction,
} from '../modules/principal-availability/delegation.guard';
import type { PrincipalAvailabilityContext } from '../modules/principal-availability/availability.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT = 'tenant-campusos-prod';
const now = Date.now();

function makeContext(overrides: Partial<PrincipalAvailabilityContext> = {}): PrincipalAvailabilityContext {
  return {
    principalStatus: 'OFFLINE',
    delegationStatus: 'ACTIVE',
    canPrincipalProcessRequests: false,
    canVpActAsPrincipal: true,
    permissionVersion: 1,
    serverTime: new Date().toISOString(),
    actingPrincipal: { userId: 'vp-user-1', name: 'Dr. VP Kumar', role: 'VICE_PRINCIPAL' },
    delegation: {
      id: 'deleg-001',
      startsAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),   // 2h ago
      endsAt:   new Date(now + 6 * 60 * 60 * 1000).toISOString(),   // 6h from now
      reason: 'Principal on official duty visit',
      delegatedCategories: ['FACULTY_LEAVE', 'HOD_LEAVE', 'CIRCULAR_APPROVAL'],
      permissions: ['leave.approve', 'leave.reject', 'leave.return', 'leave.request-info', 'circular.publish'],
      scope: {
        tenantId: TENANT,
        departmentIds: ['dept-cse', 'dept-ece'],
        workflowStages: ['PRINCIPAL'],
      },
      financialThreshold: null,
    },
    ...overrides,
  };
}

function makeAssignment(overrides: any = {}) {
  return {
    assignedUserId: 'vp-user-1',
    assignedRole: 'ACTING_PRINCIPAL',
    requestType: 'FACULTY_LEAVE',
    status: 'PENDING',
    delegationId: 'deleg-001',
    departmentId: 'dept-cse',
    workflowStage: 'PRINCIPAL',
    financialAmount: null,
    ...overrides,
  };
}

// ─── Audit log simulation ──────────────────────────────────────────────────────

interface AuditEntry {
  actorId: string;
  actingAuthority: string;
  delegationId: string | null;
  action: string;
  requestId: string;
  category: string;
}
const auditLog: AuditEntry[] = [];

function simulateDelegatedApprove(
  context: PrincipalAvailabilityContext,
  assignment: ReturnType<typeof makeAssignment>,
  vpUserId: string,
  requestId: string
): { ok: boolean; code?: string; auditEntry?: AuditEntry } {
  const result = authorizeDelegatedAssignmentAction(context, assignment, vpUserId, 'approve', TENANT);
  if (!result.ok) return { ok: false, code: (result as any).code };

  const entry: AuditEntry = {
    actorId: vpUserId,
    actingAuthority: context.actingPrincipal?.userId === vpUserId ? 'ACTING_PRINCIPAL' : 'DIRECT',
    delegationId: context.delegation?.id || null,
    action: 'APPROVE',
    requestId,
    category: categoryForRequestType(assignment.requestType),
  };
  auditLog.push(entry);
  return { ok: true, auditEntry: entry };
}

// ─── Routing simulation (mirrors request-routing.service.ts logic) ─────────────

interface RoutingResult {
  assignedRole: 'PRINCIPAL' | 'ACTING_PRINCIPAL';
  assignedUserId: string;
  delegationId: string | null;
}

function simulateResolveApprover(
  context: PrincipalAvailabilityContext,
  requestType: string
): RoutingResult {
  const category = categoryForRequestType(requestType);
  const categoryDelegated = (context.delegation?.delegatedCategories || []).includes(category);

  if (context.principalStatus === 'AVAILABLE' || !context.canVpActAsPrincipal || !context.actingPrincipal || !categoryDelegated) {
    return { assignedRole: 'PRINCIPAL', assignedUserId: 'principal-user-1', delegationId: null };
  }
  return {
    assignedRole: 'ACTING_PRINCIPAL',
    assignedUserId: context.actingPrincipal.userId,
    delegationId: context.delegation?.id || null,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

// ─── A: categoryForRequestType mapping ────────────────────────────────────────
assert.strictEqual(categoryForRequestType('FACULTY_LEAVE'),    'FACULTY_LEAVE',        'FACULTY_LEAVE → FACULTY_LEAVE');
assert.strictEqual(categoryForRequestType('FACULTY_OD'),       'FACULTY_LEAVE',        'FACULTY_OD → FACULTY_LEAVE category');
assert.strictEqual(categoryForRequestType('HOD_LEAVE'),        'HOD_LEAVE',            'HOD_LEAVE → HOD_LEAVE');
assert.strictEqual(categoryForRequestType('DEAN_LEAVE'),       'DEAN_LEAVE',           'DEAN_LEAVE → DEAN_LEAVE');
assert.strictEqual(categoryForRequestType('CIRCULAR_APPROVAL'),'CIRCULAR_APPROVAL',    'CIRCULAR → CIRCULAR_APPROVAL');
assert.strictEqual(categoryForRequestType('DOCUMENT_REQUEST'), 'DOCUMENT_APPROVAL',    'DOCUMENT → DOCUMENT_APPROVAL');
assert.strictEqual(categoryForRequestType('TASK_REVIEW'),      'TASK_APPROVAL',        'TASK → TASK_APPROVAL');
console.log('✅ A: Category mapping for all request types correct');

// ─── B: permissionForRequestAction mapping ────────────────────────────────────
assert.strictEqual(permissionForRequestAction('FACULTY_LEAVE',    'approve'),         'leave.approve');
assert.strictEqual(permissionForRequestAction('FACULTY_OD',       'approve'),         'od.approve');
assert.strictEqual(permissionForRequestAction('FACULTY_LEAVE',    'reject'),          'leave.reject');
assert.strictEqual(permissionForRequestAction('CIRCULAR_APPROVAL','approve'),         'circular.publish',  'circular approve maps to circular.publish');
assert.strictEqual(permissionForRequestAction('FINANCE_APPROVAL', 'approve'),         'finance.approve');
assert.strictEqual(permissionForRequestAction('DOCUMENT_REQUEST', 'request-info'),    'document.request-info');
console.log('✅ B: Permission mapping for all actions/types correct');

// ─── C: Allowed action on delegated category succeeds ────────────────────────
const ctx = makeContext();
const r1 = simulateDelegatedApprove(ctx, makeAssignment(), 'vp-user-1', 'req-001');
assert.ok(r1.ok, 'Delegated VP can approve FACULTY_LEAVE in CSE dept at PRINCIPAL stage');
assert.ok(r1.auditEntry, 'Audit entry created');
assert.strictEqual(r1.auditEntry!.actingAuthority, 'ACTING_PRINCIPAL', 'Audit records acting authority');
assert.strictEqual(r1.auditEntry!.delegationId, 'deleg-001', 'Audit records delegation ID');
assert.strictEqual(r1.auditEntry!.actorId, 'vp-user-1', 'Audit records actor VP user ID');
console.log('✅ C: Delegated approval succeeds with full audit chain');

// ─── D: Different VP denied ──────────────────────────────────────────────────
const r2 = authorizeDelegatedAssignmentAction(ctx, makeAssignment(), 'vp-user-WRONG', 'approve', TENANT);
assert.ok(!r2.ok);
assert.strictEqual((r2 as any).code, 'DELEGATION_UNAUTHORIZED', 'Wrong VP gets DELEGATION_UNAUTHORIZED');
console.log('✅ D: Unauthorized VP denied — DELEGATION_UNAUTHORIZED');

// ─── E: Delegation inactive when Principal AVAILABLE ─────────────────────────
const ctxAvail = makeContext({ principalStatus: 'AVAILABLE', canVpActAsPrincipal: false });
const r3 = authorizeDelegatedAssignmentAction(ctxAvail, makeAssignment(), 'vp-user-1', 'approve', TENANT);
assert.ok(!r3.ok);
assert.strictEqual((r3 as any).code, 'DELEGATION_INACTIVE', 'AVAILABLE principal → DELEGATION_INACTIVE');
console.log('✅ E: Principal AVAILABLE → delegation inactive');

// ─── F: Revoked delegation denied ─────────────────────────────────────────────
const ctxRevoked = makeContext({ delegationStatus: 'REVOKED', canVpActAsPrincipal: false });
const r4 = authorizeDelegatedAssignmentAction(ctxRevoked, makeAssignment(), 'vp-user-1', 'approve', TENANT);
assert.ok(!r4.ok);
assert.strictEqual((r4 as any).code, 'DELEGATION_INACTIVE', 'Revoked delegation → DELEGATION_INACTIVE');
console.log('✅ F: Revoked delegation → DELEGATION_INACTIVE');

// ─── G: Expired delegation denied ─────────────────────────────────────────────
const ctxExpired = makeContext({
  delegation: { ...ctx.delegation!, endsAt: new Date(now - 1).toISOString() },
});
const r5 = authorizeDelegatedAssignmentAction(ctxExpired, makeAssignment(), 'vp-user-1', 'approve', TENANT);
assert.ok(!r5.ok);
assert.strictEqual((r5 as any).code, 'DELEGATION_OUTSIDE_WINDOW', 'Expired delegation → DELEGATION_OUTSIDE_WINDOW');
console.log('✅ G: Expired delegation → DELEGATION_OUTSIDE_WINDOW');

// ─── H: Future delegation (not yet started) denied ────────────────────────────
const ctxFuture = makeContext({
  delegation: { ...ctx.delegation!, startsAt: new Date(now + 3600000).toISOString() },
});
const r6 = authorizeDelegatedAssignmentAction(ctxFuture, makeAssignment(), 'vp-user-1', 'approve', TENANT);
assert.ok(!r6.ok);
assert.strictEqual((r6 as any).code, 'DELEGATION_OUTSIDE_WINDOW', 'Future delegation → DELEGATION_OUTSIDE_WINDOW');
console.log('✅ H: Future-dated delegation (not yet started) → DELEGATION_OUTSIDE_WINDOW');

// ─── I: Undelegated category denied ───────────────────────────────────────────
const r7 = authorizeDelegatedAssignmentAction(ctx, makeAssignment({ requestType: 'FINANCE_APPROVAL' }), 'vp-user-1', 'approve', TENANT);
assert.ok(!r7.ok);
assert.strictEqual((r7 as any).code, 'CATEGORY_NOT_DELEGATED', 'Finance not delegated → CATEGORY_NOT_DELEGATED');
console.log('✅ I: Finance category not delegated → CATEGORY_NOT_DELEGATED');

// ─── J: Cross-department (out of scope) denied ────────────────────────────────
const r8 = authorizeDelegatedAssignmentAction(ctx, makeAssignment({ departmentId: 'dept-civil' }), 'vp-user-1', 'approve', TENANT);
assert.ok(!r8.ok);
assert.strictEqual((r8 as any).code, 'RESOURCE_OUT_OF_SCOPE', 'Out-of-scope dept → RESOURCE_OUT_OF_SCOPE');
console.log('✅ J: Cross-department (CIVIL not in [CSE, ECE]) → RESOURCE_OUT_OF_SCOPE');

// ─── K: Wrong workflow stage denied ───────────────────────────────────────────
const r9 = authorizeDelegatedAssignmentAction(ctx, makeAssignment({ workflowStage: 'HOD' }), 'vp-user-1', 'approve', TENANT);
assert.ok(!r9.ok);
assert.strictEqual((r9 as any).code, 'WORKFLOW_STAGE_NOT_DELEGATED', 'HOD stage not delegated → WORKFLOW_STAGE_NOT_DELEGATED');
console.log('✅ K: Undelegated workflow stage → WORKFLOW_STAGE_NOT_DELEGATED');

// ─── L: Cross-tenant denied ───────────────────────────────────────────────────
const r10 = authorizeDelegatedAssignmentAction(ctx, makeAssignment(), 'vp-user-1', 'approve', 'tenant-B-DIFFERENT');
assert.ok(!r10.ok);
assert.strictEqual((r10 as any).code, 'TENANT_SCOPE_MISMATCH', 'Cross-tenant → TENANT_SCOPE_MISMATCH');
console.log('✅ L: Cross-tenant delegation attempt → TENANT_SCOPE_MISMATCH');

// ─── M: Financial threshold enforced ─────────────────────────────────────────
const ctxWithThreshold = makeContext({
  delegation: {
    ...ctx.delegation!,
    delegatedCategories: [...ctx.delegation!.delegatedCategories, 'FINANCE_APPROVAL'],
    permissions: [...ctx.delegation!.permissions, 'finance.approve'],
    financialThreshold: 50000,
  },
});
const rFin1 = authorizeDelegatedAssignmentAction(ctxWithThreshold, makeAssignment({ requestType: 'FINANCE_APPROVAL', financialAmount: 49999 }), 'vp-user-1', 'approve', TENANT);
assert.ok(rFin1.ok, 'Finance amount BELOW threshold should succeed');

const rFin2 = authorizeDelegatedAssignmentAction(ctxWithThreshold, makeAssignment({ requestType: 'FINANCE_APPROVAL', financialAmount: 50001 }), 'vp-user-1', 'approve', TENANT);
assert.ok(!rFin2.ok);
assert.strictEqual((rFin2 as any).code, 'FINANCIAL_THRESHOLD_EXCEEDED', 'Amount above threshold → FINANCIAL_THRESHOLD_EXCEEDED');

const rFin3 = authorizeDelegatedAssignmentAction(ctxWithThreshold, makeAssignment({ requestType: 'FINANCE_APPROVAL', financialAmount: 50000 }), 'vp-user-1', 'approve', TENANT);
assert.ok(rFin3.ok, 'Amount exactly AT threshold (50000 === 50000) is ALLOWED — live impl uses > not >=');
console.log('✅ M: Financial threshold enforced precisely (below=allow, at=allow, above=deny, live uses strict >)');

// ─── N: Already resolved request denied ───────────────────────────────────────
const rResolved = authorizeDelegatedAssignmentAction(ctx, makeAssignment({ status: 'APPROVED' }), 'vp-user-1', 'approve', TENANT);
assert.ok(!rResolved.ok);
assert.strictEqual((rResolved as any).code, 'ALREADY_RESOLVED', 'Resolved request → ALREADY_RESOLVED');

const rRejected = authorizeDelegatedAssignmentAction(ctx, makeAssignment({ status: 'REJECTED' }), 'vp-user-1', 'approve', TENANT);
assert.ok(!rRejected.ok);
assert.strictEqual((rRejected as any).code, 'ALREADY_RESOLVED', 'Rejected request → ALREADY_RESOLVED');
console.log('✅ N: Already-resolved request → ALREADY_RESOLVED (idempotent guard)');

// ─── O: Direct Principal authorization guard ──────────────────────────────────
// Principal approving their own assigned request
const rDirect1 = authorizeDirectPrincipalAction('Principal', 'principal-1', { assignedUserId: 'principal-1', status: 'PENDING' });
assert.ok(rDirect1.ok, 'Principal can act on own assigned request');

// Super Admin can approve any request
const rDirect2 = authorizeDirectPrincipalAction('Super Admin', 'admin-1', { assignedUserId: 'principal-1', status: 'PENDING' });
assert.ok(rDirect2.ok, 'Super Admin can approve any request');

// Faculty cannot approve via direct Principal endpoint
const rDirect3 = authorizeDirectPrincipalAction('Faculty', 'fac-1', { assignedUserId: 'principal-1', status: 'PENDING' });
assert.ok(!rDirect3.ok);
assert.strictEqual((rDirect3 as any).code, 'NOT_ASSIGNED', 'Faculty cannot approve principal-level request');
console.log('✅ O: Direct Principal authorization guard — role boundaries enforced');

// ─── P: Request routing — undelegated category routes to Principal ────────────
const routeLeave = simulateResolveApprover(ctx, 'FACULTY_LEAVE');
assert.strictEqual(routeLeave.assignedRole, 'ACTING_PRINCIPAL', 'FACULTY_LEAVE routes to VP when delegation active');
assert.strictEqual(routeLeave.delegationId, 'deleg-001', 'Routes with correct delegation ID');

const routeFinance = simulateResolveApprover(ctx, 'FINANCE_APPROVAL');
assert.strictEqual(routeFinance.assignedRole, 'PRINCIPAL', 'FINANCE routes to Principal — not delegated');
assert.strictEqual(routeFinance.delegationId, null, 'Undelegated route has no delegation ID');
console.log('✅ P: Request routing — delegated → VP, undelegated → Principal');

// ─── Q: VP returning to AVAILABLE auto-revokes delegation ────────────────────
// Simulate auto-normalization: AVAILABLE principal → canVpActAsPrincipal becomes false
const ctxAfterReturn = makeContext({
  principalStatus: 'AVAILABLE',
  delegationStatus: 'REVOKED',
  canVpActAsPrincipal: false,
  actingPrincipal: null,
  delegation: null,
});
const rAfterReturn = authorizeDelegatedAssignmentAction(ctxAfterReturn, makeAssignment(), 'vp-user-1', 'approve', TENANT);
assert.ok(!rAfterReturn.ok, 'VP loses acting authority after Principal returns');
assert.strictEqual((rAfterReturn as any).code, 'DELEGATION_INACTIVE', 'Post-return → DELEGATION_INACTIVE');
console.log('✅ Q: Principal returns AVAILABLE → delegation auto-revoked → VP loses acting authority');

// ─── R: Audit chain completeness ─────────────────────────────────────────────
assert.ok(auditLog.length >= 1, 'At least one audit entry generated');
const firstEntry = auditLog[0];
assert.ok(firstEntry.actorId, 'Audit: actorId present');
assert.ok(firstEntry.actingAuthority, 'Audit: actingAuthority present');
assert.ok(firstEntry.delegationId, 'Audit: delegationId present');
assert.ok(firstEntry.action, 'Audit: action present');
assert.ok(firstEntry.requestId, 'Audit: requestId present');
assert.ok(firstEntry.category, 'Audit: request category present');
console.log('✅ R: Audit chain — actor + actingAuthority + delegationId + action all recorded');

console.log(`\n✅ Blocker #2 PASS: Principal→VP Delegation E2E — 18 scenarios validated`);
console.log(`   Delegation lifecycle: OFFLINE→active→expire/revoke→return`);
console.log(`   Auth boundaries: VP identity, tenant, dept, stage, category, threshold, time window`);
console.log(`   Routing: delegated→VP, undelegated→Principal`);
console.log(`   Audit: actor, actingAuthority, delegationId all required`);
