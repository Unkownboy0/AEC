# Security recovery — 2026-08-12

## Implemented

- Removed `product/server/.env` from Git tracking without deleting the local file.
- Expanded environment ignore rules while preserving `.env.example`.
- Replaced ten-year access tokens with configurable 15-minute access tokens.
- Replaced ten-year refresh sessions with configurable 7-day or 30-day lifetimes.
- Enforced maximum JWT ages so previously issued ten-year tokens are rejected.
- Rotated refresh tokens while never extending beyond their remaining bounded session lifetime.
- Made password-reset responses identical for existing and unknown accounts.
- Removed password-reset tokens from API responses, UI, and logs.
- Store only a SHA-256 reset-token digest with a default 15-minute validity.
- Restricted enterprise bulk operations to Super Admin and College Admin workspaces.
- Replaced destructive complaint deletion with authorized soft archival.
- Restricted sports team, tournament, equipment and achievement writes to sports governance roles.
- Changed ordinary sports booking creation from automatically approved to pending.
- Added Zod request validation for sports writes.
- Added negative policy regression tests.

## External actions required

The repository cannot rotate credentials used by external infrastructure without the authorized replacement values. Before production deployment:

1. Rotate the PostgreSQL password.
2. Generate and deploy a new random JWT signing secret of at least 32 bytes.
3. Rotate payment, SMTP, push, object-storage and other integration credentials if they ever appeared in repository history.
4. Revoke all existing sessions after deploying the new signing secret.
5. Purge old secrets from Git history using an approved coordinated history rewrite.
6. Configure and verify a real transactional email provider before marking password reset PASS.

## Release status

WARNING — confirmed repository and authorization defects in this recovery slice are fixed, but production security cannot be marked PASS until external secret rotation, database session revocation, endpoint-wide authorization review, and production email verification are completed.

## Verification

- Server unit and security tests: PASS
- Server TypeScript no-emit verification: PASS
- Client TypeScript and Vite production build: PASS
- Server emit build initially passed; a later repeat emit was blocked by Windows locks on the actively served `dist/app.js` files
