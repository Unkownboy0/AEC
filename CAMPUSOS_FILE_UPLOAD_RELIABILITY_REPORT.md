# CampusOS File Upload Reliability Report

Date: 2026-08-19

## Shared upload path

The client now uses one `prepareFileUpload` helper for profile images and Campus Drive. It checks empty files, MIME policy and size before base64 encoding. All requests travel through the shared Axios client, preserving bearer authentication, refresh behavior, idempotency keys and `X-Active-Role`.

The server now uses one `validateCommonUpload` implementation for Campus Drive and profile media. It performs strict base64 decoding, basename sanitization, extension/MIME agreement, maximum-size checks and magic-byte/content checks before any write.

## Validation matrix

| Input | Outcome | Status |
|---|---|---|
| JPEG with JPEG extension, MIME and signature | Accepted | TEST VERIFIED |
| PNG with PNG extension, MIME and signature | Accepted | TEST VERIFIED |
| WebP with RIFF/WEBP signature | Accepted | TEST VERIFIED |
| JPEG bytes named `.png` | Rejected | TEST VERIFIED |
| Text bytes declared as JPEG | Rejected | TEST VERIFIED |
| Invalid base64 | Rejected | TEST VERIFIED |
| Zero-byte payload | Rejected | STATICALLY VERIFIED |
| Oversized avatar | Rejected | TEST VERIFIED |
| Oversized Drive file | Rejected by client and server limits | STATICALLY VERIFIED |
| Unsupported extension or MIME | Rejected | STATICALLY VERIFIED |
| Folder upload without EDIT authority | Rejected | TEST VERIFIED |
| Department/college scope without authority | Rejected | TEST VERIFIED |

## Persistence guarantees

- Bytes are written under a validated storage root with generated names.
- Database writes for file metadata, version and identity/Drive reference are transactional.
- A failed transaction removes the newly written byte file.
- Profile replacement archives the prior media record; no silent destructive delete occurs.
- Stored identity uses a file ID, never an object URL, data URL or temporary URL.

## Verification

| Check | Status |
|---|---|
| Upload signature and masquerade tests | TEST VERIFIED |
| Governed storage traversal/symlink tests | TEST VERIFIED |
| Authorization write-path scenarios | TEST VERIFIED |
| Production build | BUILD VERIFIED |
| Real multipart proxy/load test | NOT VERIFIED |
| Physical-device camera/gallery upload | NOT VERIFIED |

