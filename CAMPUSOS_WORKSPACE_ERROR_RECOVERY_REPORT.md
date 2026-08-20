# CampusOS Workspace Error Recovery Report

Date: 2026-08-19

## Root cause

`CampusWorkspaceHome.loadDocuments` caught every request failure, wrote only a console message and then rendered the same empty state used for a legitimate zero-document result. `CampusDrivePage` similarly emitted a transient toast and retained no retryable state. The shared HTTP interceptor also omitted the selected active-role header.

## Implemented recovery

- Workspace and Drive store a typed `AppErrorView` instead of discarding errors.
- Load retry clears stale error state and reissues the authoritative request.
- Active workspace is a request dependency, so a role switch invalidates and reloads the surface.
- The shared request interceptor attaches `X-Active-Role` from secure role storage.
- Current-user refresh preserves the authenticated profile on transient network/server failures.
- Disabled-module `503/MODULE_DISABLED` is distinct from server failure.

## Error classification

| Condition | User state | Retry | Status |
|---|---|---|---|
| Offline | Reconnect guidance | Yes | IMPLEMENTED |
| Network unreachable | Server-address/network guidance | Yes | IMPLEMENTED |
| Timeout | Timed-out guidance | Yes | IMPLEMENTED |
| 401 | Session-expired guidance | No | IMPLEMENTED |
| 403 | Active-workspace access guidance | No | IMPLEMENTED |
| 404 | Missing/moved content guidance | Yes | IMPLEMENTED |
| 503 `MODULE_DISABLED` | Institution-disabled guidance | Yes | IMPLEMENTED |
| 5xx | Service-error guidance | Yes | IMPLEMENTED |
| Configuration fault | Configuration guidance | No | IMPLEMENTED |

## Verification

| Check | Status |
|---|---|
| Workspace and Drive TypeScript integration | BUILD VERIFIED |
| Feature-flag policy tests | TEST VERIFIED |
| Campus Suite catalog tests | TEST VERIFIED |
| Workspace production bundle | BUILD VERIFIED |
| Live server outage/recovery interaction | NOT VERIFIED |
| Physical-device workspace switch/retry | NOT VERIFIED |

