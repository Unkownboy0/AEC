# CampusOS — Notification Actor & Event Matrix

Comprehensive matrix mapping every notification event type in CampusOS to its actor resolution, avatar presentation, fallback cascade, target recipients, deep link routing, and acknowledgment behavior.

| Event Type | Category | Actor Identity (WHO) | Actor Type | Profile Avatar Source | Fallback Cascade | Target Recipient | Deep Link Route | Ack Required | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STUDENT_LEAVE_SUBMITTED` | `APPROVALS` | Student Full Name | `HUMAN` | Student profile photo / fileId | Gender -> Initials | Faculty Mentor | `/faculty/leave-od/:id` | No | `IMPLEMENTED` |
| `STUDENT_LEAVE_MENTOR_APPROVED`| `APPROVALS`| Mentor Full Name | `HUMAN` | Mentor profile photo / fileId | Gender -> Initials | Student & HOD | `/student/leave-od` | No | `IMPLEMENTED` |
| `STUDENT_LEAVE_FORWARDED` | `APPROVALS` | Mentor / Reviewer | `HUMAN` | Reviewer profile photo / fileId| Gender -> Initials | HOD | `/hod/approvals` | Yes | `IMPLEMENTED` |
| `STUDENT_LEAVE_APPROVED` | `APPROVALS` | HOD Full Name | `HUMAN` | HOD profile photo / fileId | Gender -> Initials | Student | `/student/leave-od` | Yes | `IMPLEMENTED` |
| `STUDENT_LEAVE_REJECTED` | `APPROVALS` | Reviewer Full Name | `HUMAN` | Reviewer profile photo / fileId| Gender -> Initials | Student | `/student/leave-od` | Yes | `IMPLEMENTED` |
| `STUDENT_OD_SUBMITTED` | `APPROVALS` | Student Full Name | `HUMAN` | Student profile photo / fileId | Gender -> Initials | Mentor | `/faculty/leave-od/:id` | No | `IMPLEMENTED` |
| `FACULTY_LEAVE_SUBMITTED` | `APPROVALS` | Faculty Full Name | `HUMAN` | Faculty profile photo / fileId | Gender -> Initials | HOD | `/hod/approvals` | No | `IMPLEMENTED` |
| `FACULTY_LEAVE_APPROVED` | `APPROVALS` | Principal / VP | `HUMAN` | Executive profile photo / fileId| Gender -> Initials| Faculty | `/faculty/leave-od/:id`| Yes | `IMPLEMENTED` |
| `DOCUMENT_SHARED` | `TASKS` | Author Full Name | `HUMAN` | Author profile photo / fileId | Gender -> Initials | Shared User / Role | `/workspace/docs/:id` | No | `IMPLEMENTED` |
| `DOCUMENT_REVIEW_REQUESTED` | `APPROVALS` | Author Full Name | `HUMAN` | Author profile photo / fileId | Gender -> Initials | HOD / Dean | `/workspace/docs/:id` | Yes | `IMPLEMENTED` |
| `TASK_ASSIGNED` | `TASKS` | Assigner Full Name | `HUMAN` | Assigner profile photo / fileId| Gender -> Initials | Assignee | `/tasks/:id` | Yes | `IMPLEMENTED` |
| `TASK_COMPLETED` | `TASKS` | Assignee Full Name | `HUMAN` | Assignee profile photo / fileId| Gender -> Initials | Assigner | `/tasks/:id` | No | `IMPLEMENTED` |
| `CIRCULAR_PUBLISHED` | `CIRCULARS` | Admin / Authority | `HUMAN` | Author profile photo / fileId | Gender -> Initials | Target Audience | `/circulars/:id` | No | `IMPLEMENTED` |
| `COMPLAINT_SUBMITTED` | `COMPLAINTS`| Complainant | `HUMAN` | Submitter profile photo / fileId| Gender -> Initials | Officer In-charge | `/complaints/:id` | Yes | `IMPLEMENTED` |
| `PRINCIPAL_DELEGATION_ACTIVATED`| `APPROVALS`| Principal Full Name| `HUMAN` | Principal profile photo / fileId| Gender -> Initials| Vice Principal | `/vp/dashboard` | Yes | `IMPLEMENTED` |
| `CAMPUS_ANNOUNCEMENT` | `CIRCULARS` | Administration | `HUMAN` | Author profile photo / fileId | Gender -> Initials | All Campus | `/circulars` | No | `IMPLEMENTED` |
| `EMERGENCY_ALERT` | `CRITICAL` | `CampusOS System` | `SYSTEM` | Institution Alert Shield Icon | System Icon (No human)| All Users | `/emergency` | Yes | `IMPLEMENTED` |
| `SECURITY_ALERT` | `CRITICAL` | `CampusOS System` | `SYSTEM` | Institution Alert Shield Icon | System Icon (No human)| Administrators | `/security` | Yes | `IMPLEMENTED` |
| `FEE_REMINDER_AUTOMATED` | `FEES` | `CampusOS System` | `SYSTEM` | Fee Module Icon | System Icon (No human)| Student / Parent | `/fees` | No | `IMPLEMENTED` |
| `TIMETABLE_CHANGED` | `ACADEMIC` | Faculty / HOD | `HUMAN` | Faculty profile photo / fileId | Gender -> Initials | Section Students | `/timetable` | No | `IMPLEMENTED` |
| `ATTENDANCE_SHORTAGE_DETECTED` | `ACADEMIC` | `CampusOS System` | `SYSTEM` | Academic Module Icon | System Icon (No human)| Student / Mentor | `/attendance` | Yes | `IMPLEMENTED` |

---

## Key Rules
1. **Never Fake Human Avatars**: Automated alerts always use `actorType: 'SYSTEM'` with the institutional system/module icon.
2. **Actor vs. Subject Clarity**: Multi-tier approvals clearly distinguish the Actor (the reviewer making the decision) from the Subject (the requester).
3. **Graceful Asset Resolution**: All profile photos pass through the asset resolver with automatic fallback to gender-specific vector avatars (`/avatars/default-male.svg`, `/avatars/default-female.svg`, `/avatars/default-neutral.svg`) and initials.
