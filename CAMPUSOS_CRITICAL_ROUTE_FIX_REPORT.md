# CampusOS Critical Route Fix Report

Date: 2026-08-19

## Canonical route decisions

| Area | Canonical path/implementation | Status |
|---|---|---|
| Approval request detail | `GET /api/approval-requests/:id/details` | TEST VERIFIED |
| Approval timeline | `GET /api/approval-requests/:id/timeline` | TEST VERIFIED |
| Approval attachments | `GET /api/approval-requests/:id/attachments` | TEST VERIFIED |
| Approval attachment download | `GET /api/approval-requests/:id/attachments/:attachmentId/download` | TEST VERIFIED authorization contract |
| Razorpay webhook | `POST /api/payments/razorpay/webhook` | TEST VERIFIED signature contract |
| Realtime stream | `GET /api/rbac/stream` using authenticated SSE | TEST VERIFIED transport contract |
| Circular lifecycle | `modules/circulars/circular.routes.ts` | STATICALLY VERIFIED canonical mount |
| Principal availability/delegation | Availability routes plus the non-overlapping principal-delegation status/history routes | STATICALLY VERIFIED |

## Approval routes

The existing approval router was mounted at `/api`, matching all current client calls. A new canonical access middleware resolves the real domain request and assignment before controller execution. It rechecks institution, participant/approver/requester authority, executive role, and HOD department scope. Attachment access additionally verifies that the attachment belongs to the already-authorized request. Errors flow through the structured error middleware.

Files:

- `product/server/src/app.ts`
- `product/server/src/modules/approvals/approval.routes.ts`
- `product/server/src/modules/approvals/approval-access.middleware.ts`
- `product/server/src/modules/approvals/approval.controller.ts`
- `product/server/src/__tests__/approval_route_contract.test.ts`

Status: **TEST VERIFIED**. A browser session with multiple live production identities was unavailable, so UI-level participant-versus-unrelated-user execution is **BLOCKED / NOT VERIFIED**.

## Complaint ownership and notification

Complaint creation now uses one ownership resolver instead of optional caller data or a random first user:

- Academic: operating department HOD, then Academic Dean fallback.
- Hostel: Hostel Warden.
- Transport: Transport Manager.
- Library: Librarian.
- Fees/accounts: configured accounts authority.
- Administration/student service/general: configured administration or central grievance authority.
- IT and IQAC categories: corresponding configured institutional authority.

Creation fails safely if no configured authority exists; `assignedToUserId = null` is no longer treated as a successful routed complaint. The assignee receives the existing durable domain notification, and the requester receives acknowledgement. Existing notification infrastructure and push degradation behavior were retained.

Files:

- `product/server/src/modules/enterprise/complaint-routing.service.ts`
- `product/server/src/modules/enterprise/enterprise.service.ts`
- `product/server/src/modules/notifications/recipient-resolver.service.ts`
- `product/server/src/__tests__/routing_security_regressions.test.ts`

Status: **TEST VERIFIED** policy/contract and existing role-aware notification suite.

## Task recipient hardening

When a task event contains `taskId`, the recipient resolver now derives the creator and real assignees from the database. Caller-provided metadata remains supplemental rather than being the only source, preventing a missing metadata field from silently notifying nobody.

Status: **TEST VERIFIED**.

## Workspace share notifications

The governed sharing model now supports user, role, department, section, and all-institution principals. ACL persistence and audit complete before notification dispatch. Recipient discovery uses current institution/workspace data, and all-institution publication creates durable notification rows before batched push dispatch. Notifications never grant access: opening the file continues through the governed-file ACL check.

Files:

- `product/server/src/modules/campus-workspace/workspace.document.service.ts`
- `product/server/src/modules/campus-workspace/workspace.types.ts`
- `product/server/src/modules/notifications/recipient-resolver.service.ts`
- `product/server/src/__tests__/governed_file_policy.test.ts`
- `product/server/src/__tests__/routing_security_regressions.test.ts`

Status: **TEST VERIFIED**.

## Realtime truth correction

The dead WebSocket client targeting `/api/v1/realtime/ws` was removed. CampusOS now uses the server's actual authenticated SSE stream at `/api/rbac/stream`:

- Bearer authentication and `X-Active-Role` are sent as headers; no access token is placed in the URL.
- Server connection state records user, institution, workspace, and active role.
- Targeted events are filtered by user; events remain small invalidation messages rather than sensitive record payloads.
- SSE IDs support `Last-Event-ID` resume semantics.
- Heartbeats, abort/disconnect cleanup, jittered capped exponential reconnect, polling/focus refresh, and FCM-triggered refresh remain available.

The truthful product description is: **authenticated server-sent events provide in-app invalidation; polling/focus refresh is the recovery path, and FCM provides OS-level push-triggered updates where configured.**

Files:

- `product/client/src/realtime/realtime-client.ts`
- `product/client/src/realtime/RealtimeProvider.tsx`
- `product/server/src/lib/socket.ts`
- `product/server/src/modules/enterprise/rbac.controller.ts`
- `product/server/src/__tests__/realtime_transport_contract.test.ts`

Status: **TEST VERIFIED** for transport/auth/filter/reconnect contracts. Multi-device production load and proxy timeout behavior are **BLOCKED / NOT VERIFIED**.

## Dead/superseded router disposition

- `modules/circulars/circular.routes.ts` is canonical because it contains the lifecycle paths consumed by the client. The older enterprise circular router is unmounted and retained only pending a separate safe deletion review.
- `modules/principal-availability/*` is canonical for availability/context and delegated authorization. `modules/principal-delegation/delegation.routes.ts` retains only non-conflicting current status, revoke, and handover history operations.
- `modules/delegation/delegation.routes.ts` is superseded and unmounted.
- `enterprise/hod-portal.routes.ts` is superseded by the mounted HOD routes and remains unmounted.

No duplicate endpoint implementation was added. Physical deletion was not performed because the repository already contained substantial unrelated work and the deletion operation was not approved by the execution safety boundary.

Status: canonical mounts **STATICALLY VERIFIED**; stale-file deletion **BLOCKED / NOT VERIFIED**.

## Route verification

Passed:

- Approval route mounting/authorization contract
- Payment webhook route/raw-parser contract
- Complaint/task/share routing regression suite
- Realtime transport contract
- Server TypeScript build
- Vite production build

No raw `Cannot GET`, Prisma error, stack trace, or internal path was added to these user-facing API responses.
