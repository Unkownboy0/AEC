# Campus Drive file model audit

Status date: 2026-08-19

## Decision

`MediaFile` is the existing binary metadata record and is adapted as the canonical governed file object. `CampusDriveItem` remains the logical file/folder/document-reference record. No parallel generic file table was introduced.

Canonical identity for new governed writes is:

- `MediaFile.id` → `fileId`
- `MediaFile.storageKey` → storage-root-relative object key

`MediaFile.path` and module-specific URL/reference fields remain as compatibility locators for historical rows. New Drive APIs never return an absolute filesystem path or a public storage URL as file identity.

## Existing representations

| Model / table | Storage-key behavior | Owner / scope | Existing permission authority | Download path | Referencing modules | Duplication risk | Migration recommendation |
|---|---|---|---|---|---|---|---|
| `MediaFile` / `media_files` | Previously `path`; now additive nullable `storageKey`, with deterministic migration for non-URL `/uploads` paths | New rows: `ownerUserId`, `createdByUserId`, `sourceModule`; historical rows may be unowned | Canonical governed rows use `GovernedFileService`; legacy media retains `files:read` | `GET /api/files/:id/download` | Media library, new Campus Drive binaries | Low after adaptation | Canonical object. Backfill resolvable keys; keep legacy `path` until historical validation is complete. |
| `CampusDriveItem` / `campus_drive_items` | Previously optional `fileUrl`; now optional `fileId` relation to `MediaFile` | `ownerId`, department, logical scope, folder ancestry | Central ACL service; legacy JSON `permissions` retained but not authoritative for new grants | Canonical item returns `/api/files/:fileId/download`; legacy `fileUrl` remains | Campus Drive, Workspace | High if bytes were copied per folder | Use `fileId` for new files. Do not copy bytes when moving or attaching. |
| `GovernedFileAccessGrant` / `governed_file_access_grants` | No binary locator | File or Drive item; user/role/workspace/department/institution principal | Explicit level, expiry, revocation; folder grants inherit through ancestors | Evaluated before metadata listing/download | Drive and reusable picker | None | New additive authority for governed file/Drive access. |
| `GovernedFileReference` / `governed_file_references` | References `fileId` only | Module/resource/purpose; `FILE_ACL` or `PARENT_RESOURCE` | File ACL or authoritative parent-resource callback | Canonical download can include an opaque `referenceId` for parent checks | Tasks now; Classroom/Chat/IQAC-ready | Prevents attachment-byte copies | Adopt per module when its parent authorization is integrated. |
| `GovernedFileVersion` / `governed_file_versions` | Immutable `storageKey` per version | Actor captured by `createdByUserId` | Same governed file authority | Current binary through file endpoint; version download endpoint is not exposed in Phase 1 | Campus Drive binary history | Low | Initial upload creates version 1. Add editor-specific version workflows without overwriting previous keys. |
| `Attachment` / `attachments` | `storedName` plus `fileUrl` | `uploaderId`; Task or TaskComment | Task/comment resource rules | Module URL / legacy file path | Governance Tasks and comments | Medium; overlaps canonical metadata/versioning | Preserve. Migrate future writes to `GovernedFileReference`; do not bulk-convert until task download authorization is mapped. |
| `FileVersion` / `file_versions` | `storedName` plus `fileUrl` | `uploaderId`; belongs to `Attachment` | Parent Task/Comment | Module URL | Task attachments | Medium | Preserve historical versions. New governed binaries use `GovernedFileVersion`; do not merge histories silently. |
| `RequestAttachment` / `request_attachments` | `fileUrl` | Student leave request and uploader string | Student leave parent workflow | Leave/request controller route | Leave / OD | High if copied into Drive | Parent-resource authority remains authoritative. Future adapter should add `fileId` while retaining request ownership. |
| `ApprovalAttachment` / `approval_attachments` | Already uses `storageKey`, checksum, soft-delete status | Approval request and uploader user | Approval request access service | `/api/approval-requests/:requestId/attachments/:attachmentId/download` | Unified approvals | Low | Strong candidate for deterministic `fileId` adapter. Preserve its secure request-scoped download route. |
| `MessageAttachment` / `message_attachments` | `fileUrl` | Message/conversation participants | Conversation membership | Chat/message route | Chat | High | Add canonical `fileId` on future integration and use `PARENT_RESOURCE`; never expose via generic Drive ACL alone. |
| `AcademicTaskFile` / `academic_task_files` | `storageReference` | Academic task/assignment and uploader | Task, department assignment, evaluator workflow | Academic-task module | Academic Dean tasks, HOD submissions | Medium | Keep parent authorization. Map `storageReference` to canonical `fileId` only after deterministic lookup. |
| `IqacEvidence` / `iqac_evidence` | `fileReference`, optional `repositoryKey` | Audit, department, requirement, uploader | IQAC audit/evidence workflow and department scope | IQAC module | IQAC evidence/accreditation | Medium | Preserve evidence workflow authority and immutable versions. Add governed reference rather than showing all evidence in Drive. |
| `InternshipDocument` / `internship_documents` | `fileUrl` | Student + internship | Student/placement verification workflow | Internship/placement module | Internship evidence | Medium | Future parent-resource adapter. Do not list automatically in Drive. |
| `GovernanceDocument` / `governance_documents` | Optional `fileUrl` | Author/department/lifecycle | Governance workflow and signatures | Governance module | Circulars/policies/NAAC/NBA | Medium | Keep signed/lifecycle resource authoritative; use canonical reference for future versions. |
| `CampusOfficeDocument` / `campus_office_documents` | Native structured content, not a stored binary | Author, department, target users/roles/scope | `WorkspacePermissionService` | Export routes produce PDF/DOCX/XLSX/CSV/PPTX | Docs, Sheets, Slides, Forms, Notes, Reports | Low | Do not force native documents into `MediaFile`. A Drive item may hold `documentId`; exported snapshots may become governed binaries when persistence is required. |
| `CampusDocumentVersion` / `campus_document_versions` | Immutable JSON content snapshot | Document and author | Parent `CampusOfficeDocument` permission | Version restore/export routes | Workspace native documents | None | Remains authoritative for editor content versions. It is complementary to binary versions. |
| `ExportJob.fileReference` / `export_jobs` | Opaque legacy reference | Requester and expiry | Export/report scope | Export service | Reports/profile exports | Medium | Keep expiry and requester authorization. Adopt canonical file reference when export persistence is normalized. |
| Receipt/certificate/hall-ticket URL or JSON fields | Module-specific URLs/JSON references | Student/parent/finance/COE/event ownership | Parent module ABAC and workflow permissions | Module-specific authenticated endpoints | Fees, certificates, COE, events | High if bulk-exposed | Preserve existing endpoints. Do not auto-import into user Drive. Add canonical adapters incrementally with `PARENT_RESOURCE`. |
| `DocumentDownloadAudit` / `document_download_audits` | No binary identity | User, role, target resource | Audit-only | N/A | Existing document/export audit | None | Preserve for business-specific reports. Governed file operations additionally use the existing central `AuditLog`; no new audit store was created. |

## Compatibility rules

1. New Drive uploads always create `MediaFile.storageKey`, checksum, owner, source module, version 1, and `CampusDriveItem.fileId` in one database transaction.
2. Physical resolution always starts from the configured storage root and rejects traversal, null bytes, missing files, directories, and realpath/symlink escape.
3. Historical `MediaFile.path` remains readable through the hardened compatibility resolver when `storageKey` is null.
4. URL-valued historical rows are not automatically rewritten because an HTTP URL cannot be safely assumed to map to the local storage root.
5. Parent-resource files remain accessible only through the parent module or a governed reference whose server callback re-runs parent authorization.
6. Legacy attachment tables are not deleted, bulk-copied, or automatically exposed in Campus Drive.

## Implemented scopes

Cleanly mapped in the current institutional identity model:

- derived owner
- specific user
- active role
- active workspace
- department
- all institution

Programme, year, section, and class principals are deliberately not claimed in Phase 1. Their membership is distributed across student/faculty allocation models and requires a module-specific membership resolver before they can be secure general-purpose ACL principals.
