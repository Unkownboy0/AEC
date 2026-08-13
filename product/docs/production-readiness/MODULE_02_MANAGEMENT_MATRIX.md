# Module 02 — Management / Governing Body

Status values: VERIFIED, IMPLEMENTED, PARTIAL, BLOCKED.

| Area | Authoritative source | Status | Notes |
|---|---|---|---|
| Institution strength | Student, Faculty, User and Department masters | IMPLEMENTED | Active counts; no duplicate management tables |
| Department KPIs | Student, Faculty, Attendance, Mark, FeeBill and PlacementRecord | IMPLEMENTED | Institution comparison plus server-side department scope |
| Attendance trend | Attendance | IMPLEMENTED | Equal-period comparison and weekly series |
| Academic performance | Published Mark records | IMPLEMENTED | Published GPA only; draft marks are excluded |
| Admissions | AdmissionApplication | IMPLEMENTED | Application, confirmation and conversion indicators |
| Fees | FeeBill | IMPLEMENTED | Cumulative payable, collected and outstanding position; period demand comparison |
| Placement | PlacementRecord joined by authoritative student admission number | IMPLEMENTED | Placed students, recruiters and average package |
| Research | Faculty profile publication/patent/book records | PARTIAL | Uses current authoritative profile fields; a dedicated verified research registry remains a future source dependency |
| Accreditation | IQAC audit models | IMPLEMENTED / DEPLOYMENT BLOCKED | Gracefully reports unavailable until the prepared IQAC migration is applied |
| Staff development | Faculty profile certifications | PARTIAL | Dedicated HR training-event ledger does not yet exist |
| Grievances and alerts | Ticket and WorkflowRequest | IMPLEMENTED | High-level counts by default; identifiable grievance rows require report-read scope |
| Strategic export | Same dashboard projection | IMPLEMENTED | Audited CSV export; no client-side recomputation |
| Performance | Concurrent selective queries and 60-second scoped cache | IMPLEMENTED | Cache key includes period, department and detail entitlement |
| Mobile executive view | Responsive Management Workspace | IMPLEMENTED | Two-column compact metrics, horizontal comparison table and touch-sized controls |

## Access model

The API accepts only Management, Governing Body, Super Admin and College Admin workspaces. A Management/Governing Body seed grants dashboard view plus report read/export only. Summary viewers receive department strength but no detailed academic, finance, attendance or placement breakdown. `reports:read` enables drill-down and `reports:export` independently enables export. Every dashboard view and export writes an AuditLog entry.

## Routes

- UI: `/management/dashboard` and `/governing-body/dashboard`
- API: `GET /api/management/dashboard?periodDays=30&departmentId=...`
- Export: `GET /api/management/export?periodDays=30&departmentId=...`

## Data integrity

The module introduces no management metric tables. It is a read projection over CampusOS operational sources. Missing IQAC deployment tables yield an explicit unavailable state, never fabricated zeroes. Research and development totals are labeled as faculty-profile records until dedicated Research and HR event ledgers become authoritative.
