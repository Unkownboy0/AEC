# CampusOS Error State Audit

Date: 2026-08-19

## Repository-wide audit

A full client scan for `Failed to load`, `Failed to fetch`, `Unable to load`, `Error loading`, `Network Error`, and `Something went wrong` found matches in 150 files. The matches include four distinct categories:

| Category | Examples | Finding | Status |
|---|---|---|---|
| Durable page states | Workspace, Drive, faculty/HOD/VP pages | Several pages already used the design-system `ErrorState`; Workspace and Drive did not. | STATICALLY VERIFIED |
| Toast-only loaders | editors, admin portals, dashboards | Useful action feedback but insufficient as the only page recovery state. | STATICALLY VERIFIED |
| Console diagnostics | hooks, monitoring panels, portals | Developer diagnostics; not necessarily user-visible defects. | STATICALLY VERIFIED |
| Error boundaries | app/module boundaries | Generic catastrophic fallback is appropriate, but it is not a request classifier. | STATICALLY VERIFIED |

## Common implementation

`classifyAppError` is the canonical request classifier. `AppErrorState` is the canonical durable request-failure renderer and composes the existing design-system `ErrorState`; no second design system was created.

Workspace and Campus Drive are migrated because they are the P0 entry and file-management surfaces. Existing pages already using `ErrorState` remain compatible. Toast-only and console-only occurrences are documented for incremental migration rather than mechanically replacing action-level messages with page-level blockers.

## Required behavior status

| Behavior | Status |
|---|---|
| Offline/network/auth/access/not-found/module-disabled/server distinction | IMPLEMENTED |
| Retry callbacks for recoverable states | IMPLEMENTED |
| Request reference ID display when supplied | IMPLEMENTED |
| Workspace switch invalidation | IMPLEMENTED |
| Empty state remains distinct from error state | IMPLEMENTED |
| Every one of 150 matched files migrated to `AppErrorState` | NOT VERIFIED |
| P0 Workspace and Drive migrated | BUILD VERIFIED |

## Verification boundary

The audit is exhaustive at the text/source level. It does not claim that every matched string is a defect or that every screen was physically exercised. Catastrophic error boundaries intentionally retain general language, while request-driven surfaces should adopt the classifier as they are touched.

