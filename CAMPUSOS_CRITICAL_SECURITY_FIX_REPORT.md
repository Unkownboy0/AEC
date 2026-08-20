# CampusOS Critical Security Fix Report

Date: 2026-08-19

This report records only changes and verification performed against the existing CampusOS product. Status terms are deliberately limited to the requested vocabulary.

## Executive status

| Finding | Status | Evidence |
|---|---|---|
| Razorpay-to-demo verification bypass | TEST VERIFIED | Persisted provider controls settlement; negative and idempotency suites pass |
| Razorpay webhook authentication/raw-body boundary | TEST VERIFIED | Public raw-body route plus constant-time HMAC contract tests |
| Principal-to-VP delegation scope bypass | TEST VERIFIED | Central delegated-action guard plus eight positive/negative scenarios |
| Fabricated live student identity | TEST VERIFIED | Placeholder path removed; unresolved relation blocks action with correlation ID |
| Approval API authorization | TEST VERIFIED | Canonical router mounted; per-request and per-attachment authorization contract passes |
| Result publication controls | TEST VERIFIED | Existing COE result end-to-end suite remained green |
| Production database/public URL configuration | STATICALLY VERIFIED | Unsafe database and password-reset fallbacks removed from production paths |

## 1. Payment verification bypass

### Original flaw and impact

Client input such as `mode: DEMO_PAYMENT`, an order prefix, or an unconfigured gateway could influence the trusted provider branch. A caller could therefore try to settle a persisted Razorpay order without a valid Razorpay signature. This was a direct financial-integrity vulnerability.

### Exact fix

- Authentication and request-shape validation remain mandatory.
- Verification first loads the payment by server-known order ID and the authenticated student's ownership.
- The only trusted branch is the persisted database provider: `RAZORPAY` or `DEMO_PAYMENT`.
- A persisted Razorpay payment always requires a payment ID and signature. HMAC comparison uses constant-time byte comparison.
- Client `mode` and `provider` fields cannot convert a Razorpay record to demo.
- Demo settlement is accepted only when `PAYMENT_GATEWAY=DEMO_PAYMENT` and the database record was created by the server as demo.
- Replays are idempotent only when the replayed identifiers match the settled record; inconsistent settled replays are rejected.
- The unsafe implicit payment-gateway fallback was replaced by explicit `RAZORPAY`, `DEMO_PAYMENT`, or `DISABLED` policy.

Primary files:

- `product/server/src/modules/fees/payment-security.ts`
- `product/server/src/modules/fees/student-fee.service.ts`
- `product/server/src/modules/fees/student-fee.controller.ts`
- `product/server/src/config/env.ts`
- `product/server/src/__tests__/payment_security_regression.test.ts`
- `product/server/src/__tests__/payment_idempotency_policy.test.ts`

Tests: payment security regression passed; all 10 payment idempotency cases passed; the pre-existing payment gateway suite passed.

Status: **TEST VERIFIED**.

## 2. Razorpay webhook

### Original flaw and impact

The webhook was behind CampusOS JWT middleware and was therefore unreachable by Razorpay. The handler also consumed parsed JSON and did not authenticate the exact received bytes.

### Exact fix

- Added canonical `POST /api/payments/razorpay/webhook` before the global JSON parser and outside session authentication.
- This single route uses `express.raw({ type: 'application/json' })`; global body parsing is unchanged.
- `x-razorpay-signature` is required and verified over the exact `Buffer` with `RAZORPAY_WEBHOOK_SECRET`.
- Invalid/missing signatures are rejected before JSON parsing or database lookup.
- Only a persisted Razorpay payment can be associated with a verified event.
- Unknown orders are handled without creating a payment or ledger entry.
- Verified event/payment identifiers are retained in payment metadata for replay-safe processing and audit without logging secrets.
- The webhook is a verified secondary confirmation path. Ledger settlement remains in the authenticated, ownership-checked payment verification transaction, so a webhook replay cannot create a duplicate ledger posting.

Primary files:

- `product/server/src/modules/fees/razorpay-webhook.routes.ts`
- `product/server/src/modules/fees/payment-security.ts`
- `product/server/src/modules/fees/student-fee.service.ts`
- `product/server/src/app.ts`

Tests: valid, invalid, missing, and byte-changed webhook HMAC cases passed in the payment security suite. Existing payment idempotency tests passed.

Status: **TEST VERIFIED** for the signature and idempotency contract. External Razorpay delivery is **BLOCKED / NOT VERIFIED** because no live Razorpay callback was available in this environment.

## 3. Principal-to-VP delegation

### Original flaw and impact

An active VP delegation could satisfy a generic Principal role guard without consistently enforcing exact permissions, category, resource, workflow stage, exclusions, or finance threshold at the write boundary. This could turn narrow delegation into unrelated Principal authority.

### Exact fix

- Removed the global VP-to-Principal role alias from `requireRole`.
- Added one delegated Principal action authorization path in the principal-availability guard.
- It checks acting user, linked Principal, institution, active state, date window, revocation/expiry, permission, category, excluded permissions, request type, department, resource ID, workflow stage, and financial threshold.
- Direct Principal endpoints no longer admit VP merely because a delegation is active.
- Delegated writes audit the VP as actor and separately record `actingFor`, delegation ID, required permission, resource, stage, and timestamp.

Primary files:

- `product/server/src/core/middlewares/auth.middleware.ts`
- `product/server/src/modules/principal-availability/delegation.guard.ts`
- `product/server/src/modules/principal-availability/availability.resolver.ts`
- `product/server/src/modules/principal-availability/availability.types.ts`
- `product/server/src/__tests__/vp_delegation_policy.test.ts`

Tests: expired, revoked, wrong VP, missing permission, wrong category, threshold exceeded, wrong stage, excluded action, and valid scoped action behavior passed. The existing 18-case delegation E2E suite also passed.

Status: **TEST VERIFIED**.

## 4. Student leave data integrity

### Original flaw and source cause

The leave detail/action path could substitute `STUDENT-MOCK`, `Student Requester`, and a fake registration number when a generic workflow request lacked a resolvable Student relation. The schema already constrains `StudentLeaveRequest.studentId` with a required foreign key; the source defect was cross-domain fallback logic treating the nullable student relation on the generic multi-domain `WorkflowRequest` as a student-leave identity.

### Exact fix

- Removed all live placeholder identity construction.
- Student leave detail must resolve the actual Student ID, name, admission/register number, and department.
- An unresolved relation produces a structured conflict, a correlation/request ID in structured server logging, and the safe message: `This leave request references a student record that could not be resolved. Action has been blocked.`
- Approve/reject is blocked before mutation when the student relation cannot be resolved.
- No historical request is deleted or silently repaired.

Primary files:

- `product/server/src/modules/enterprise/student-leave.service.ts`
- `product/server/src/utils/exceptions.ts`
- `product/server/src/__tests__/student_leave_integrity_regression.test.ts`

Tests: source/integrity regression passed; existing 14-case leave/OD/substitution E2E suite passed.

Status: **TEST VERIFIED**.

## 5. Approval authorization and raw-error containment

- A canonical middleware resolves the domain request and assignment before returning detail, timeline, or attachments.
- Access is limited to institution executives, direct participants, or the scoped department HOD.
- Current institution and active workspace/role context are retained through the existing authentication boundary.
- Attachment download verifies both request ownership and attachment ID; controller exceptions now pass through the structured global error handler instead of returning raw internal messages.

Primary files:

- `product/server/src/modules/approvals/approval-access.middleware.ts`
- `product/server/src/modules/approvals/approval.routes.ts`
- `product/server/src/modules/approvals/approval.controller.ts`

Tests: mounted-route and middleware contract passed, including unrelated-user denial structure.

Status: **TEST VERIFIED**.

## 6. Configuration security

- `DATABASE_URL` no longer silently becomes `postgres:postgres@localhost` in the Prisma client. Production configuration is required to supply it.
- Production password-reset links require the configured HTTPS public application URL; localhost fallback is development-only.
- Production CORS uses configured origins; developer LAN origins exist only in development policy.
- Push diagnostics expose `configured` versus `in_app_only` without exposing credentials.

Primary files:

- `product/server/src/lib/prisma.ts`
- `product/server/src/config/env.ts`
- `product/server/src/modules/auth/auth.service.ts`
- `product/server/src/app.ts`

Status: **STATICALLY VERIFIED** and server TypeScript **BUILD VERIFIED**.

## 7. Workflow convergence classification

No risky release-window rewrite was performed.

| Domain | Current model | Migration risk | Recommended convergence |
|---|---|---:|---|
| Student Leave / OD | Stable bespoke service and domain tables | High | Retain domain state machine; adopt shared authorization, delegation, audit, notification, SLA primitives incrementally |
| Faculty Leave / OD | Stable bespoke workflow | High | Same incremental shared primitives; preserve substitution/timetable side effects |
| Complaints | Bespoke complaint/ticket lifecycle | Medium | Move recipient policy, audit, notifications, and escalation clocks behind shared interfaces first |
| Tasks | Bespoke task lifecycle | Medium | Centralize assignee resolution and event/audit contracts before state migration |
| Purchases | Domain-specific approval lifecycle | High | Reuse delegated financial threshold and approval-step authorization; do not genericize monetary side effects prematurely |
| Certificates | Domain-specific request/issuance path | Medium | Converge step authorization, reasons, audit, and notification while retaining issuance rules |
| Integration chains / generic requests | Existing `WorkflowEngineService` consumer | Existing | Continue as the reference shared-engine path |

Status: classification **STATICALLY VERIFIED**; full migration intentionally **BLOCKED / NOT VERIFIED** for this release pass.

## Verification record

Passed:

- Prisma schema validation
- Server TypeScript build
- Client TypeScript check
- Payment security and idempotency suites
- VP delegation policy and delegation E2E suites
- Student leave integrity and leave/OD E2E suites
- Approval route contract
- Security boundary suite
- Role-aware notification routing
- Workspace access and governed-file policy
- COE results E2E regression
- Vite production build
- Android `assembleDebug`

One legacy phase-2 workflow test reached its live Firebase send and failed because outbound FCM network access was denied. Database/workflow assertions before that send executed; actual external FCM delivery is **BLOCKED / NOT VERIFIED**. In-app degradation remains configured.
