# Module 08 — Faculty and Mentor

## Identity and authorization

- Faculty and Mentor workspaces resolve the same `User` and linked `Faculty` profile.
- Mentor data is available only when students have an active mentor assignment or the authoritative `Student.mentorId` link.
- Every Student 360 read, note write, and Leave/OD decision revalidates the mentee relationship server-side.
- Faculty timetable, subjects, teaching groups, and attendance are resolved by teaching allocation, so cross-department teaching never changes the employee's home department.

## Attendance workflow

1. Load today's timetable slots for the signed-in Faculty profile.
2. Open a scheduled class; subject, section, period, room, and date are server-filled.
3. All eligible students start as `PRESENT`; Faculty records exceptions.
4. Submission rejects students outside the slot or controlled teaching group.
5. Period attendance is replaced atomically for safe corrections and an `ATTENDANCE_UPDATED` event refreshes authorized downstream dashboards.

## Combined groups

`TeachingGroup` links one subject and Faculty allocation to controlled department, section, and optional student memberships. Faculty can only create their own groups for an assigned subject; HOD scope checks prevent cross-department group escalation.

## Remaining authoritative integrations

Course materials, lesson plans, course plans, appraisal, and evidence must use their dedicated domain models when enabled. The Faculty workspace must not invent records when those modules have no data.
