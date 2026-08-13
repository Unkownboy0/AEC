# Module 07 — HOD / Department Operations

HOD scope is derived only from active `DepartmentHodAssignment` records or explicit HOD department memberships. The previous fallback to the first active department was removed. Multi-department HODs receive all assigned departments, with `x-department-id` selecting the active scope; an unassigned department returns 403.

The workspace connects the authoritative Students, Faculty, Availability, Subject Allocation, Mentor Allocation, Timetable, Attendance, Leave/OD, Tasks, Circulars, Notifications and Reports modules. The dashboard no longer falls back to fabricated counts or chart data.

Timetable writes validate HOD department ownership and the existing timetable engine prevents faculty, room and section conflicts. Cross-department teaching remains represented through SubjectAssignment and TimetableSlot records, while the Faculty home `departmentId` is unchanged.

Attendance writes publish `ATTENDANCE_UPDATED`; the HOD dashboard polls the authoritative summary every ten seconds and refreshes on focus. HOD ⇄ Faculty switching remains available only through explicit workspace assignment and a linked Faculty profile.
