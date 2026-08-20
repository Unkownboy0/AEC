# GEETORUS CAMPUSOS — TIMETABLE & FACULTY WORKLOAD REPORT
**Module**: HOD Timetable Management, Faculty Allocation & Live Workload Intelligence  
**Date**: August 19, 2026  
**Status**: BUILD VERIFIED  

---

## 1. Executive Summary

The Head of Department (HOD) Timetable Management module (`HodTimetableControlCenter.tsx`) manages departmental bell schedules using the single canonical timetable model. No duplicate timetable schemas or parallel tables were created.

---

## 2. HOD Timetable Editor Features

### 2.1 Interactive Period Editing
- **Entry Points**: Click any assigned period card or empty `+ Free Slot` cell in the Master Matrix.
- **Form Controls**:
  - Class / Section selector (`VII IT-A`, `V IT-A`, `III IT-A`)
  - Course Code & Title selector
  - Venue / Room / Lab Room assignment
  - Laboratory Practical toggle (allocates technical staff & lab resources)

### 2.2 Live Faculty Workload Context
When allocating faculty to a slot, the selector displays real-time operational context:
- **Faculty Name & Employee ID**
- **Home Department** vs **Teaching Departments** (Cross-Department visiting faculty badges)
- **Allocated Hours vs Target Workload** (e.g., `18 / 22 hrs allocated`)
- **Real-Time Free/Busy Status Badge**:
  - `AVAILABLE` (Free in selected period)
  - `BUSY / CONFLICT` (Currently assigned to another section or duty)
  - `ON LEAVE` / `ON OD` (Approved leave in workflow engine)
  - `EXAM DUTY` / `MEETING` (Scheduled conflict)

### 2.3 Automated Conflict Prevention
Before saving or publishing:
- Checks if the selected faculty is already assigned in another class/section for that specific day & period.
- Checks if the room or lab is already booked.
- Validates leave/OD status.
- Displays prominent conflict warning banners and prevents silent corrupted saves.

---

## 3. Cross-Department Faculty Allocation Architecture

Faculty members have a primary **Home Department** and can be assigned to multiple **Teaching Departments** (e.g., IT faculty teaching AI&DS courses).
- HODs see both Home Faculty and Cross-Department Faculty in their allocation roster.
- Cross-department assignments do not transfer the faculty's home department record.
- Workload hours aggregate across all teaching departments automatically.

---

## 4. Workload Roster & Official Print Export
- **Tab**: `Faculty Workload Roster`
- Displays individual theory, lab, tutorial, and mentoring hours.
- Direct PDF / Print export generates the canonical institutional workload chart formatted for statutory and AICTE / NBA inspection compliance.

---

## 5. Verification Status
- **Canonical Model Integrity**: STATICALLY VERIFIED
- **Conflict Detection Engine**: TEST VERIFIED
- **UI & Modal Workflow**: BUILD VERIFIED
