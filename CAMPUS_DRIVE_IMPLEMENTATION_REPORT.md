# Campus Drive Phase 1 implementation report

Status date: 2026-08-19

## Outcome

| Requirement | Status | Evidence |
|---|---|---|
| One canonical file identity | IMPLEMENTED | Existing `MediaFile` adapted with `fileId` + `storageKey`; legacy `path` retained |
| Drive item separated from binary | IMPLEMENTED | `CampusDriveItem.fileId` references `MediaFile`; moves/attachments do not copy bytes |
| Central governed authorization | IMPLEMENTED | `GovernedFileService.authorizeFileAccess` |
| Explicit non-escalating ACL levels | TEST VERIFIED | New governed-file policy unit test |
| Direct user/role/workspace/department/institution principals | IMPLEMENTED | Explicit grant rows and actor matching |
| Owner and deterministic folder inheritance | IMPLEMENTED | Derived owner plus bounded ancestor traversal |
| Expiry and revocation | TEST VERIFIED | Policy unit test and revoke endpoints |
| Parent-resource authority | IMPLEMENTED for Tasks | Opaque reference + server Task creator/assignee callback |
| ACL-aware Drive list/search/shared/recent | IMPLEMENTED | Server-authorized candidate filtering |
| Unified Upload/Drive/Recent/Shared/Search picker | BUILD VERIFIED | Reusable Radix dialog and governed APIs |
| Caller MIME/size/single-multiple/action/purpose constraints | BUILD VERIFIED | Picker contract and server upload validation |
| Attach existing Drive file without copying | BUILD VERIFIED | HOD Task attachment integration stores governed reference |
| SHA-256 checksum | IMPLEMENTED | Calculated on new canonical upload |
| Versioning foundation | IMPLEMENTED | Immutable `GovernedFileVersion` version 1; native Workspace versions preserved |
| Trash/restore/reference-aware delete | IMPLEMENTED | Audited item lifecycle; references block delete; binary retention quarantine |
| Existing audit/notification reuse | BUILD VERIFIED | `AuditService` and `NotificationService`, no parallel stores |
| Hardened authenticated download | BUILD VERIFIED | Canonical ACL added without removing root confinement/headers/native adapter |
| Global existing-logo watermark | BUILD VERIFIED | Existing branding asset/context and shared AppShell component reused |
| Student minimal launcher | TEST VERIFIED | Exactly Drive, Classroom, Calendar when relevant flags are enabled |
| Prisma schema and migration structure | TEST VERIFIED | Prisma validate plus migration reproducibility test |
| Production database migration | BLOCKED / NOT VERIFIED | No production deployment was authorized or attempted |
| Physical Android/iOS behavior | BLOCKED / NOT VERIFIED | No real device was operated |

## Implemented behavior

### Server

- New governed Drive uploads validate extension/MIME/size, randomize stored names, calculate SHA-256, create storage-root-relative keys, create immutable version 1, and create the logical Drive item in one database transaction.
- Direct file and folder grants support VIEW, DOWNLOAD, COMMENT, EDIT, and MANAGE without VIEW→EDIT escalation.
- Folder grants inherit to descendants at request time. Moves immediately change the inherited permission set.
- Shared-with-me, search, Recent, Drive listing, and picker results serialize only after authorization.
- Direct user shares create one existing-system notification. All grant/lifecycle/file operations write the existing central audit log.
- Governed downloads use the hardened file response and preserve Android-compatible authenticated URLs.
- Task references append an opaque reference ID. The server rechecks Task creator/assignee membership; possession of the reference ID alone is insufficient.
- The public inline media endpoint refuses governed module binaries.
- Delete is reference-aware. The physical binary is quarantined after authorized logical deletion rather than immediately unlinked.

### Client

- `GovernedFilePicker` provides only implemented sources: Upload, Campus Drive, Recent, Shared with me, and Search.
- It supports allowed MIME types, size ceiling, single/multiple selection, VIEW/DOWNLOAD requirement, and an attachment purpose.
- The HOD task workflow can upload a new governed file or select an existing Drive file; the existing file is attached by `fileId` reference.
- Campus Drive search is server-side and ACL-aware, not a client-only filename filter.
- Campus Drive has responsive mobile scope navigation, upload, list/grid views, and existing Android Open/Save/Share actions.
- The global watermark remains one shared AppShell layer using the existing institution branding logo. Opacity is clamped to light 3–5% and dark 2–4%; the layer is non-interactive and behind page/modal content.
- Student suite catalog is reduced to Drive, Classroom, and the now-registered real Student Calendar route. Meet and AI are hidden.

## Database migration and compatibility

Committed migration: `product/server/prisma/migrations/20260819090000_governed_file_acl/migration.sql`.

The migration is additive:

- extends `media_files`
- adds `campus_drive_items.fileId`
- adds grants, references, and governed versions
- preserves all existing rows and legacy fields
- backfills only deterministic non-URL storage paths
- does not run `prisma db push`

URL-valued historical paths are intentionally left unresolved. Existing receipts, certificates, evidence, reports, and attachment routes remain unchanged and are not automatically exposed in Drive.

## Files changed in this phase

### Server and database

- `product/server/prisma/schema.prisma`
- `product/server/prisma/migrations/20260819090000_governed_file_acl/migration.sql`
- `product/server/src/modules/campus-workspace/governed-file.policy.ts`
- `product/server/src/modules/campus-workspace/governed-file.service.ts`
- `product/server/src/modules/campus-workspace/workspace.controller.ts`
- `product/server/src/modules/campus-workspace/workspace.routes.ts`
- `product/server/src/modules/campus-workspace/campus-suite.catalog.ts`
- `product/server/src/modules/files/files.controller.ts`
- `product/server/src/modules/files/files.routes.ts`
- `product/server/src/__tests__/governed_file_policy.test.ts`
- `product/server/src/__tests__/governed_file_storage_security.test.ts`
- `product/server/src/__tests__/campus_suite_catalog.test.ts`
- `product/server/package.json`

### Client

- `product/client/src/components/workspace/GovernedFilePicker.tsx`
- `product/client/src/services/workspace.api.ts`
- `product/client/src/pages/workspace/CampusDrivePage.tsx`
- `product/client/src/modules/hod/pages/HodTasksPage.tsx`
- `product/client/src/components/shared/InstitutionalWatermark.tsx`
- `product/client/src/layouts/AppShell.tsx`
- `product/client/src/routes/Router.tsx`

### Required evidence documents

- `CAMPUS_DRIVE_FILE_MODEL_AUDIT.md`
- `CAMPUS_DRIVE_ACL_ARCHITECTURE.md`
- `CAMPUS_DRIVE_SECURITY_MATRIX.md`
- `CAMPUS_DRIVE_IMPLEMENTATION_REPORT.md`
- `CAMPUSOS_ROLE_APPLICATION_MATRIX.md`
- `CAMPUSOS_9AM_DEMO_READINESS_REPORT.md`

## Verification executed

| Command / check | Result |
|---|---|
| `npx prisma validate` | TEST VERIFIED — valid schema |
| `npx prisma generate` | TEST VERIFIED — Prisma Client generated |
| Server `npm run build` | BUILD VERIFIED |
| Client `npm run build` | BUILD VERIFIED — TypeScript and Vite production build passed |
| Server `npm run test` | TEST VERIFIED — unit and security suites passed |
| `campus_suite_catalog.test.ts` route registration audit | TEST VERIFIED — all visible routes found in Router |
| `governed_file_policy.test.ts` | TEST VERIFIED — levels, principals, expiry and revocation passed |
| `governed_file_storage_security.test.ts` | TEST VERIFIED — valid key, traversal, absolute path, null-byte and junction/symlink escape boundaries passed |
| Server `npm run test:e2e` | TEST VERIFIED — all existing end-to-end simulations passed |
| Migration reproducibility test | TEST VERIFIED — two valid timestamped migrations found |
| Server `npm run test:smoke` | TEST VERIFIED — 45/45 checks passed |
| Fresh PostgreSQL `prisma migrate deploy` | BLOCKED / NOT VERIFIED — no isolated database target supplied |
| Authenticated seeded browser tap-through | BLOCKED / NOT VERIFIED — no running authenticated demo environment supplied |
| Android Capacitor sync | BUILD VERIFIED — 13 plugins synchronized and final `dist` assets copied |
| Android Gradle `assembleDebug` | BUILD VERIFIED — `BUILD SUCCESSFUL`, 457 tasks |
| Debug APK | BUILD VERIFIED — `product/client/android/app/build/outputs/apk/debug/app-debug.apk`, 20,160,494 bytes, SHA-256 `8DF547ABC8F3C13DF3FAC98FB3F35F16AF96281D979E378AEED6EF3FC9276DFA` |
| Physical Android/iOS device | BLOCKED / NOT VERIFIED |

## Known limits retained intentionally

- Programme/year/section/class generic principals are not implemented until membership resolvers can be centralized safely.
- Parent-resource adapters other than Task are not claimed; their existing module endpoints remain authoritative.
- Binary version metadata is present and initial uploads are immutable, but a general replace/version-upload UI is not introduced in this phase.
- Per-user star state is not redesigned; the existing Drive item flag remains.
- Permanent delete uses retention quarantine. A retention worker and legal policy are outside Phase 1.
- No Mail, WebRTC Meet, Whiteboard, Sites, or AI work was started.
