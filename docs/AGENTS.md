# CampusOS Repository Rules

- Existing product; never rebuild from scratch.
- Current working tree is the baseline.
- One Identity → Multiple Roles → Multiple Workspaces.
- Reuse existing canonical engines for auth, permission, workflow, notification,
  timetable, files and audit.
- Never duplicate institutional data.
- Never weaken server-side authorization to make UI work.
- No fake production data.
- Preserve historical/effective-dated institutional records.
- For every change run relevant typecheck/tests/build.
- Never claim TEST VERIFIED or PHYSICAL DEVICE VERIFIED without evidence.
- Read docs/CAMPUSOS_MASTER_PRODUCT_SPEC.md when product context is required.