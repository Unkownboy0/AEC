# Phase 4 – Class Substitution Engine Specification Report

## Overview
This document defines the Class Substitution Engine that manages lecture covering assignments during faculty leave in GEETORUS CAMPUSOS.

---

## Data Structure & Mapping

When a faculty member applies for leave, they specify substitute allocations for scheduled classes during the leave period.

### Substitutions JSON Schema
```json
[
  {
    "subjectId": "SUB_101",
    "sectionId": "SEC_A",
    "substituteFacultyId": "FAC_202",
    "substituteFacultyName": "Dr. Alan Turing",
    "date": "2026-08-01",
    "timeSlot": "09:00 - 10:00 AM"
  }
]
```

---

## Workflow Integration
1. **Application Time**: The applicant faculty selects covering faculty members from their department or program.
2. **Notification Dispatch**: Upon submission, real-time `FACULTY_SUBSTITUTION_REQUESTED` notifications are dispatched to substitute faculty members.
3. **HOD Level 1 Verification**: The HOD inspects substitute assignments to verify class coverage before granting Level 1 approval.
