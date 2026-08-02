# Phase 8 – Interactive Timeline Architecture Report

## Overview
This document specifies the unified event aggregation architecture for the Interactive Activity & Audit Timeline in GEETORUS CAMPUSOS.

---

## 1. Timeline Aggregation Pipeline

```mermaid
flowchart TD
    UserQuery[GET /api/enterprise/timeline] --> Svc[InteractiveTimelineService]

    subgraph Data Sources
        Svc --> SL[Student Leave Requests]
        Svc --> FL[Faculty Leave Requests]
        Svc --> CIR[Institutional Circulars]
        Svc --> AUD[Security Audit Logs]
        Svc --> TSK[Work Management Tasks]
    end

    SL --> Format[Unify Schema & Timestamps]
    FL --> Format
    CIR --> Format
    AUD --> Format
    TSK --> Format

    Format --> Sort[Sort Chronologically Descending]
    Sort --> Return[Return Interactive Feed Array]
```

---

## 2. Event Category Matrix

| Category Code | Display Name | Icon Type | Primary Actor |
|---|---|---|---|
| `STUDENT_LEAVE` | Student Leave Request | `Calendar` | Applicant Student |
| `FACULTY_LEAVE` | Faculty Leave Request | `Briefcase` | Applicant Faculty |
| `CIRCULAR` | Institutional Circular | `Bell` | Author / Executive |
| `SECURITY_AUDIT` | Security & Access Log | `Shield` | Target User / IP |
| `TASK` | Work Management Task | `CheckSquare` | Assignee / Creator |
