-- Align the live PostgreSQL table with the PrincipalDelegation Prisma model.
-- Idempotent so it is safe to run against databases that already contain the field.
ALTER TABLE "principal_delegations"
ADD COLUMN IF NOT EXISTS "delegatedScope" TEXT NOT NULL DEFAULT '{}';

ALTER TABLE "principal_delegations"
ADD COLUMN IF NOT EXISTS "financialThreshold" DOUBLE PRECISION;
