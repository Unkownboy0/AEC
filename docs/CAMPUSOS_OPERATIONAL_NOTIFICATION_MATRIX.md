# CampusOS Operational Notification Matrix

**System**: GEETORUS CampusOS Enterprise Notification & Delivery Engine  
**Coverage**: 7 Operational Roles (Accountant/AO, COE, Placement Officer, Librarian, Hostel Warden, Transport Manager, Office Superintendent)

---

## Complete Role-Aware Notification Matrix

| Business Event | Trigger Actor | Module | Resource | Workflow Stage | Target Recipient | Target Workspace | Priority | Channels (In-App / Push / Email) | Authorized Deep Link Route | Blocked / Negative Recipients | Result Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OFFLINE_PAYMENT_COLLECTED** | Accountant | Finance | `FeeCollection` | `RECORDED` | Student, Linked Parent | Student / Parent | `NORMAL` | In-App, PUSH, Email | `/student/fees` | Other Students/Parents | `VERIFIED` |
| **REFUND_REQUEST_CREATED** | Accountant | Finance | `FinanceRequest` | `SUBMITTED` | Accounts Officer (AO) | `/ao/dashboard` | `ACTION_REQUIRED` | In-App, PUSH | `/ao/dashboard` | Faculty, Students | `VERIFIED` |
| **REFUND_APPROVED** | AO | Finance | `FinanceRequest` | `APPROVED` | Accountant, Student | Accountant / Student | `IMPORTANT` | In-App, PUSH, Email | `/accountant/dashboard` | Unrelated Users | `VERIFIED` |
| **EXAM_SCHEDULE_PUBLISHED** | COE | COE | `ExamTimetable` | `PUBLISHED` | Enrolled Students, Faculty | Student / Faculty | `IMPORTANT` | In-App, PUSH | `/student/examinations` | Non-Enrolled Students | `VERIFIED` |
| **MARK_ENTRY_OPENED** | COE | COE | `Examination` | `FACULTY_ENTRY` | Course Faculty | Faculty | `ACTION_REQUIRED` | In-App, PUSH | `/faculty/marks-entry` | Students, Parents | `VERIFIED` |
| **MARKS_VERIFICATION_REQUIRED**| Faculty | COE | `ExamResult` | `HOD_VERIFY` | HOD | HOD | `ACTION_REQUIRED` | In-App, PUSH | `/hod/department-results` | Students, Parents | `VERIFIED` |
| **RESULT_DRAFT_PROCESSED** | COE | COE | `ExamResult` | `DRAFT` | COE, Academic Dean | COE / Dean | `NORMAL` | In-App | `/coe/marks-results` | **Student, Parent** (Strictly Blocked) | `VERIFIED` |
| **RESULT_PUBLISHED** | COE | COE | `ExamResult` | `PUBLISHED` | Student, Linked Parent | Student / Parent | `IMPORTANT` | In-App, PUSH, Email | `/student/results` | Unrelated Students | `VERIFIED` |
| **PLACEMENT_DRIVE_CREATED** | Placement Officer | Placement | `PlacementDrive` | `OPEN` | Eligible Students Only | Student | `IMPORTANT` | In-App, PUSH | `/student/placements` | Ineligible Students | `VERIFIED` |
| **PLACEMENT_SHORTLIST_UPDATED**| Placement Officer | Placement | `PlacementApplication` | `SHORTLISTED` | Candidate Student | Student | `ACTION_REQUIRED` | In-App, PUSH, Email | `/student/placements` | Other Candidates | `VERIFIED` |
| **BOOK_ISSUED** | Librarian | Library | `LibraryTransaction` | `ISSUED` | Borrower Student/Staff | Student / Staff | `NORMAL` | In-App, Email | `/student/library` | Other Students | `VERIFIED` |
| **BOOK_OVERDUE_REMINDER** | System Cron | Library | `LibraryTransaction` | `OVERDUE` | Borrower Student/Staff | Student / Staff | `IMPORTANT` | In-App, PUSH, Email | `/student/library` | Other Users | `VERIFIED` |
| **LIBRARY_CLEARANCE_UPDATED** | Librarian | Library | `LibraryBorrowerProfile` | `VERIFIED` | Office Superintendent | Office | `NORMAL` | In-App | `/office/dashboard` | Students | `VERIFIED` |
| **HOSTEL_ALLOCATION_REQUIRED** | Admission | Hostel | `HostelAllocation` | `PENDING_ROOM` | Hostel Warden | Hostel | `ACTION_REQUIRED` | In-App, PUSH | `/hostel` | Day Scholars | `VERIFIED` |
| **HOSTEL_OUTING_SUBMITTED** | Student | Hostel | `OutingRequest` | `SUBMITTED` | Hostel Warden, Parent (if policy) | Hostel / Parent | `ACTION_REQUIRED` | In-App, PUSH | `/hostel` | Unrelated Students | `VERIFIED` |
| **HOSTEL_OUTING_APPROVED** | Warden | Hostel | `OutingRequest` | `APPROVED` | Student, Parent, Gate Security | Student / Security | `IMPORTANT` | In-App, PUSH | `/student/hostel` | Day Scholars | `VERIFIED` |
| **TRANSPORT_ALLOCATION_REQUIRED**| Student | Transport | `TransportAllocation` | `PENDING_ROUTE` | Transport Manager | Transport | `ACTION_REQUIRED` | In-App, PUSH | `/transport` | Non-Bus Users | `VERIFIED` |
| **TRANSPORT_ROUTE_CHANGED** | Transport Manager | Transport | `BusRoute` | `UPDATED` | Assigned Bus Users & Parents | Student / Parent | `IMPORTANT` | In-App, PUSH | `/student/transport` | Other Route Users | `VERIFIED` |
| **ROUTE_BREAKDOWN_EMERGENCY** | Transport Manager | Transport | `TransportIncident` | `CRITICAL` | Route Assignees & Linked Parents | Student / Parent | `CRITICAL` | In-App, PUSH, Email | `/student/transport` | Unaffected Bus Routes | `VERIFIED` |
| **BONAFIDE_REQUEST_SUBMITTED** | Student | Office | `CampusOfficeDocument` | `SUBMITTED` | Office Superintendent | Office | `ACTION_REQUIRED` | In-App, PUSH | `/office/dashboard` | Other Students | `VERIFIED` |
| **BONAFIDE_READY** | Office | Office | `CampusOfficeDocument` | `ISSUED` | Requesting Student | Student | `IMPORTANT` | In-App, PUSH, Email | `/student/certificates` | Other Students | `VERIFIED` |
| **STUDENT_EXIT_CLEARANCE_READY**| Office | Office | `ExitClearanceRecord` | `COMPLETED` | Student, Academic Dean | Student / Dean | `IMPORTANT` | In-App, PUSH, Email | `/student/certificates` | Unrelated Users | `VERIFIED` |

---

## Notification Pipeline & Deduplication Key

1. **Business Event Trigger**: Source module fires event with canonical payload.
2. **Recipient Resolver**: Evaluates target user permissions, course enrolments, hostel bed allocations, transport route assignments, and parent links.
3. **Deduplication Check**: Computes key `eventId:recipientUserId:workspaceContext:eventType`. If active within 5 minutes, suppresses duplicate push delivery.
4. **Scope & Quiet Hours Verification**: Suppresses normal PUSH between 22:00 and 07:00 unless event priority is `CRITICAL`.
5. **Payload Security**: FCM push notifications contain non-sensitive metadata only (`eventType`, `entityId`, `deepLinkRoute`, `priority`). Zero student private data or marks are transmitted in PUSH payloads.
