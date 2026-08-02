# Phase 8 – Rollback Report

## Overview
This document details emergency rollback procedures for Phase 8 endpoints and schema additions.

---

## Rollback Steps
1. Unmount `/api/enterprise` export routes in `src/app.ts`.
2. Remove `DigitalIdCard`, `ProfileChangeRequest`, `ExportJob`, `DocumentDownloadAudit` models from `schema.prisma`.
3. Run `npx prisma db push --accept-data-loss`.
