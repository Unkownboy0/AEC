# CampusOS production-readiness audit and migration plan

Audit baseline: 2026-08-11. The current working tree, including pre-existing uncommitted changes, was treated as the source of truth. No existing work was reset, stashed, or deleted.

## Verified architecture

| Area | Actual implementation | Verification |
| --- | --- | --- |
| Web | React 19, Vite 5, React Router 6, TanStack Query, Tailwind | TypeScript passes |
| Mobile | Shared web client in Capacitor 8 with Android and iOS projects | Configuration/source present; native release not signed or device-validated here |
| API | Express 4 and TypeScript | TypeScript passes |
| Database | PostgreSQL through Prisma 5 migrations | Prisma schema validates |
| Authentication | JWT access/refresh sessions with persisted session records | Source verified; live multi-user test pending controlled DB fixture |
| Authorization | Roles, secondary roles, workspaces, permissions, department memberships, role guards | Implemented unevenly; endpoint/resource ABAC requires route-by-route tests |
| Realtime | Socket/event source and multiple client providers | Present; production transport and recipient isolation not load-tested |
| Notifications | In-app records, device tokens and routing adapters | Present; external delivery credentials and end-to-end push not verified |
| Storage | Local filesystem plus `MediaFile` metadata | Hardened to configurable root and authenticated delivery; tenant/owner metadata remains incomplete |
| Backups | PostgreSQL custom-format dump and archive validation | Implemented; off-site file copy, encryption, retention and restore drill remain operational work |

## Findings by severity

### Critical

- The repository tracks `product/server/.env` despite ignore rules. Rotate every value that has ever been stored there and remove the file from version control in an authorized repository-cleanup operation.
- Uploaded files were served directly from `/uploads`, bypassing authentication and resource authorization. Static serving has been removed and an authenticated download endpoint added.
- The backup API attempted to copy a nonexistent SQLite `dev.db` while the application uses PostgreSQL, and reported a simulated restore as fully restorable. It now creates a PostgreSQL custom archive and performs an honest `pg_restore --list` validation.
- The previous Docker Compose published PostgreSQL, Redis and MinIO management ports and used default credentials. Services are now internal-only and require supplied secrets.

### High

- `MediaFile` lacks institution, owner, classification and resource-link fields, so permission checks can only be coarse. Add nullable ownership/scope columns with a data-preserving migration, backfill, then enforce ABAC.
- Production env configuration previously accepted a short JWT secret and localhost defaults. Startup validation now requires a 32-character secret and explicit HTTPS production origins.
- Password reset email is a console-only SMTP mock. Production must fail closed unless a real provider is configured.
- Rate limiting is per-process memory. Multi-instance production needs Redis-backed limiting and bounded cleanup.
- Queue/worker behavior, Redis caching, malware scanning, off-site backup, retention alerts, payment provider callbacks and push delivery are not end-to-end production implementations merely because reports/specs exist.
- Several route collections use one top-level auth middleware but resource-level ABAC is inconsistent. All sensitive routes need negative tests for cross-department, cross-child, cross-mentee and cross-workspace ID manipulation.

### Medium

- Multiple route registries, realtime providers and overlapping leave/circular endpoints increase drift risk.
- Main frontend bundle size and role-wide eager imports require measurement and code splitting.
- Hundreds of placeholders and development logging calls need classification; many are legitimate UI placeholders, but existing reports do not prove functionality.
- Generated `dist`, logs, uploads and mobile service configuration are present in the working tree and need a release-artifact policy.

### Low

- Encoding corruption appears in comments/log strings and several historical reports.
- Documentation contains contradictory claims, including a 100% production-ready sign-off alongside planned or blocked verification.

## Dependency-ordered migration

1. Rotate leaked secrets; establish development/staging/production env files outside Git and a one-time production bootstrap.
2. Apply storage ownership migration and backfill before enforcing file ABAC; add content signature inspection and malware adapter.
3. Add Redis-backed rate limiting, queue workers, targeted realtime fan-out and notification delivery adapters.
4. Complete PostgreSQL plus file backup automation, encrypted off-site copy, alerting, retention and a measured restore drill.
5. Verify payment webhooks, idempotency, amount/signature checks and reconciliation using provider sandbox credentials.
6. Build controlled role fixtures and run the complete authorization matrix, including negative ID-tampering cases.
7. Validate desktop web, mobile web, Android devices and macOS-hosted iOS builds; do not mark iOS PASS from Windows.
8. Load-test measured critical paths, remediate observed query/index/bundle issues, and record RPO/RTO.

## Acceptance rule

No role or module is PASS based on a menu, page, schema model, or previous report alone. PASS requires an authenticated fixture, authorized API and database behavior, denial tests, real action/download behavior, audit/notification checks where applicable, and platform verification. Until those fixtures and external services are available, affected matrix cells remain WARNING or FAIL.
