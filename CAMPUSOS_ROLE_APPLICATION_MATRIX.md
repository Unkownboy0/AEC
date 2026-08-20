# CampusOS role application matrix

Demo truth date: 2026-08-19

Every `Visible Today = Yes` row is produced by `GET /api/workspace/applications`. Visibility also requires the user's active role/workspace assignment. `Workspace flag` means `MODULE_CAMPUS_WORKSPACE_ENABLED`; `Governance flag` means `MODULE_GOVERNANCE_ENABLED`; `Circulars flag` means `MODULE_CIRCULARS_ENABLED`.

| Role / Workspace | Application | Route | Required Permission | Feature Flag | API Exists | UI Exists | Functional | Visible Today | Reason |
|---|---|---|---|---|---|---|---|---|---|
| Student | Campus Drive | `/workspace/drive` | Authenticated active Student workspace | Workspace flag | Yes | Yes | Yes | Yes | Core student suite app |
| Student | Campus Classroom | `/student/assignments` | Authenticated active Student workspace | None | Yes | Yes | Yes | Yes | Core student academic app |
| Student | Campus Calendar | `/student/calendar` | Authenticated active Student workspace | None | Yes | Yes | Yes | Yes | Existing real student calendar route |
| Student | Docs / Sheets / Slides / Forms / Notes / Reports | N/A | N/A | Workspace flag | Mixed | Yes | Not offered | No | Student enterprise launcher intentionally minimal |
| Student | Chat / AI / Admin / Security | N/A | N/A | Mixed | Mixed | Mixed | Not offered | No | Hidden from demo catalog; advanced or unavailable suite product |
| Faculty | Campus Drive | `/workspace/drive` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Governed Drive workflow exists |
| Faculty | Campus Docs | `/workspace?type=DOC` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Native document workflow exists |
| Faculty | Campus Sheets | `/workspace?type=SHEET` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Native sheet workflow exists |
| Faculty | Campus Slides | `/workspace?type=SLIDE` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Native slide workflow exists |
| Faculty | Campus Forms | `/workspace?type=FORM` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Form workflow exists |
| Faculty | Campus Notes | `/workspace?type=NOTE` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Note workflow exists |
| Faculty | Campus Reports | `/workspace?type=REPORT` | Active Faculty workspace | Workspace flag | Yes | Yes | Yes | Yes | Governed report document workflow exists |
| Faculty | Campus Announcements | `/circulars` | Active Faculty workspace | Circulars flag | Yes | Yes | Yes | Yes | Real circular center |
| Faculty | Notification Center | `/notifications` | Active Faculty workspace | None | Yes | Yes | Yes | Yes | Central notification page |
| Faculty | Campus Tasks | `/tasks` | Active Faculty workspace | Governance flag | Yes | Yes | Yes | Yes | Work-management route and API exist |
| Faculty | Campus Classroom | `/faculty/assignments` | Active Faculty workspace | None | Yes | Yes | Yes | Yes | Existing faculty assignment page |
| Faculty | Calendar / Chat / AI | N/A | N/A | Mixed | No verified staff route | Mixed | Not verified | No | Hidden instead of routing to a dead or incomplete page |
| Mentor | Campus Drive | `/workspace/drive` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | ACL honors current workspace and department |
| Mentor | Campus Docs | `/workspace?type=DOC` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared Workspace UI/API |
| Mentor | Campus Sheets | `/workspace?type=SHEET` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared Workspace UI/API |
| Mentor | Campus Slides | `/workspace?type=SLIDE` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared Workspace UI/API |
| Mentor | Campus Forms | `/workspace?type=FORM` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared Workspace UI/API |
| Mentor | Campus Notes | `/workspace?type=NOTE` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared Workspace UI/API |
| Mentor | Campus Reports | `/workspace?type=REPORT` | Active Mentor workspace | Workspace flag | Yes | Yes | Yes | Yes | Permission-scoped data providers remain server-side |
| Mentor | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active Mentor workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| Mentor | Campus Chat | `/mentor/messages` | Active Mentor workspace | None | Yes | Yes | Yes | Yes | Existing mentor conversation workspace |
| Mentor | Classroom / Calendar / Meet / AI | N/A | N/A | Mixed | Not fully verified | Mixed | Not verified | No | No real role-specific suite route/core product verified today |
| Class Adviser | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active Class Adviser workspace | Workspace flag | Yes | Yes | Yes | Yes | Same identity; server uses active workspace |
| Class Adviser | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active Class Adviser workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real routes and APIs |
| Class Adviser | Campus Classroom | `/class-adviser/assignments` | Active Class Adviser workspace | None | Yes | Yes | Yes | Yes | Existing section-role assignment route |
| Class Adviser | Calendar / Chat / AI | N/A | N/A | Mixed | Not verified | Mixed | Not verified | No | Hidden for demo safety |
| HOD | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active HOD workspace | Workspace flag | Yes | Yes | Yes | Yes | Broad academic staff suite |
| HOD | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active HOD workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real center routes; HOD core ERP remains separate |
| HOD | Classroom / Calendar / Chat / Analytics / AI | N/A | N/A | Mixed | Not verified | Mixed | Not verified | No | Hidden; no verified launcher route/core workflow |
| Academic Dean | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active Academic Dean workspace | Workspace flag | Yes | Yes | Yes | Yes | Broad academic productivity suite |
| Academic Dean | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active Academic Dean workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| Academic Dean | Calendar / Classroom / Analytics / Search / AI | N/A | Explicit permission would be required | Mixed | Not verified | Mixed | Not verified | No | Hidden; workspace alone never grants result publishing or global search |
| Admission Dean | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active Admission Dean workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared productivity workflows |
| Admission Dean | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active Admission Dean workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| Admission Dean | Calendar / Search / AI | N/A | Explicit permission would be required | Mixed | Not verified | Mixed | Not verified | No | Hidden for demo truth |
| IQAC Dean | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active IQAC Dean workspace | Workspace flag | Yes | Yes | Yes | Yes | Real shared suite; IQAC evidence stays parent-scoped |
| IQAC Dean | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active IQAC Dean workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| IQAC Dean | Calendar / Search / AI | N/A | Explicit permission would be required | Mixed | Not verified | Mixed | Not verified | No | Hidden for demo truth |
| COE | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active COE workspace | Workspace flag | Yes | Yes | Yes | Yes | Productivity layer only; COE ERP permissions remain separate |
| COE | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active COE workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| COE | Result Publish | COE ERP route, not launcher | Explicit result-publish permission | Existing COE policy | Yes | Yes | Permission-dependent | No | Never inferred from Workspace access |
| Vice Principal / VP | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active VP workspace | Workspace flag | Yes | Yes | Yes | Yes | Broad executive productivity suite |
| Vice Principal / VP | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active VP workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| Vice Principal / VP | Principal-only administration | N/A | Active delegation plus explicit route policy | N/A | Yes | Yes | Delegation-dependent | No | VP is not silently converted to Principal |
| Principal | Drive / Docs / Sheets / Slides / Forms / Notes / Reports | Workspace routes | Active Principal workspace | Workspace flag | Yes | Yes | Yes | Yes | Broad executive productivity suite |
| Principal | Announcements / Notifications / Tasks | `/circulars`, `/notifications`, `/tasks` | Active Principal workspace | Circulars/Governance as applicable | Yes | Yes | Yes | Yes | Real shared routes |
| Principal | Analytics / global Search / AI | N/A | Explicit feature and permission required | Mixed | Not verified | Mixed | Not verified | No | Hidden rather than advertised |
| Accountant / Accounts Officer / AO | Drive / Docs / Sheets / Forms / Reports | Workspace routes | Active finance workspace | Workspace flag | Yes | Yes | Yes | Yes | Role-relevant productivity tools |
| Accountant / Accounts Officer / AO | Campus Tasks | `/tasks` | Active finance workspace | Governance flag | Yes | Yes | Yes | Yes | Real work-management workflow |
| Accountant / Accounts Officer / AO | Slides / Notes / academic administration | N/A | N/A | Mixed | Mixed | Mixed | Not offered | No | Not relevant or not verified for finance demo |
| HR / Office / Administration / Placement | Drive / Docs / Sheets / Forms / Reports | Workspace routes | Active operational workspace | Workspace flag | Yes | Yes | Yes | Yes | Role-relevant productivity tools |
| HR / Office / Administration / Placement | Campus Tasks | `/tasks` | Active operational workspace | Governance flag | Yes | Yes | Yes | Yes | Real work-management route |
| Library / Librarian | Campus Drive | `/workspace/drive` | Active Library workspace | Workspace flag | Yes | Yes | Yes | Yes | Useful file workflow |
| Library / Librarian | Campus Sheets / Forms / Reports | Workspace routes | Active Library workspace | Workspace flag | Yes | Yes | Yes | Yes | Role-relevant operational tools |
| Library / Librarian | Campus Tasks | `/tasks` | Active Library workspace | Governance flag | Yes | Yes | Yes | Yes | Real task workflow |
| Library / Librarian | Docs / Slides / Notes | N/A | N/A | Workspace flag | Yes | Yes | Not offered | No | Intentionally narrowed catalog |
| Hostel / Hostel Warden | Drive / Sheets / Forms / Reports | Workspace routes | Active Hostel workspace | Workspace flag | Yes | Yes | Yes | Yes | Role-relevant operational tools |
| Hostel / Hostel Warden | Campus Tasks | `/tasks` | Active Hostel workspace | Governance flag | Yes | Yes | Yes | Yes | Real task workflow |
| Transport / Transport Manager | Drive / Sheets / Forms / Reports | Workspace routes | Active Transport workspace | Workspace flag | Yes | Yes | Yes | Yes | Role-relevant operational tools |
| Transport / Transport Manager | Campus Tasks | `/tasks` | Active Transport workspace | Governance flag | Yes | Yes | Yes | Yes | Real task workflow |
| College Operations | Drive / Docs / Sheets / Forms / Reports | Workspace routes | Active College Operations workspace | Workspace flag | Yes | Yes | Yes | Yes | Operational productivity tools |
| College Operations | Campus Tasks | `/tasks` | Active College Operations workspace | Governance flag | Yes | Yes | Yes | Yes | Real work-management route |
| College Admin | Staff suite applications | Workspace, circular, notification, task routes | Active College Admin workspace | Applicable module flags | Yes | Yes | Yes | Yes | Complete currently implemented productivity catalog |
| College Admin | Campus Admin | `/admin/control-center` | Any of `settings:read`, `users:read`, `roles:read` | None | Yes | Yes | Yes | Permission-dependent | Server checks permission and role |
| College Admin | Campus Security | `/security-logs` | `audit:read` or `audit_logs:view` | None | Yes | Yes | Yes | Permission-dependent | Server checks permission and role |
| Super Admin | Staff suite applications | Workspace, circular, notification, task routes | Active Super Admin workspace | Applicable module flags | Yes | Yes | Yes | Yes | Full currently implemented productivity catalog |
| Super Admin | Campus Admin | `/admin/control-center` | Any of `settings:read`, `users:read`, `roles:read` | None | Yes | Yes | Yes | Permission-dependent | Real administration route |
| Super Admin | Campus Security | `/security-logs` | `audit:read` or `audit_logs:view` | None | Yes | Yes | Yes | Permission-dependent | Real security/audit route |
| Parent | Campus Chat | `/parent/messages` | Active Parent workspace | None | Yes | Yes | Yes | Yes | Existing parent conversation workspace |
| Parent | Drive / productivity / administration | N/A | N/A | Mixed | Mixed | Mixed | Not offered | No | Parent suite remains intentionally limited |

## Catalog exclusions

- Meet and AI definitions are forced hidden (`roles: []`) because Phase 1 explicitly excludes those products and no demo-safe complete core workflow was verified.
- Staff Calendar is hidden because no single role-correct staff calendar launcher route was verified.
- Analytics and global Search are hidden because the existing route/permission/core-workflow combination was not established for the launcher.
- Existing ERP navigation remains independent. Hiding a suite app does not remove Dashboard, attendance, timetable, fees, results, leave/OD, requests, IQAC, COE, finance, HR, library, hostel, transport, placement, or other existing role pages.
