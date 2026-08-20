# CampusOS Android UI audit

Date: 2026-08-18  
Scope: existing client presentation only. Backend, routes, APIs, payloads, permissions, workflows, and business behavior are excluded.

## Shared findings

| Workspace | Page | Route | Current component | Typography issue | Spacing issue | Alignment issue | Card issue | Form issue | Mobile overflow | Bottom nav issue | Dark theme issue | Responsive issue | Required change | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All | App shell | Protected routes | `AppShell`, `TopHeader` | Mobile title hierarchy varies by child page | Main content uses one padding rule at all phone widths | Header actions can crowd 320px | N/A | N/A | Small-phone action crowding | Content clearance relies on fixed `pb-24` | Theme tokens are sound | Needs 12px gutter at 320px and 16px otherwise | Add shared responsive page container behavior | RESPONSIVE FIX |
| All | Bottom navigation | Workspace-specific | `MobileBottomNav` | Labels are readable but narrow | Vertical rhythm is compressed | Active item uses scale that can shift alignment | N/A | N/A | Long labels truncate at 320px | Needs clearer selected surface and 48dp target | Token-aware | Five items need stable equal widths | Refine only presentation; preserve destinations | MODERATE FIX |
| All | Page headers | Multiple | `PageHeader` and local headers | Phone title is 24px and often truncated | Action/title wrapping inconsistent | Badge can squeeze title | N/A | N/A | Long department/page names lose context | N/A | Token-aware | Action should become full-width on narrow phones | Add clamp, two-line title, responsive action row | RESPONSIVE FIX |
| All | Buttons | Multiple | Two `Button` systems | Weight/size differs | 32–44px heights are below requested mobile target | Icon/text alignment differs | Excessive variant-specific hardcoded colors | N/A | Long labels use forced nowrap | N/A | Small controls are difficult at font scale | Normalize to semantic tokens and 48dp mobile controls | MODERATE FIX |
| All | Inputs | Forms | Two `Input` systems | One uses uppercase labels; sizes differ | 36–40px inputs are cramped | Helper/error rhythm differs | N/A | Focus/error styles differ | Fixed heights risk larger text clipping | N/A | Dark mode mostly token-aware | Mobile fields need minimum 48px and stable IDs | Normalize presentation only | MODERATE FIX |
| All | Cards / KPIs | Dashboards | `MetricCard`, `SectionCard`, local cards | Metric scale is too large at narrow widths | Padding differs across components | Icons and values can crowd | Radius ranges from 8px to 24px; some heavy shadows | N/A | Long labels truncate without secondary line | N/A | `SectionCard` uses explicit slate values | KPI grid needs narrow-phone fallback | Refine shared card surfaces and typography | MODERATE FIX |
| All | Responsive tables | Lists/reports | `MobileResponsiveTable` plus local tables | Mobile text is 10–12px and overly bold | Detail rows are cramped | Values can collide with labels | Forced slate-900 cards in light mode | N/A | Long values lack `min-width:0` wrapping | N/A | Light mode is visibly wrong | Local wide tables still require migration | Fix shared table theme and wrapping first | UI REFACTOR REQUIRED |

## Workspace screen inventory

These rows classify the existing screen families. A source-level audit cannot be labeled physical or visual-device verification.

| Workspace | Pages / routes reviewed | Current components | Main issues | Required change | Status |
| --- | --- | --- | --- | --- | --- |
| Student | Dashboard, Requests/Leave, Timetable, Attendance, Assignments, Results, Fees, Circulars, Messages, Calendar, Profile, Hostel, Transport, Library, Placement | Dedicated Student pages and `StudentPortal` | Mixed legacy/local card styles; several wide-table fallbacks; dense portal sections | Apply shared header/card/form/table improvements, then page-specific responsive passes | MODERATE FIX |
| Parent | Dashboard, Attendance, Marks, Timetable, Fees, Leave, Receipts, Transport, Mentor, Circulars, Notifications, Profile | `ParentWorkspacePortal` | Dense tab strip and table sections; long child context | Improve wrapping, cards and touch controls without altering child selection | RESPONSIVE FIX |
| Faculty | Dashboard, Timetable, Attendance, Students, Assignments, Materials, Marks, Leave/OD, Tasks, Circulars, Messages, Profile | `FacultyWorkspacePortal`, `FacultyPortal`, dedicated pages | Large monolithic portal contains desktop tables and small tab labels | Shared primitives first; migrate high-use mobile tables progressively | UI REFACTOR REQUIRED |
| Mentor | Dashboard, Mentees, Student detail, Attendance, Academics, Counselling, Parents, Meetings, Approvals, Profile | Mentor pages and `MentorWorkspacePortal` | Horizontal tabs and long Student 360 content need small-phone wrapping | Shared typography/cards plus page-level list/detail pass | MODERATE FIX |
| Class Adviser | Dashboard, Students, Attendance, Academics, Leave/OD, Assignments, Circulars, Notifications, Profile | Scoped HOD/Faculty components | Components inherit desktop operational density | Use responsive cards and simpler action hierarchy | UI REFACTOR REQUIRED |
| HOD | Dashboard, Department, Faculty, Students, Approvals, Timetable, Attendance, Mentors, Tasks, Reports, Notifications, Profile | HOD workspaces and control centers | Numerous wide tables, dense filters and varied approval layouts | Prioritize responsive tables, sticky actions and consistent headers | UI REFACTOR REQUIRED |
| Academic Dean | Dashboard, Academics, Availability, Approvals, Tasks, Circulars, Reports, Notifications, Profile | `AcademicDeanPortal` and shared workspaces | Dashboard/approval surfaces use mixed spacing | Shared card/header refinement and action hierarchy | MODERATE FIX |
| A&A Dean | Dashboard, Admissions, Services, Approvals, Tasks, Circulars, Reports, Notifications, Profile | `AdmissionDeanPortal` | Long pages and overflow tables | Responsive table/list presentation; compact page sections | UI REFACTOR REQUIRED |
| IQAC Dean | Dashboard, Accreditation, Evidence, Approvals, Tasks, Reports, Notifications, Profile | `IQACDeanPortal` | Evidence actions crowd on phones; status/actions wrap poorly | Stack actions and use shared cards/status styling | RESPONSIVE FIX |
| COE | Dashboard, Exams, Schedules, Halls, Invigilation, Marks/Results, Timetable | COE workspace and exam pages | Data-heavy desktop presentation | Mobile summary cards and detail drill-down required progressively | UI REFACTOR REQUIRED |
| VP / Principal | Dashboards, Departments, Approvals, Availability, Delegation, Tasks, Circulars, Reports, Notifications | Executive portals and approval centers | Dense operational tables compete with decision actions | Emphasize exceptions/actions and convert phone tables to cards | UI REFACTOR REQUIRED |
| Accountant / AO | Dashboard, collections, transactions, closings, reconciliation, reports | `FinanceWorkspace` | Some charts and tables rely on horizontal scrolling | Responsive summaries/cards while preserving calculations | MODERATE FIX |
| Library / Hostel / Transport / Placement | Role dashboards and operational lists | Lazy enterprise workspaces | Local card patterns differ; empty/filter states inconsistent | Adopt shared surfaces, typography and 48dp controls | MODERATE FIX |
| Office / HR / Security / Scholarship / Research / Purchase / Inventory / Maintenance / Alumni | Enabled enterprise pages | Enterprise modules | Many desktop-first tables/forms and mixed local styling | Page-by-page migration after shared-system pass | UI REFACTOR REQUIRED |

## Static risk inventory

- Wide-table patterns remain in Student, Faculty, HOD, Dean, finance, placement, administration, reports, and configuration screens.
- Multiple local components use 9–11px metadata and excessive `font-bold`/`font-black` weights.
- Several pages use explicit slate light/dark colors instead of semantic tokens.
- Shared safe-area and keyboard infrastructure already exists and should be preserved.
- Existing route and bottom-navigation destinations must not change during this UI refinement.
