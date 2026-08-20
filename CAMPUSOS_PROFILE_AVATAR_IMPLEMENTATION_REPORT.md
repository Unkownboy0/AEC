# CampusOS Profile Avatar Implementation Report

Date: 2026-08-19

## Implemented architecture

- `User.profileImageFileId` references the existing governed `MediaFile` object.
- Avatar binaries use non-public `profiles/<userId>/<uuid>.<ext>` storage keys.
- Immutable `GovernedFileVersion` metadata records checksum, size, MIME and creator.
- New avatar writes clear the legacy `profilePhoto` string and archive the previous media object without destructive byte deletion.
- `GET /api/users/:id/avatar` requires authentication and returns only image bytes, not profile fields.
- `PUT /api/users/profile/avatar` and `DELETE /api/users/profile/avatar` are self-service identity endpoints with audit records.
- `/auth/me`, login and workspace switch return `profileImage { fileId, url, thumbnailUrl, version }`.
- The version query is derived from SHA-256, not a temporary URL or current timestamp.

## Client behavior

The shared `ProfileAvatar` accepts a person, file ID, gender, name, size and shape. It fetches protected image bytes through the authenticated shared HTTP client, creates only an ephemeral in-memory object URL, and revokes it on cleanup.

Fallback order is:

1. Canonical real image.
2. Centrally managed professional gender default.
3. Stable initials.

The profile page implements select, validated upload, transactional save, immediate current-profile refresh, updated confirmation and remove. No full-page reload is required.

## Gender governance

Accepted values are `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`, and `UNSPECIFIED`. Aliases and historic case variants normalize at server boundaries. Self-service and authorized user-management updates synchronize User and linked Student/Faculty records and write activity audits.

## Security and privacy

| Control | Status |
|---|---|
| Auth required for avatar bytes | IMPLEMENTED |
| Avatar endpoint exposes no private profile fields | IMPLEMENTED |
| Public legacy file-content routes require auth | IMPLEMENTED |
| MIME allowlist and extension/MIME agreement | IMPLEMENTED |
| JPEG/PNG/WebP content-signature verification | IMPLEMENTED |
| 5 MB avatar limit and zero-byte rejection | IMPLEMENTED |
| Path containment and UUID storage names | IMPLEMENTED |
| Upload/remove audit trail | IMPLEMENTED |
| Stable private caching with ETag | IMPLEMENTED |
| Physical-device privacy inspection | NOT VERIFIED |

## Verification

| Check | Status |
|---|---|
| Profile media validation test | TEST VERIFIED |
| Gender normalization test | TEST VERIFIED |
| Deterministic descriptor test | TEST VERIFIED |
| Server TypeScript build | BUILD VERIFIED |
| Client TypeScript/Vite build | BUILD VERIFIED |
| Android debug assembly | BUILD VERIFIED |
| Physical device upload/display | NOT VERIFIED |

