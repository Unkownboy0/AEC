# Phase 6 – Read Tracking & Analytics Schema Report

## Overview
This document defines the schema and data models supporting circular read receipt tracking and reach analytics.

---

## Data Models

### `institutional_circulars` Table
- `id` (UUID, PK)
- `circularNumber` (String, Unique) — e.g. `CIR-2026-0001`
- `title` (String)
- `content` (Text)
- `broadcastLevel` (String) — `ALL_CAMPUS`, `FACULTY_ONLY`, `STUDENT_ONLY`, `DEPARTMENT_SPECIFIC`
- `departmentId` (UUID, FK -> departments.id)
- `authorId` (UUID, FK -> users.id)
- `attachmentUrl` (String, Optional)
- `publishedAt` (Timestamp)

### `circular_read_receipts` Table
- `id` (UUID, PK)
- `circularId` (UUID, FK -> institutional_circulars.id)
- `userId` (UUID, FK -> users.id)
- `readAt` (Timestamp)
- Unique Constraint on `(circularId, userId)`

---

## Analytics Calculation
- `readCount`: Count of read receipts for `circularId`.
- `totalAudience`: Total count of active users in target broadcast scope.
- `readPercentage`: `(readCount / totalAudience) * 100`.
