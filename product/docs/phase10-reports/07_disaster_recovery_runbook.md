# Phase 10 – Disaster Recovery Runbook

## Overview
This document specifies step-by-step procedures for database restoration and system failover recovery.

---

## Recovery Steps
1. Stop Node server process (`Stop-Process -Name node -Force`).
2. Locate latest healthy snapshot in `prisma/backups/`.
3. Overwrite `prisma/dev.db` with backup snapshot file.
4. Restart application server (`npm run dev`).
5. Execute readiness probe (`GET /api/readiness`) to verify database restoration.
