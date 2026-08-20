# GEETORUS CampusOS — Mobile Release Regression Matrix

**Release Version**: `v1.0.4` (Build Code: `5`)  
**Target Environment**: Android 8.0+ (API 26+) · iOS 14.0+ · Web PWA  
**Audit Date**: 2026-08-19  
**Verdict**: **READY FOR INTERNAL TESTING / RELEASE CANDIDATE**

---

## 1. Core Authentication & Identity Lifecycle

| Platform | OS Version | Role | Workspace | Feature | Expected | Actual | Web/API | Native | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Android | 8.0 - 15+ | All Roles | Default | Native Login & Session Restore | Secure token saved in Android Keystore / iOS Keychain, restores without prompt | Restores authenticated session cleanly from encrypted store | PASS | PASS | TEST VERIFIED | `native_secure_storage_regression.test.ts` (15/15 OK) |
| Android | 8.0 - 15+ | All Roles | Multiple | Workspace Switching | Seamlessly switches tenant context without credentials re-entry | Immediate workspace context update & tenant isolation | PASS | PASS | TEST VERIFIED | `production_smoke_matrix.test.ts` (Blocker #1 PASS) |
| Android / iOS | 8.0+ / 14.0+ | All Roles | Active | Role Switching | Authorized users switch active role instantly | Role-specific views & navigation re-rendered without logout | PASS | PASS | TEST VERIFIED | `production_smoke_matrix.test.ts` (Blocker #2 PASS) |
| Android / iOS | 8.0+ / 14.0+ | All Roles | Active | Profile & Avatar Display | Custom photo > Gender fallback > Neutral avatar | Canonical priority strictly enforced; instant reflection | PASS | PASS | TEST VERIFIED | `global_download_trash_and_gender.test.ts` (All PASS) |
| Android / iOS | 8.0+ / 14.0+ | All Roles | Active | Gender Integrity | MALE / FEMALE / OTHER validated; unchangeable without admin approval | Immutable in self-service profile update | PASS | PASS | TEST VERIFIED | `global_download_trash_and_gender.test.ts` |
| Android / iOS | 8.0+ / 14.0+ | All Roles | Active | System Theme Sync | Follows system dark/light mode dynamically at runtime | Synchronizes immediately via media query & ThemeContext | PASS | PASS | STATICALLY VERIFIED | `ThemeContext.tsx` & `index.html` inline script |
| Android / iOS | 8.0+ / 14.0+ | All Roles | Active | Logout & Token Purge | Clears Keystore, Keychain, local memory, and server session | Atomic revocation; 0 token leakage in logs | PASS | PASS | TEST VERIFIED | `native_secure_storage_regression.test.ts` |

---

## 2. Mobile Responsive Layout & UI Parity

| Platform | Widths | Role | Feature | Expected | Actual | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Android / iOS | 320px, 360px, 375px, 390px, 412px, 430px | All Roles | Mobile Role Greeting Header | Context-aware greeting (`Good Morning, [Name]`), semester badge, profile avatar | Renders exclusively on mobile screens; never leaks onto desktop web | TEST VERIFIED | `mobile_role_header_and_true_badges.test.ts` |
| Android / iOS | 320px - 430px | All Roles | True Badges Engine | Red badge/dot appears ONLY for unread/action-required items; hides when 0 | Unread count vs action-required count strictly separated; zero-dot suppression | TEST VERIFIED | `mobile_role_header_and_true_badges.test.ts` |
| Android / iOS | 320px - 430px | All Roles | Safe Area System Bars | Edge-to-edge system bars (Android 15+ insets & iOS Notch/Island) | Uses CSS variable injection `--safe-area-inset-*` via SystemBars plugin | BUILD VERIFIED | `capacitor.config.ts` (Capacitor 8.5) |
| Android / iOS | 320px - 430px | All Roles | Responsive Touch Targets | All tap targets $\ge$ 44x44px; no cut buttons or broken cards | Validated across mobile layouts | IMPLEMENTED | Tailwind design tokens & mobile primitives |

---

## 3. Role-Aware Notifications & Deep Links

| Event Type | Trigger Actor | Authorized Target Recipient | Filter / Isolation Rules | Deep Link | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STUDENT_LEAVE_SUBMITTED` | Student | Assigned Class Mentor | Department & Section scoped | `/faculty/leave-od/:id` | TEST VERIFIED | `role_aware_notification_routing.test.ts` (39/39 PASS) |
| `STUDENT_LEAVE_FORWARDED` | Mentor | Department HOD | Unrelated department HOD receives NOTHING | `/hod/leave-approvals/:id` | TEST VERIFIED | `role_aware_notification_routing.test.ts` |
| `FACULTY_LEAVE_RECOMMENDED` | HOD | Principal (+ Acting VP if delegated) | Unrelated HODs receive NOTHING; VP filtered by active delegation | `/principal/approval-center` | TEST VERIFIED | `role_aware_notification_routing.test.ts` |
| `HOSTEL_MESS_NOTICE` | Warden | Active Hostellers ONLY | Day scholars receive 0 notices (negative filter verified) | `/student/hostel` | TEST VERIFIED | `role_aware_notification_routing.test.ts` |
| `TRANSPORT_DELAY` | Transport Mgr | Bus-Registered Students ONLY | Non-bus users receive 0 notices (negative filter verified) | `/student/transport` | TEST VERIFIED | `role_aware_notification_routing.test.ts` |
| `ACADEMIC_COMPLAINT_SUBMITTED` | Student / Staff | Operating HOD + A&A Dean (if escalated) | Unrelated HODs receive NOTHING | `/hod/tasks` | TEST VERIFIED | `role_aware_notification_routing.test.ts` |

---

## 4. Governed File Pipeline, Download & Trash Life Cycle

| File Type | Generator / Endpoint | Byte Integrity & Watermark | Trash Policy | Retention Policy | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Student ID Card PDF** | `/api/enterprise/student/:id/id-card` | 241,679 bytes, valid `%PDF-1.4` header, official crest & watermark | Immutable institutional record | Permanent audit record | TEST VERIFIED | `file_document_lifecycle_and_pdf_integrity.test.ts` |
| **Fee Receipt PDF** | `/api/enterprise/fee-receipt/:id/pdf` | 237,953 bytes, official logo, verified signature | Immutable financial ledger | Permanent audit record | TEST VERIFIED | `file_document_lifecycle_and_pdf_integrity.test.ts` |
| **Attendance Report PDF** | `/api/enterprise/attendance/report/pdf` | 238,817 bytes, official logo, live student records | Dynamic operational report | Cached 30 days | TEST VERIFIED | `file_document_lifecycle_and_pdf_integrity.test.ts` |
| **Campus Workspace Documents** | `/api/workspace/documents` | State-synchronized JSON / Markdown / Binary document models | Move to Trash $\to$ Restore $\to$ Permanent Delete | 30-day soft trash retention | TEST VERIFIED | `global_download_trash_and_gender.test.ts` |
| **Drive Files & Uploads** | `/api/drive/files` | MIME-type & extension validation, scoped storage | Trash with `trashedAt` timestamp | User recoverable | TEST VERIFIED | `global_download_trash_and_gender.test.ts` |

---

## 5. High-Impact Academic & Administrative Workflows

| Module | Roles Involved | Scenarios Tested | Status | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **HOD Timetable Management** | HOD, Faculty, Dean | Subject allocation, faculty workload balance, room collisions, lab blocks, w.e.f. effective dates, issue reporting | TEST VERIFIED | `hod_timetable_management_suite.test.ts` (6/6 OK) |
| **Faculty Leave & Auto-Substitution** | Faculty, Mentor, HOD, Principal, VP | Timetable collision detection, substitute busy/free checks, double-booking prevention, idempotent ledger debit | TEST VERIFIED | `leave_od_substitution_e2e.test.ts` (14/14 OK) |
| **COE Exam Schedules & Results** | COE, Admin, Faculty, Student | Hall allocation, capacity enforcement, invigilator conflicts, weighted 10-pt GPA/CGPA, draft result isolation | TEST VERIFIED | `coe_results_e2e.test.ts` (15/15 OK) |
| **Principal $\to$ VP Delegation** | Principal, Vice Principal | Time-windowed delegation, scope category checks, financial threshold limits, automatic return on Principal available | TEST VERIFIED | `delegation_e2e.test.ts` (18/18 OK) |
| **Fee Installments & Transactions** | Parent, Student, Accountant | Idempotency keys, provider replay attack blocking, concurrent double-verify protection, serializable transactions | TEST VERIFIED | `payment_idempotency_policy.test.ts` (10/10 OK) |
