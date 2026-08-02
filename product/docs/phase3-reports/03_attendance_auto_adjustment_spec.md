# Phase 3 – Attendance Auto-Adjustment Specification Report

## Overview
This document specifies how final HOD approval (`APPROVED_HOD`) triggers automated attendance adjustment for student records across the leave date range in GEETORUS CAMPUSOS.

---

## Auto-Adjustment Logic & Mapping

When a Student Leave/OD request receives final Level 2 HOD approval:
1. `adjustAttendance(request)` executes synchronously within `StudentLeaveService`.
2. The engine iterates from `request.startDate` to `request.endDate` day by day.
3. For each date, it resolves the attendance status mapping:
   - Request Type `ON_DUTY` -> Attendance Status = `ON_DUTY`
   - Request Type `LEAVE` -> Attendance Status = `EXCUSED_LEAVE`
4. Upsert operation:
   - If an `Attendance` record exists for `(studentId, date)`, it updates `status` and attaches `remarks: "Auto-adjusted via ON_DUTY Request (SL-2026-0001)"`.
   - If no record exists, a new `Attendance` record is created.
5. Sets `attendanceUpdated = true` on the `StudentLeaveRequest` model.
