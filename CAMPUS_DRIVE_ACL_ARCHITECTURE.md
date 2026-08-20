# Campus Drive ACL architecture

Status date: 2026-08-19

## Architectural boundary

The implementation extends the existing storage and identity foundations:

```text
Bearer token + X-Active-Role
        │
        ▼
requireAuth / assigned active workspace
        │
        ▼
MODULE_CAMPUS_WORKSPACE_ENABLED
        │
        ▼
GovernedFileService.authorizeFileAccess
        │
        ├── owner
        ├── direct file grant
        ├── direct Drive-item grant
        ├── inherited ancestor-folder grant
        └── registered authoritative parent-resource callback
        │
        ▼
storage-root-confined stream / authorized metadata result
```

There is no client-side authorization fallback. Drive list, shared-with-me, recent, search, and picker endpoints filter candidates through the same service used by downloads.

## Object boundaries

### Canonical binary

`MediaFile` is the canonical file identity. New governed records contain:

- `id` (`fileId` at API boundaries)
- `storageKey`
- `originalName`
- `safeName`
- `mimeType`
- `fileSize`
- SHA-256 `checksum`
- `ownerUserId`
- `createdByUserId`
- `sourceModule`
- lifecycle timestamps
- current version number

`path` remains a legacy compatibility field and is never the authorization identity.

### Logical Drive item

`CampusDriveItem` represents organization and presentation:

- folder (`isFolder=true`)
- file reference (`fileId`)
- native Workspace document reference (`documentId`)
- parent folder, owner, department, scope, star and trash state

Moving a Drive item updates its parent only. It does not copy or rename stored bytes.

### Reusable module reference

`GovernedFileReference` attaches one `fileId` to a module/resource/purpose. Its uniqueness key prevents duplicate logical attachments for the same purpose. `authorizationMode` is explicit:

- `FILE_ACL`: the governed file ACL remains authoritative.
- `PARENT_RESOURCE`: the parent module must authorize the requesting user on every access.

Tasks use the second mode. The opaque reference ID selects the server-side parent rule; it does not itself grant access.

## Permission evaluation

### Levels

| Grant level | VIEW | DOWNLOAD | COMMENT | EDIT | MANAGE |
|---|---:|---:|---:|---:|---:|
| VIEW | Yes | No | No | No | No |
| DOWNLOAD | Yes | Yes | No | No | No |
| COMMENT | Yes | No | Yes | No | No |
| EDIT | Yes | Yes | Yes | Yes | No |
| MANAGE | Yes | Yes | Yes | Yes | Yes |

VIEW never implies EDIT. COMMENT does not implicitly permit byte download.

### Deterministic order

1. Authentication and active workspace/role assignment are validated by existing middleware.
2. The file must exist and must not be lifecycle-deleted for ordinary actions.
3. File owner or matching Drive-item owner receives MANAGE-equivalent access.
4. Active direct file grants are evaluated.
5. Active grants on the selected Drive item are evaluated.
6. Ancestor folders are traversed from nearest parent upward, with a 32-level safety bound and cycle detection; any matching active grant may authorize the action.
7. A caller-supplied server callback may authorize an exact `PARENT_RESOURCE` reference.
8. Otherwise access is denied.

There is no deny row in Phase 1. Revocation and expiry make a grant inactive. A later explicit-deny design must define precedence before it is added; no ambiguous deny behavior is claimed now.

### Principals

Implemented:

- `SPECIFIC_USER` → exact user ID
- `ROLE` → normalized active role from `X-Active-Role`
- `WORKSPACE` → active workspace, falling back to the active role identifier
- `DEPARTMENT` → current user's department ID
- `ALL_INSTITUTION` → any authenticated institutional user
- owner → derived, never stored as a mutable grant

Not implemented as general grants: programme, year, section, class. These require trustworthy membership resolvers spanning student, faculty allocation, adviser, and timetable models.

## Inheritance

Only Drive folder/item ancestry participates in generic inheritance. A folder grant is inherited by descendants. File grants do not flow to unrelated Drive items that happen to have similar names. Moving a file changes its inherited ancestor set immediately.

The service rejects:

- self-parenting
- moving a folder into one of its descendants
- parent chains with a detected cycle
- parent chains beyond the configured safety traversal

## Parent-resource authorization

Generic Drive visibility never replaces these boundaries:

| Resource | Required authority |
|---|---|
| Task attachment | Task creator or assigned user; implemented for governed Task references |
| Assignment material | Faculty/class/enrolment resolver; adapter not claimed in Phase 1 |
| Student submission | Submitting student and authorized evaluator; adapter not claimed |
| Receipt | Student, linked parent, and authorized finance roles; existing module endpoint remains authoritative |
| Hall ticket | Owning student and authorized COE roles; existing endpoint remains authoritative |
| IQAC evidence | Audit/department/evidence workflow; existing IQAC endpoint remains authoritative |

The service accepts a callback only from server code. The browser cannot send a boolean claiming parent authorization.

## Storage and download security

- Canonical keys are storage-root-relative.
- Absolute Windows/Linux paths, URLs, null bytes, `..` components, directories, and missing files are rejected as canonical keys.
- `path.resolve`, `path.relative`, and `realpath` confinement prevent traversal and symlink escape.
- Governed downloads require Bearer authentication and the active role header already added by the API client.
- Responses retain safe MIME, exact `Content-Length`, sanitized RFC-compatible `Content-Disposition`, `nosniff`, and private no-store caching.
- Public inline `/content` refuses Drive/governed module binaries; only approved legacy/media-library sources remain eligible.
- Android Open, Save, and Share continue through the existing authenticated native download adapter.

## Lifecycle

- Trash/restore updates the logical Drive item and is audited.
- Permanent-delete authorization requires MANAGE.
- Active module references or other Drive items block permanent delete.
- An authorized unreferenced delete removes the Drive item and marks the canonical object deleted; physical bytes enter retention quarantine rather than being immediately unlinked.
- Version 1 is immutable metadata. Native Campus Docs keep their existing JSON snapshot history; binary history is separate by design.

## Audit and notification

The implementation reuses `AuditService`/`AuditLog` for upload, download, create folder, update, move, trash, restore, share, revoke, attach reference, and retention delete. Existing specialized business audit tables remain untouched.

Direct user shares use `NotificationService.sendNotification` with a Drive deep link. Role, department, workspace, and institution shares do not generate per-user notification fan-out.

## API surface

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/workspace/drive/items` | ACL-filtered folder/list/search/trash view |
| POST | `/api/workspace/drive/items` | Authorized folder creation |
| PATCH | `/api/workspace/drive/items/:id` | Rename, move, star, trash, restore |
| POST | `/api/workspace/drive/items/:itemId/share` | Folder grant with descendant inheritance |
| DELETE | `/api/workspace/drive/items/:itemId/shares/:grantId` | Revoke folder grant |
| GET | `/api/workspace/drive/files/picker` | ACL-filtered Drive/Recent/Shared/Search picker results |
| POST | `/api/workspace/drive/files/upload` | Canonical upload + version + Drive item transaction |
| POST | `/api/workspace/drive/files/:fileId/share` | Direct file/item grant |
| DELETE | `/api/workspace/drive/files/:fileId/shares/:grantId` | Revoke file grant |
| POST | `/api/workspace/drive/files/:fileId/references` | Reuse the file in a module without byte copying |
| DELETE | `/api/workspace/drive/files/:fileId/items/:itemId/permanent` | Reference-aware retention delete |
| GET | `/api/files/:fileId/download` | Canonical authorized byte delivery |

All Workspace routes remain behind `MODULE_CAMPUS_WORKSPACE_ENABLED`; the app catalog remains available to hide disabled modules cleanly.
