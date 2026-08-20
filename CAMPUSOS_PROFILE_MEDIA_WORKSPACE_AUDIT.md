# CampusOS Profile Media and Workspace Audit

Date: 2026-08-19

## Outcome

| Area | Finding | Status |
|---|---|---|
| Canonical identity | `User` is the account identity shared by Student, Faculty and Parent profiles. | STATICALLY VERIFIED |
| Legacy photo field | `User.profilePhoto` stored mixed data URLs, upload paths, API URLs and file IDs. | STATICALLY VERIFIED |
| Canonical file object | `MediaFile` plus governed versions is the existing file authority. | STATICALLY VERIFIED |
| Gender source | `User.gender`, `Student.gender` and `Faculty.gender` existed with inconsistent casing/defaults. | STATICALLY VERIFIED |
| Workspace load | `CampusWorkspaceHome` swallowed API failures and rendered an empty document state. | STATICALLY VERIFIED |
| Active role transport | The shared HTTP client attached bearer auth but omitted `X-Active-Role`. | STATICALLY VERIFIED |
| Avatar delivery | `/api/files/:id/content` was publicly reachable and could serve legacy avatar media. | STATICALLY VERIFIED |
| Cache refresh | `AuthProvider` appended `Date.now()` to photo URLs rather than using a stable media version. | STATICALLY VERIFIED |
| Generic error inventory | Repository-wide search found generic failure language in 150 client files; many are console/toast diagnostics, while high-impact Workspace and Drive loaders had no durable recovery state. | STATICALLY VERIFIED |

## Canonical decision

`User.profileImageFileId` is the single identity-photo reference. It points to the existing `MediaFile` model. Student, Faculty, Employee-style views and role workspaces resolve the same `User` image. `User.profilePhoto` remains a read-only compatibility fallback and is cleared by all new avatar writes.

No Student, Faculty, Parent, workspace-specific profile-image table, alternate file object or alternate auth state was introduced.

## Failure paths confirmed

1. Workspace document errors were caught, logged and discarded; users saw empty content rather than offline, authorization, disabled-module or server states.
2. Workspace requests could lose the active role header after switching workspaces.
3. Profile updates accepted base64 data inside a general profile payload, trusted declared MIME/extensions and persisted a URL string.
4. Other modules selected only `profilePhoto`; once a canonical reference was used, those views would otherwise lose the image.
5. Auth refresh treated several transient current-profile failures as logout-equivalent null state.

## Remediation coverage

| Remediation | Status |
|---|---|
| Additive canonical foreign key and migration | IMPLEMENTED |
| Shared server upload validation with signature checks | IMPLEMENTED |
| Authenticated minimal avatar endpoint | IMPLEMENTED |
| Stable checksum cache version | IMPLEMENTED |
| Shared current-profile refresh retained on transient failure | IMPLEMENTED |
| `X-Active-Role` on shared API client | IMPLEMENTED |
| Typed Workspace and Drive recovery states | IMPLEMENTED |
| Cross-module avatar descriptor propagation | IMPLEMENTED |
| Physical web/Android/iOS interaction | NOT VERIFIED |

## Migration constraint

Prisma schema validation and migration reproducibility are verified. The local database has a divergent historical migration table: its baseline migrations are not present in this worktree, while all three worktree migrations are unapplied. Applying the new migration automatically would be unsafe.

| Check | Status |
|---|---|
| `prisma validate` | TEST VERIFIED |
| Migration file structure/reproducibility | TEST VERIFIED |
| Apply migration to the existing local database | BLOCKED |
| Fresh database deploy | NOT VERIFIED |

