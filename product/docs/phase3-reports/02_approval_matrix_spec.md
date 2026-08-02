# Phase 3 – Approval Matrix Specification Report

## Overview
This document defines the sign-off authority, review rules, and escalation paths for Student Leave and On-Duty (OD) applications in GEETORUS CAMPUSOS.

---

## Multistage Review Tier Rules

### Level 1 Tier: Assigned Mentor
- **Actor Role**: `Mentor` (Faculty member assigned as student mentor).
- **Scope**: Can only view and review requests submitted by mentees assigned to them via `Student.mentorId`.
- **Review Decision Options**:
  - `APPROVE` -> Advances status to `APPROVED_MENTOR` and alerts HOD.
  - `REJECT` -> Changes status to `REJECTED_MENTOR` and terminates workflow.

### Level 2 Tier: Department HOD
- **Actor Role**: `HOD` (or College Executives: Principal, Vice Principal, Academic Dean).
- **Scope**: Departmental scope matching student's `departmentId`.
- **Pre-requisite**: Request must be in status `APPROVED_MENTOR` (Level 1 endorsed).
- **Review Decision Options**:
  - `APPROVE` -> Changes status to `APPROVED_HOD`, triggers `adjustAttendance()`, alerts Student.
  - `REJECT` -> Changes status to `REJECTED_HOD` and alerts Student.
