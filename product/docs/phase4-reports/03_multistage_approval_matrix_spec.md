# Phase 4 – Multistage Approval Matrix Specification Report

## Overview
This document defines sign-off authority, review rules, and escalation tiers for Faculty Leave & OD requests in GEETORUS CAMPUSOS.

---

## Review Tiers & Sign-Off Rules

### Level 1 Tier: Department HOD
- **Actor Role**: `HOD` (matching applicant's `departmentId`).
- **Review Pre-requisite**: Request status `PENDING_HOD`.
- **Validation**: HOD verifies class substitution coverage and departmental workload.
- **Decision Outcomes**:
  - `APPROVE` -> Advances status to `APPROVED_HOD` and forwards to Level 2.
  - `REJECT` -> Changes status to `REJECTED_HOD` and halts process.

### Level 2 Tier: Principal / Acting Principal
- **Actor Role**: `Principal` (or `Vice Principal` when Principal is offline).
- **Review Pre-requisite**: Request status `APPROVED_HOD`.
- **Decision Outcomes**:
  - `APPROVE` -> Changes status to `APPROVED_PRINCIPAL` and grants final sign-off.
  - `REJECT` -> Changes status to `REJECTED_PRINCIPAL` and halts process.
