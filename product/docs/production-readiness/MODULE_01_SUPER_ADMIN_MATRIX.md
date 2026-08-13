# Module 01 — Super Admin Control Centre

Status values: VERIFIED, IMPLEMENTED, PARTIAL, BLOCKED.

| Area | Existing reuse | Current status | Evidence / next dependency |
|---|---|---|---|
| Control-centre dashboard | Live dashboard and directory metrics | VERIFIED | `/admin/dashboard`, `/dashboard/stats`, `/users/directory-stats` |
| User directory | Users service, linked Student/Faculty provisioning, CSV/XLSX preview and commit | IMPLEMENTED | Real import replaces simulated success; validates references/duplicates, creates identity + linked profile + roles/workspaces transactionally per row, and produces a one-time success/error report |
| Credential lifecycle | Credential generator, reset, regenerate and unlock APIs | PARTIAL | Imported credentials are generated securely, hashed, forced to change and exposed once in the admin report; activation delivery still needs configured email |
| Roles and permissions | Roles, matrix, templates and IAM APIs/UI | PARTIAL | RBAC exists; full resource/tenant ABAC matrix remains |
| Academic structure | Academic year, department, program, course, semester, section and subject APIs | PARTIAL | Existing services reused; tenant ownership is not yet universal |
| Governed configuration | SystemSetting persistence and audit log | IMPLEMENTED | Strict catalog, validation, impact preview, transactional audited update, real UI |
| Module flags | Catalog-backed IQAC/timetable flags | IMPLEMENTED | Visibility consumers must be connected after database recovery |
| Security policy | Short token policy and privileged MFA flag | PARTIAL | MFA flag cannot be enabled operationally until a real MFA provider exists |
| Workflow governance | Workflow requests, approval centre and governance surfaces | PARTIAL | Configurable workflow definition/builder remains a downstream dependency |
| Backup/restore | PostgreSQL dump controller and archive validation | BLOCKED | `pg_dump`/`pg_restore` are absent; real restore drill required |
| Audit | User activity log used by sensitive changes | PARTIAL | Configuration captures old/new values; immutable tenant-aware audit model remains |
| Tenant configuration | No canonical tenant entity found | BLOCKED | Requires a backward-compatible tenant migration after database baseline/backup |

## Dependency-impact behavior

Super Admin configuration changes now require server validation and a preview step. The UI shows affected modules before commit. Unknown keys—including JWT/database secrets—are rejected. Updates are transactional and audit the previous and new values.

## Privacy boundary

Super Admin governance routes require explicit permissions. Governance does not grant implicit operational access to student, finance, COE or other private module data.

## Provisioning contract

Imports accept CSV or XLSX files up to 5 MB and 1,000 rows. They use an explicit `profileType` (`STUDENT`, `EMPLOYEE`, or `ACCOUNT_ONLY`) and never infer a fallback role, department, program, course, semester, or section. The preview is read-only. Commit re-parses and re-validates the file, creates each complete identity/profile assignment in a transaction, and reports row-level failures without leaving a partially created row.

Workspace assignments are role-backed: `workspaceRoles` contains active role names separated by `;` or `|`. Unknown roles and unknown academic references block commit. Temporary passwords are not logged or persisted in plaintext.
