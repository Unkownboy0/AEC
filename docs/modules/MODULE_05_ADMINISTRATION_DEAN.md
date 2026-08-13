# Module 05 — Admission & Administration Dean

## Authority boundary

The workspace accepts only `Admission Dean`, `Administration & Admission Dean`, and the legacy role code `ADMINISTRATION_AND_ADMISSION_DEAN`. It does not grant IQAC or COE authority. Faculty access is exposed only when the same identity has both an active Faculty workspace/role and a linked Faculty profile.

Hostel oversight is fail-closed and controlled by the audited system setting `HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT`. The setting must be `true`, `enabled`, `1`, or `yes` before hostel data and hostel complaints appear.

## Authoritative connections

- Admission applications, intake, enquiries, counselling, scholarships and payments use the existing Admission module.
- Onboarding and records use Student Master records.
- Administrative and student-service complaints use the shared grievance Ticket store, with owner, derived priority SLA, status and resolution.
- Tasks use the shared task engine; department coordination uses Admission Coordination requests.
- Hostel statistics use Hostel buildings and linked students only when policy enables oversight.
- Student services use shared workflow requests.
- Reports are generated server-side as PDF or XLSX and require `reports:export`.

## Routes

The dashboard is `/admission-dean/dashboard`; dedicated routes cover admissions, approvals, tasks, coordination, students, complaints, hostel, services, circulars, reports, notifications and profile. Reads and exports create audit records. The dashboard refreshes every 15 seconds and never seeds placeholder data.
