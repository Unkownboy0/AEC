# Phase 9 – Rollback Report

## Overview
This document details emergency rollback procedures for Phase 9 analytics routes and schema models.

---

## Rollback Steps
1. Unmount `/api/enterprise/analytics` routes in `src/app.ts`.
2. Remove `AnalyticsKpiDefinition`, `DailyAttendanceSummary`, `AcademicResultSummary`, `SavedReport`, `ReportSchedule` models from `schema.prisma`.
3. Run `npx prisma db push --accept-data-loss`.
