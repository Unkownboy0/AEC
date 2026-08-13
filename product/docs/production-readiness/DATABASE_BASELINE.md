# CampusOS database baseline and safe recovery

Status: BLOCKED before live mutation

## Confirmed state — 2026-08-12

- Database engine: PostgreSQL.
- `_prisma_migrations` does not exist.
- No `iqac_%` tables exist.
- `timetable_slots` does not exist.
- The Prisma schema already defines the IQAC and timetable entities.
- The repository contains a canonical PostgreSQL IQAC migration.
- The older migration containing `timetable_slots` uses SQLite-style `DATETIME` and must not be replayed on PostgreSQL.
- `pg_dump` and `pg_restore` are not installed or discoverable on this host.

## Mandatory prerequisites

1. Install matching PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`).
2. Create a custom-format backup outside the application storage root.
3. Validate the archive with `pg_restore --list`.
4. Restore into a new isolated database.
5. Point a temporary test environment at the clone only.
6. Compare the cloned live schema with `prisma/schema.prisma` and every migration.
7. Record which historical migrations are already represented structurally.

## Baseline procedure on the isolated clone

1. Do not use `prisma migrate reset`.
2. Create the Prisma migration ledger using `prisma migrate resolve --applied <migration>` only after structural equivalence is proven for that migration.
3. Do not mark `20260807170000_add_iqac_audits` applied until the IQAC tables exist.
4. Do not mark the legacy SQLite-style timetable migration applied solely to obtain `timetable_slots`; its other structures require individual equivalence review.
5. Apply `prisma/manual-migrations/20260812_recover_iqac_timetable_postgresql.sql` to the clone.
6. Run foreign-key, unique-index and orphan checks.
7. Run Prisma validation, server tests, IQAC API tests and timetable conflict tests.
8. Perform an application smoke test against the clone.
9. Take a second backup and complete a restore drill.

## Production application gate

Apply the repair to the live database only after the clone passes every check, during an approved maintenance window, with a verified pre-change backup and rollback owner.

## Prohibited actions

- No database reset.
- No blind replay of all migrations.
- No live schema push.
- No migration-ledger fabrication without structural comparison.
- No claim of backup PASS based only on archive creation or listing.
