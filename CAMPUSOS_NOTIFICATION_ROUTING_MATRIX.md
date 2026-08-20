# CampusOS Notification Routing & Security Matrix

This matrix specifies the authoritative recipient resolution, scope boundaries, delivery channels, deep links, and negative test verifications for all CampusOS domain events.

## Routing Matrix Table

| Event | Actor | Resource | Workflow Stage | Expected Recipient | Workspace | Scope | Push | In-App | Deep Link | Negative Recipients Tested | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student Leave Submitted** | Student | `StudentLeaveRequest` | Mentor Review | Assigned Mentor ONLY | Mentor | Mentee Scope | Yes | Yes | `/faculty/mentor/leave-od/:id` | Unrelated Mentor, HOD (prematurely), Other Students | PASS |
| **Student Leave Forwarded** | Mentor | `StudentLeaveRequest` | HOD Review | Operating HOD (S&H for Year 1) | HOD | Dept Scope | Yes | Yes | `/hod/leave-approvals/:id` | Home HOD (if 1st year S&H configured), Principal | PASS |
| **Student Leave Approved** | HOD | `StudentLeaveRequest` | Approved | Student + Linked Parents | Student / Parent | Applicant Scope | Yes | Yes | `/student/leave-od/:id` | Other Students, Faculty | PASS |
| **Student Leave Rejected** | HOD / Mentor | `StudentLeaveRequest` | Rejected / Returned | Student Applicant | Student | Applicant Scope | Yes | Yes | `/student/leave-od/:id` | Linked Parents, Other Students | PASS |
| **Student OD Submitted** | Student | `StudentODRequest` | Mentor Review | Assigned Mentor ONLY | Mentor | Mentee Scope | Yes | Yes | `/faculty/mentor/leave-od/:id` | Unrelated Mentor, HOD | PASS |
| **Student OD Approved** | HOD | `StudentODRequest` | Approved | Student + Linked Parents | Student / Parent | Applicant Scope | Yes | Yes | `/student/leave-od/:id` | Unrelated Students | PASS |
| **Faculty Leave Submitted** | Faculty | `FacultyLeaveRequest` | HOD Stage | Home Department HOD | HOD | Dept Scope | Yes | Yes | `/hod/leave-approvals/:id` | Other Dept HODs, Principal (prematurely) | PASS |
| **Faculty Leave Forwarded** | HOD | `FacultyLeaveRequest` | Executive Review | Principal + Valid Delegated VP | Executive | Institution / Scope | Yes | Yes | `/vp/acting-principal/approvals` | VP without active delegation | PASS |
| **Faculty Leave Approved** | Principal / VP | `FacultyLeaveRequest` | Final Approved | Faculty Applicant | Faculty | Personal Scope | Yes | Yes | `/faculty/leave-od/:id` | Other Faculty | PASS |
| **Attendance Absent** | System / Faculty | `AttendanceRecord` | Recorded | Student + Parent (if enabled) | Student / Parent | Student Scope | Yes | Yes | `/student/attendance` | Unrelated Parents, Mentor | PASS |
| **Attendance Shortage** | System | `AttendanceRisk` | Threshold Breach | Student + Mentor (+ Class Adviser / HOD if critical) | Student / Mentor | Section Scope | Yes | Yes | `/student/attendance` | Unrelated Faculty | PASS |
| **Assignment Published** | Faculty | `Assignment` | Published | Target Section Students | Student | Section Scope | Yes | Yes | `/student/assignments` | Students in other sections, Parents | PASS |
| **Assignment Submitted** | Student | `AssignmentSubmission` | Submitted | Creator Faculty + Student Ack | Faculty / Student | Course Scope | Yes | Yes | `/faculty/assignments` | Other Faculty, HOD | PASS |
| **Assignment Graded** | Faculty | `AssignmentSubmission` | Graded | Student Applicant (+ Parent if policy allows) | Student | Personal Scope | Yes | Yes | `/student/assignments` | Other Students | PASS |
| **HOD Task Assigned** | HOD | `Task` | Assigned | Selected Faculty Assignee | Faculty | Task Scope | Yes | Yes | `/faculty/tasks` | Unassigned Faculty | PASS |
| **Dean Task Assigned** | Academic Dean | `Task` | Assigned | Target HOD / Faculty | HOD / Faculty | Domain Scope | Yes | Yes | `/academic-dean/tasks` | Unrelated HODs | PASS |
| **Timetable Published** | HOD / Admin | `Timetable` | Active | Affected Students + Faculty + HOD | All relevant | Section Scope | Yes | Yes | `/student/timetable` | Unaffected Sections | PASS |
| **Timetable Changed** | HOD | `TimetableSlot` | Modified | Affected Section Students + Faculty | All relevant | Section Scope | Yes | Yes | `/student/timetable` | Unaffected Sections | PASS |
| **Substitute Assigned** | HOD | `Substitution` | Assigned | Original Faculty + Substitute + Section | Faculty / Student | Class Scope | Yes | Yes | `/faculty/timetable` | Unassigned Faculty | PASS |
| **Circular Published** | Admin / Principal | `Circular` | Published | Resolved Target Audience Only | Selected Workspace | Target Audience | Yes | Yes | `/student/circulars` | Excluded roles/departments | PASS |
| **Fee Due** | Accounts | `FeeInvoice` | Due | Student + Linked Parent | Student / Parent | Billing Scope | Yes | Yes | `/student/fees` | Unlinked Parents | PASS |
| **Payment Successful** | Student / Parent | `PaymentTransaction` | Completed | Student / Parent Payer + Accountant | Accounts | Transaction Scope | Yes | Yes | `/student/fees` | Unrelated Accounts Staff | PASS |
| **Refund Pending** | Student / Faculty | `RefundRequest` | Processing | Accountant / AO + Requester | Accounts | Financial Scope | Yes | Yes | `/finance/fee-collection` | Unrelated Staff | PASS |
| **Result Published** | COE | `ExamResult` | Published | Affected Students + Linked Parents | Student / Parent | Exam Scope | Yes | Yes | `/student/results` | Non-enrolled Students | PASS |
| **Result Draft / Processing** | COE | `ExamDraft` | Processing | **COE Authorized Users ONLY** | COE | Domain Scope | No (Internal) | Yes | `/exams/results` | **NEVER Student or Parent** | PASS |
| **Hostel Outing Request** | Hosteller | `OutingPass` | Pending Review | Warden ONLY | Hostel Warden | Hostel Scope | Yes | Yes | `/hostel/dashboard` | Non-hostellers, Day Scholars | PASS |
| **Hostel Emergency** | Warden | `HostelAlert` | Active | Active Hostellers + Parents + Warden | Hostel / Parent | Hostel Scope | Yes (Critical) | Yes | `/student/hostel` | Day Scholars | PASS |
| **Transport Allocation Changed** | Transport Admin | `BusPass` | Updated | Assigned Student/Staff + Linked Parent | Student / Parent | Route Scope | Yes | Yes | `/student/transport` | Non-transport Users | PASS |
| **Transport Breakdown** | Driver / Admin | `RouteAlert` | Emergency | Affected Route Users + Transport Admin | All relevant | Route Scope | Yes | Yes | `/student/transport` | Users on other routes | PASS |
| **Library Overdue** | Librarian / System | `BookLoan` | Overdue | Borrower + Librarian | Student / Library | Personal Scope | Yes | Yes | `/student/library` | Unrelated Borrowers | PASS |
| **Placement Drive** | Placement Officer | `JobDrive` | Announced | Eligible Students Only + Placement Team | Student / Placement | Eligibility Scope | Yes | Yes | `/student/placements` | Ineligible Students (e.g. 1st year) | PASS |
| **Placement Application Update** | Officer | `JobApplication` | Updated | Applicant + Placement Officer | Student / Placement | Application Scope | Yes | Yes | `/student/placements` | Other Applicants | PASS |
| **IQAC Evidence Submitted** | Faculty | `IQACEvidence` | Review Stage | Responsible IQAC Reviewer + Contributor | IQAC | Quality Scope | Yes | Yes | `/iqac/dashboard` | Unrelated Reviewers | PASS |
| **Appraisal Submitted** | Faculty | `FacultyAppraisal` | Review Stage | HOD / IQAC based on stage + Applicant | HOD / IQAC | Workflow Scope | Yes | Yes | `/iqac/dashboard` | Unrelated Faculty | PASS |
| **Complaint Academic** | Student / Parent | `Grievance` | Submitted | Operating HOD (A&A Dean if escalated) | HOD / Dean | Grievance Scope | Yes | Yes | `/hod/complaints` | Unrelated Department HODs | PASS |
| **Complaint Hostel** | Hosteller | `Grievance` | Submitted | Warden ONLY (A&A Dean if escalated) | Warden | Hostel Scope | Yes | Yes | `/hostel/dashboard` | Academic HODs | PASS |
| **Complaint IT / Maintenance** | User | `ServiceTicket` | Ticket Created | College Admin + Requester | Admin | Ticket Scope | Yes | Yes | `/admin/maintenance` | Unrelated Staff | PASS |
| **Principal Delegation Created** | Principal | `PrincipalDelegation` | Activated | Selected VP + Principal | VP / Principal | Delegation Scope | Yes | Yes | `/vp/acting-principal/approvals` | Unselected VPs | PASS |
| **Delegated Request Pending** | System | `WorkflowInstance` | Pending | VP (if inside delegated scope) + Principal | VP / Principal | Delegated Scope | Yes | Yes | `/vp/acting-principal/approvals` | VP without matching scope | PASS |
| **Delegation Expired / Revoked** | System / Principal | `PrincipalDelegation` | Closed | VP + Principal | VP / Principal | Delegation Scope | Yes | Yes | `/principal/delegation` | Unrelated Staff | PASS |

---

## Workspace Awareness Rules

When a user holds multiple roles (e.g. `FACULTY` + `MENTOR` + `HOD`):
1. Notifications display explicit workspace tags: `[MENTOR]`, `[HOD]`, `[FACULTY]`.
2. Notification tap triggers **workspace resolution**:
   - If current active workspace is `FACULTY` and user taps an `HOD` notification:
     `Switching to HOD workspace...` → Server-side permission & scope re-validation → Navigate to target detail.
3. Authorization is strictly checked on both client and server before displaying request details.
