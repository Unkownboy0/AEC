# Module 04 — Vice Principal workspace

## Built

- Normal VP dashboard is sourced from `/api/vp-command/dashboard` and never uses fabricated fallback values.
- Normal VP approvals remain separate from delegated Principal assignments.
- Acting mode is returned only for the exact active delegate and displays “Acting on behalf of Principal”.
- Dashboard connects departments, attendance, tasks, circulars, academics, placements, reports and alerts.

## Delegated authority boundary

Every delegated action validates active status, identity, tenant scope, start/end window, assignment/delegation link, category, permission, resource scope, workflow stage, financial threshold and unresolved status. The server remains authoritative; the client route guard is presentation only.

The current schema is single-tenant and does not contain tenant foreign keys. `CAMPUS_TENANT_ID` is therefore embedded into every newly created delegation scope and checked at authorization time. Missing tenant scope fails closed, so legacy delegations must be reissued before use.

## Realtime revocation

- Server validates delegation again on every read and action.
- Resolver expires delegations and returns pending assignments immediately.
- VP client refreshes authority every two seconds and on window focus/visibility changes.

## Verification

- Server/client production builds.
- Security suite includes VP privilege-escalation cases for wrong identity, tenant, department, stage, threshold, status and time window.
