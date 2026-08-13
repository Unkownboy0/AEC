import assert from 'assert';
import { authorizeDelegatedAssignmentAction } from '../modules/principal-availability/delegation.guard';
import { PrincipalAvailabilityContext } from '../modules/principal-availability/availability.types';
import { vpDashboardQuerySchema } from '../modules/vp-command/vp-command.validator';

const now = Date.now();
const tenantId = 'tenant-a';
const context: PrincipalAvailabilityContext = {
  principalStatus: 'OFFLINE', delegationStatus: 'ACTIVE', canPrincipalProcessRequests: false, canVpActAsPrincipal: true,
  permissionVersion: 3, serverTime: new Date().toISOString(),
  actingPrincipal: { userId: 'vp-1', name: 'Vice Principal', role: 'VICE_PRINCIPAL' },
  delegation: {
    id: 'delegation-1', startsAt: new Date(now - 60_000).toISOString(), endsAt: new Date(now + 60_000).toISOString(), reason: 'Duty',
    delegatedCategories: ['FACULTY_LEAVE', 'FINANCE_APPROVAL'], permissions: ['leave.approve', 'finance.approve'],
    scope: { tenantId, departmentIds: ['dept-1'], workflowStages: ['PRINCIPAL'] }, financialThreshold: 50_000,
  },
};
const assignment = { assignedUserId: 'vp-1', assignedRole: 'ACTING_PRINCIPAL', requestType: 'FACULTY_LEAVE', status: 'PENDING', delegationId: 'delegation-1', departmentId: 'dept-1', workflowStage: 'PRINCIPAL', financialAmount: null };

assert.deepStrictEqual(authorizeDelegatedAssignmentAction(context, assignment, 'vp-1', 'approve', tenantId), { ok: true });
assert.strictEqual(authorizeDelegatedAssignmentAction(context, assignment, 'vp-2', 'approve', tenantId).ok, false, 'different VP denied');
assert.strictEqual((authorizeDelegatedAssignmentAction(context, assignment, 'vp-1', 'approve', 'tenant-b') as any).code, 'TENANT_SCOPE_MISMATCH');
assert.strictEqual((authorizeDelegatedAssignmentAction(context, { ...assignment, departmentId: 'dept-2' }, 'vp-1', 'approve', tenantId) as any).code, 'RESOURCE_OUT_OF_SCOPE');
assert.strictEqual((authorizeDelegatedAssignmentAction(context, { ...assignment, workflowStage: 'HOD' }, 'vp-1', 'approve', tenantId) as any).code, 'WORKFLOW_STAGE_NOT_DELEGATED');
assert.strictEqual((authorizeDelegatedAssignmentAction(context, { ...assignment, requestType: 'FINANCE_APPROVAL', financialAmount: 50_001 }, 'vp-1', 'approve', tenantId) as any).code, 'FINANCIAL_THRESHOLD_EXCEEDED');
assert.strictEqual((authorizeDelegatedAssignmentAction(context, { ...assignment, status: 'APPROVED' }, 'vp-1', 'approve', tenantId) as any).code, 'ALREADY_RESOLVED');
assert.strictEqual((authorizeDelegatedAssignmentAction({ ...context, delegationStatus: 'REVOKED', canVpActAsPrincipal: false }, assignment, 'vp-1', 'approve', tenantId) as any).code, 'DELEGATION_INACTIVE');
assert.strictEqual((authorizeDelegatedAssignmentAction({ ...context, delegation: { ...context.delegation!, endsAt: new Date(now - 1).toISOString() } }, assignment, 'vp-1', 'approve', tenantId) as any).code, 'DELEGATION_OUTSIDE_WINDOW');
assert.strictEqual(vpDashboardQuerySchema.safeParse({ periodDays: 30 }).success, true);
assert.strictEqual(vpDashboardQuerySchema.safeParse({ periodDays: 3 }).success, false);

console.log('VP delegation privilege-escalation tests passed');
