# Phase 4 – Faculty Leave & OD Workflow Architecture Report

## Executive Summary
This document specifies the multistage approval architecture for **Faculty Leave & On-Duty (OD)** requests in GEETORUS CAMPUSOS.

---

## 1. Multistage Approval Sequence

```mermaid
sequenceDiagram
    participant Faculty as Applicant Faculty
    participant API as Express Leave Engine
    participant Sub as Substitute Faculty
    participant HOD as Department HOD (Level 1)
    participant Exec as Principal / Acting VP (Level 2)

    Faculty->>API: POST /api/enterprise/faculty-leave (Leave/OD + Substitutions)
    API->>API: Create record (Status: PENDING_HOD)
    API->>Sub: Notify requested substitute faculty members
    API->>HOD: Real-time notification dispatched for HOD Level 1 review

    HOD->>API: POST /faculty-leave/:id/hod-review (APPROVE / REJECT)
    alt HOD Rejects
        API->>Faculty: Status: REJECTED_HOD (Process Terminates)
    else HOD Approves
        API->>API: Check PRINCIPAL_OFFLINE_MODE setting
        alt Principal is Offline
            API->>Exec: Delegate Level 2 sign-off to Vice Principal (Acting Principal)
        else Principal is Online
            API->>Exec: Notify Principal for Level 2 sign-off
        end
        API->>API: Status: APPROVED_HOD
    end

    Exec->>API: POST /faculty-leave/:id/principal-review (APPROVE / REJECT)
    alt Level 2 Rejects
        API->>Faculty: Status: REJECTED_PRINCIPAL (Process Terminates)
    else Level 2 Approves
        API->>API: Status: APPROVED_PRINCIPAL
        API->>Faculty: Final Approval Notification Dispatched
    end
```

---

## 2. Status Lifecycle Matrix

| Status | Stage | Actor | Description |
|---|---|---|---|
| `PENDING_HOD` | Initial Submission | Faculty | Submitted with substitute allocations, awaiting Level 1 HOD review |
| `APPROVED_HOD` | Level 1 Endorsed | HOD | Endorsed by HOD, forwarded to Principal (or Acting Principal) |
| `REJECTED_HOD` | Level 1 Rejected | HOD | Rejected by HOD, process halted |
| `APPROVED_PRINCIPAL` | Level 2 Final Approval | Principal / VP | Approved by Principal or Acting Principal |
| `REJECTED_PRINCIPAL` | Level 2 Rejected | Principal / VP | Rejected by Principal or Acting Principal |
