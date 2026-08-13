# Module 03 — Principal Command Centre

Status values: VERIFIED, IMPLEMENTED, PARTIAL, BLOCKED.

| Area | Authoritative source | Status | Notes |
|---|---|---|---|
| Institution dashboard and KPIs | Shared Management projection plus operational sources | IMPLEMENTED | No Principal metric copies and no fallback sample values |
| Student/faculty attendance | Attendance | IMPLEMENTED | Current-day recorded and present rates are separated by person type |
| Department performance | Department, Student, Faculty, Attendance, Mark, FeeBill, PlacementRecord | IMPLEMENTED | Server-side department scope |
| Approval/escalation queues | ApprovalAssignment | IMPLEMENTED | Direct and delegated pending counts |
| Workflow actions | ApprovalAssignment, FacultyLeaveRequest, WorkflowRequest, ApprovalWorkflowEvent | IMPLEMENTED | Approve/reject/return now update workflow, notify, broadcast realtime and audit |
| Tasks | Enterprise Task | IMPLEMENTED | Active, overdue, status bottleneck and action route |
| Circulars | InstitutionalCircular and unified Circular module | IMPLEMENTED | Recent publications plus existing publish workflow |
| Leave/OD | StudentLeaveRequest and FacultyLeaveRequest | IMPLEMENTED | Status summaries over selected period |
| Academics, finance, placement, IQAC, grievance | Shared operational modules | IMPLEMENTED | IQAC explicitly unavailable until deployment migration exists |
| Hostel and transport | HostelBuilding, Student occupancy and TransportRoute | IMPLEMENTED | Capacity is reported only when structured room capacity exists |
| Delegation | Existing Principal Availability/Delegation services | VERIFIED | Activate/revoke remains connected through the status control |
| Drill-down | Department → Program → Semester/year → Section | IMPLEMENTED | Student/Faculty detail continues through shared guarded profile routes |
| Web/mobile UX | Responsive command-centre page and existing Principal mobile nav | IMPLEMENTED | Touch controls, compact KPI grid and horizontal data table |

## Action guarantees

Principal approve, reject and return endpoints require direct Principal assignment authorization. Each successful action updates the approval assignment and applicable operational request, appends the workflow timeline, sends the applicant an in-app/push notification through the existing notification service, broadcasts approval/dashboard realtime updates and writes an AuditLog record. Return requires remarks and routes WorkflowRequest correction back to the HOD stage.

## Routes

- UI: `/principal/dashboard`
- Dashboard: `GET /api/principal-command/dashboard?periodDays=30&departmentId=...`
- Hierarchy: `GET /api/principal-command/hierarchy?departmentId=...`
- Return: `POST /api/principal/approval-center/requests/:id/return`

## Deployment notes

The Principal dashboard tolerates the currently missing IQAC deployment tables through the shared aggregation layer. Approval/delegation tables must exist before their command widgets can operate; they are already part of the established Principal availability architecture.
