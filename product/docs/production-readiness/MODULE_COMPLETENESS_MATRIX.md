# CampusOS module completeness matrix

Evidence date: 2026-08-11. `WARNING` means implementation exists but the complete authenticated database/action/platform test has not been demonstrated. `FAIL` means one or more required layers are absent or only represented by generic/placeholder behavior. No row is marked `PASS` from UI or documentation alone.

| Role | Workspace | Frontend | API | DB | RBAC | ABAC | Notification | Realtime | Mobile | Download | Audit | Test | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Administration | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Shared | Partial | Yes | Compile only | WARNING |
| Principal | Executive | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Shared | Partial | Yes | Partial | WARNING |
| Vice Principal | VP / delegated | Yes | Yes | Yes | Yes | Delegation present; full negative matrix pending | Partial | Partial | Shared | Partial | Yes | Partial | WARNING |
| Academic Dean | Academic | Yes | Yes | Yes | Yes | Partial | Partial | Partial | Shared | Partial | Partial | Compile only | WARNING |
| Admission & Administration Dean | Administration + Faculty | Yes | Yes | Partial | Yes | Workspace leakage tests pending | Partial | Partial | Shared | Partial | Partial | Compile only | WARNING |
| IQAC Dean | IQAC + Faculty | Yes | Yes | Yes | Yes | Workspace leakage tests pending | Partial | Partial | Shared | Partial | Yes | Compile only | WARNING |
| COE | Examination | Partial | Generic/partial | Partial | Partial | Not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| HOD | HOD + Faculty | Yes | Yes | Yes | Yes | Department logic present; tampering matrix pending | Partial | Partial | Shared | Partial | Yes | Partial | WARNING |
| Faculty | Faculty | Yes | Yes | Yes | Yes | Allocation scope partial | Partial | Partial | Shared | Partial | Partial | Partial | WARNING |
| Mentor | Mentor + Faculty | Yes | Yes | Yes | Yes | Mentee checks present; complete negative matrix pending | Partial | Partial | Shared | Partial | Partial | Partial | WARNING |
| Student | Student | Yes | Yes | Yes | Yes | Own-record checks present; complete negative matrix pending | Partial | Partial | Shared | Partial | Partial | Partial | WARNING |
| Parent | Parent | Yes | Yes | Yes | Yes | Child-link scope present; complete negative matrix pending | Partial | Partial | Shared | Partial | Partial | Compile only | WARNING |
| Accounts | Accountant / AO | Yes | Yes | Yes | Yes | Financial scope present | Partial | Partial | Shared | Yes | Yes | QA script present | WARNING |
| Office | Administration | Partial | Generic/partial | Partial | Partial | Not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| Placement | Placement | Yes | Partial | Partial | Partial | Eligibility isolation not proven | Partial | Partial | Shared | Partial | Partial | Not proven | WARNING |
| Library | Library | UI routes/pages | Generic/partial | Partial | Partial | Borrower isolation not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| Hostel | Hostel | UI routes/pages | Generic/partial | Partial | Partial | Hosteller-only server enforcement not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| Transport | Transport | UI routes/pages | Generic/partial | Partial | Partial | Assignment scope not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| HR | HR | Partial | Generic/partial | Partial | Partial | Employee privacy not proven | Partial | Partial | Shared | Partial | Partial | Not proven | FAIL |
| Security | Security | Partial | Yes | Partial | Yes | QR/data minimization not end-to-end proven | Partial | Partial | Shared | Partial | Yes | Partial | WARNING |

## Cross-cutting blockers to PASS

- There is no institution/tenant root model or universal `institutionId` scope across domain records, so the requested tenant validation invariant is not currently expressible everywhere.
- File metadata has no owner/institution/resource relationship; the authenticated endpoint is an immediate containment fix, not complete file ABAC.
- Real email, SMS/WhatsApp, push credentials, payment sandbox callbacks, off-site backup and malware scanner are external integrations still requiring controlled configuration and tests.
- Android requires physical/emulator workflow verification. iOS release validation requires macOS/Xcode and must not be inferred from the Windows source tree.
- Existing test files are not exposed through a package test command and do not constitute the required role/action matrix.
