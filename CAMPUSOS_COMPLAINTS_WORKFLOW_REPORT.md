# GEETORUS CAMPUSOS — COMPLAINTS & GRIEVANCE WORKFLOW REPORT
**Module**: Scoped Grievance Logging, Searchable Student Lookup & Escalation Control  
**Date**: August 19, 2026  
**Status**: BUILD VERIFIED  

---

## 1. Overview & Architecture

The Grievance & Complaint Management system (`ComplaintsPage.tsx` and `ComplaintMonitoringCenter.tsx`) provides role-aware grievance handling, targeted routing, and real-time resolution telemetry.

---

## 2. Category Routing Architecture

Complaints are automatically routed based on category policies:

| Category | Destination Authority | Confidentiality Policy |
|---|---|---|
| **ACADEMIC** | Operating Department HOD | Standard department visibility |
| **ATTENDANCE_ISSUE** | Department HOD / Class Adviser | Standard department visibility |
| **FACULTY_BEHAVIOR** | Department HOD | Restricted / Confidential |
| **HOSTEL** | Hostel Warden + A&A Dean | Residential staff visibility |
| **INFRASTRUCTURE** | Administration Office (A&A Dean) | Facilities / IT team visibility |
| **TRANSPORT** | Transport Manager + A&A Dean | Fleet operations visibility |
| **FEES** | Accounts Department (AO / Accountant) | Finance team visibility |
| **DISCIPLINARY** | A&A Dean + Principal Visibility | Executive authority visibility |
| **ANTI_RAGGING** | Anti-Ragging Cell | Strictly Confidential |
| **GENERAL** | Administration & A&A Dean | General administrative desk |

---

## 3. Scoped Student Search & Selector

When authorized staff (Mentors, Class Advisers, HODs, Deans, Super Admins) file a grievance on behalf of or regarding a student:
- **Async Server Query**: Queries `/enterprise/students?q={query}&pageSize=6` with debouncing.
- **Disambiguation Data**: Displays Name, Register Number, Department, Program, and Year.
- **Scope Restriction**: Mentors are scoped to mentees, HODs to department students, and Deans/Principal/Admin to institutional scope.

---

## 4. UI Previews & Load More

- **Status Groups**: `PENDING`, `IN_PROGRESS`, `RETURNED`, `ESCALATED`, `RESOLVED`, `REJECTED`.
- **Compact Summary**: Summaries present initial 3–4 items with status badges and timestamps.
- **Desktop Hover & Mobile Bottom Sheet**:
  - **Desktop**: Fast preview of requester, category, short title, age, priority.
  - **Mobile**: Tap on status summary opens modal sheet with items + "View All / Load More" pagination.
- **Audit History**: High-authority roles inspect the full reply thread, internal notes, and escalation logs.

---

## 5. Verification Status
- **Scoped Student Lookup**: TEST VERIFIED
- **Category Routing**: TEST VERIFIED
- **UI Responsiveness**: BUILD VERIFIED
