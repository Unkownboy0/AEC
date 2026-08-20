# Campus Drive security matrix

Status date: 2026-08-19

Legend: IMPLEMENTED, STATICALLY VERIFIED, TEST VERIFIED, BUILD VERIFIED, PHYSICAL DEVICE VERIFIED, BLOCKED / NOT VERIFIED.

| Boundary / operation | Expected decision | Enforcement | Evidence status |
|---|---|---|---|
| Missing/invalid Bearer token | Deny before file metadata | Existing `requireAuth` | TEST VERIFIED by existing security suite |
| Unassigned `X-Active-Role` | Deny active workspace | Existing `resolveUserWorkspaceAccess` middleware | TEST VERIFIED by existing RBAC/ABAC suite |
| Disabled Campus Workspace feature | Drive and picker APIs unavailable; launcher entries hidden | `requireFeature` and server catalog flag resolution | TEST VERIFIED |
| Owner requests VIEW/DOWNLOAD/COMMENT/EDIT/MANAGE | Allow | Derived `MediaFile.ownerUserId` or Drive item owner | STATICALLY VERIFIED |
| Specific user with VIEW requests VIEW | Allow | Exact user grant | TEST VERIFIED |
| Specific user with VIEW requests DOWNLOAD or EDIT | Deny | Non-escalating action matrix | TEST VERIFIED |
| DOWNLOAD grant requests VIEW/DOWNLOAD | Allow | Action matrix | TEST VERIFIED |
| COMMENT grant requests DOWNLOAD | Deny | Action matrix | TEST VERIFIED |
| Role grant in different active role | Deny | Normalized current `X-Active-Role` only | TEST VERIFIED |
| Workspace grant in different active workspace | Deny | Actor workspace/active role match | TEST VERIFIED |
| Department grant to unrelated department HOD | Deny | Exact current department ID | TEST VERIFIED at policy level; database scenario BLOCKED / NOT VERIFIED |
| Institution grant to authenticated user | Allow only granted action | `ALL_INSTITUTION` match after auth | TEST VERIFIED |
| Revoked grant | Deny | `revokedAt` makes grant inactive | TEST VERIFIED |
| Expired grant | Deny | `expiresAt <= now` makes grant inactive | TEST VERIFIED |
| Guessed canonical `fileId` | Deny without owner/grant/parent authority | Central authorization on download | STATICALLY VERIFIED |
| Guessed `referenceId` | Deny unless exact file/reference and parent rule succeeds | Reference lookup + Task membership callback | STATICALLY VERIFIED |
| Unrelated task user uses valid Task reference | Deny | Task creator/assignee query | STATICALLY VERIFIED |
| Task creator/assignee uses Task reference | Allow governed download | Parent-resource callback | STATICALLY VERIFIED |
| Student accesses another student's private file | Deny | Owner/grant/parent checks | STATICALLY VERIFIED; end-to-end seeded scenario BLOCKED / NOT VERIFIED |
| Unlinked parent accesses student file | Deny | No generic parent role bypass | STATICALLY VERIFIED |
| Unassigned faculty accesses class/submission file | Deny; module must register authoritative adapter | No class principal or generic faculty bypass | STATICALLY VERIFIED |
| IQAC evidence exposed by Drive listing | Deny unless explicitly represented/shared | Legacy evidence is not auto-imported | STATICALLY VERIFIED |
| Shared-with-me list reveals unshared filename | Deny metadata | Candidate rows pass `authorizeDriveItem` before serialization | STATICALLY VERIFIED |
| Picker reveals unauthorized filename | Deny metadata | Same authorization path as Drive list/download | STATICALLY VERIFIED |
| Search reveals unauthorized filename | Deny metadata | Server search followed by same ACL authorization | STATICALLY VERIFIED |
| Folder listing leaks unauthorized descendant | Deny item | Direct/inherited evaluation per returned candidate | STATICALLY VERIFIED |
| Folder inheritance after move | Recompute against new ancestry | Parent chain evaluated at request time | STATICALLY VERIFIED |
| Folder cycle/self-parent | Reject write | Self/descendant checks and bounded traversal | STATICALLY VERIFIED |
| Absolute Windows/Linux path as new identity | Reject | Canonical storage-key validation | STATICALLY VERIFIED |
| `..` traversal or null byte | Reject | Canonical key and physical resolver checks | TEST VERIFIED by governed storage security test |
| Symlink escapes storage root | Reject | `realpath` plus relative-root confinement | TEST VERIFIED by governed storage security test |
| Public inline content endpoint guesses Drive file | Return fallback, never bytes | Source-module restriction | STATICALLY VERIFIED |
| Download MIME confusion | Safe declared MIME + `nosniff` | Existing hardened response headers | BUILD VERIFIED |
| Filename header injection | Sanitize CR/LF/quotes/slashes; UTF-8 filename | Existing hardened response construction | BUILD VERIFIED |
| Browser/proxy caches private file | Prevent cache | `private, no-store`, `Pragma: no-cache` | BUILD VERIFIED |
| Duplicate checksum across users | No cross-user deduplication | Checksum is metadata only | STATICALLY VERIFIED |
| Attach existing file to Task | Store `fileId` reference; no byte copy | `GovernedFileReference` uniqueness | BUILD VERIFIED |
| Delete file with active module references | Reject | Reference count | STATICALLY VERIFIED |
| Delete file with another Drive item | Reject | Other-item count | STATICALLY VERIFIED |
| Authorized unreferenced permanent delete | Remove logical item, quarantine binary | MANAGE + lifecycle transaction | STATICALLY VERIFIED |
| Direct user share | Grant + audit + one notification | Existing audit and notification services | BUILD VERIFIED |
| Department/role/institution share | Grant + audit, no notification fan-out | Existing audit service | BUILD VERIFIED |
| Android Open/Save/Share | Existing authenticated native adapter receives canonical download URL | `platform/download.ts` unchanged; Drive actions reuse it | BUILD VERIFIED; PHYSICAL DEVICE VERIFIED not claimed |

## Principal support decision

| Requested principal | Phase 1 status | Reason |
|---|---|---|
| OWNER | IMPLEMENTED | Derived from canonical metadata; cannot be revoked accidentally |
| SPECIFIC_USER | IMPLEMENTED | Exact user ID is cleanly supported |
| ROLE | IMPLEMENTED | Evaluated against active role, not latent assigned roles |
| WORKSPACE | IMPLEMENTED | Uses current active workspace/role context |
| DEPARTMENT | IMPLEMENTED | Current user department is available and stable |
| ALL_INSTITUTION | IMPLEMENTED | Still requires authentication and a bounded access level |
| PROGRAMME | BLOCKED / NOT VERIFIED | General membership resolver not yet centralized |
| YEAR | BLOCKED / NOT VERIFIED | Academic-year membership is resource-dependent |
| SECTION | BLOCKED / NOT VERIFIED | Student and faculty section membership differs by resource |
| CLASS | BLOCKED / NOT VERIFIED | Requires enrolment/teaching allocation resolver |

## Device verification

Android compilation and asset sync can prove package integration only. No real Android or iOS device was operated in this phase, so Open, Save, Share, keyboard behavior, and touch behavior remain PHYSICAL DEVICE VERIFIED: not claimed.
