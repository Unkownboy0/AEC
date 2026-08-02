# Phase 3 – Student Leave & OD Workflow Architecture Report

## Executive Summary
This document specifies the multistage approval architecture for **Student Leave & On-Duty (OD)** requests in GEETORUS CAMPUSOS.

---

## 1. Multistage Approval Sequence

```mermaid
sequenceDiagram
    participant Student
    participant API as Express Leave Engine
    participant Mentor as Mentor (Level 1)
    participant HOD as Department HOD (Level 2)
    participant Attn as Attendance DB Table

    Student->>API: POST /api/enterprise/student-leave (LEAVE / ON_DUTY)
    API->>API: Create record (Status: PENDING_MENTOR)
    API->>Mentor: Real-time notification dispatched

    Mentor->>API: POST /student-leave/:id/mentor-review (APPROVE / REJECT)
    alt Mentor Rejects
        API->>Student: Status: REJECTED_MENTOR (Process Terminates)
    else Mentor Approves
        API->>API: Status: APPROVED_MENTOR
        API->>HOD: Real-time notification dispatched to HOD
    end

    HOD->>API: POST /student-leave/:id/hod-review (APPROVE / REJECT)
    alt HOD Rejects
        API->>Student: Status: REJECTED_HOD (Process Terminates)
    else HOD Approves
        API->>API: Status: APPROVED_HOD
        API->>Attn: Auto-adjust daily attendance to ON_DUTY or EXCUSED_LEAVE
        API->>Student: Final Approval Notification Dispatched
    end
```

---

## 2. Status Lifecycle Matrix

| Status | Stage | Actor | Description |
|---|---|---|---|
| `PENDING_MENTOR` | Initial Submission | Student | Submitted, awaiting Level 1 Mentor review |
| `APPROVED_MENTOR` | Level 1 Endorsed | Mentor | Endorsed by Mentor, forwarded to HOD for final sign-off |
| `REJECTED_MENTOR` | Level 1 Rejected | Mentor | Rejected by Mentor, process halted |
| `APPROVED_HOD` | Level 2 Final Approval | HOD | Approved by HOD, triggers automatic attendance adjustment |
| `REJECTED_HOD` | Level 2 Rejected | HOD | Rejected by HOD, process halted |
