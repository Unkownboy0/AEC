# CampusOS — Notification Actor Avatar & Identity Report

## Overview
This report documents the end-to-end implementation of profile-aware actor avatars across all person-triggered notifications in CampusOS, standardizing fallback cascades and distinguishing human actors from system alerts.

---

## Actor Enrichment Architecture

### 1. Payload Normalization
`NotificationService.enrichNotificationsWithSenderDetails` attaches normalized actor metadata to every notification record:
- `actorUserId`: Unique user identifier of the actor.
- `actorDisplayName`: Formatted human name (e.g. `Arun Kumar`, `Suresh Kumar`).
- `actorRole`: Functional institutional role (e.g. `Student`, `Faculty Mentor`, `Head of Department`, `Principal`).
- `actorProfileImage`: Asset URL (e.g. `/api/files/:fileId/content` or custom photo URL).
- `actorGender`: Gender token (`MALE`, `FEMALE`, `OTHER`) for gender-aware avatar fallbacks.
- `actorType`: Explicit identity classification (`HUMAN` | `SYSTEM`).
- `subjectName` & `subjectRole`: For multi-party workflows (e.g. Mentor reviewing a student's leave), identifies the subject of the request.

---

## Profile Avatar Priority Cascade

When rendering person-triggered notifications in `UnifiedNotificationInbox.tsx`, the shared `ProfileAvatar` component resolves the visual asset in strict priority order:

1. **Custom Uploaded Photo**:
   - Resolved via `/api/files/:fileId/content` or direct URL.
   - Handled with network error fallback (no broken image icon).
2. **Gender-Aware Default Avatar**:
   - `MALE` / `M` -> `/avatars/default-male.svg`
   - `FEMALE` / `F` -> `/avatars/default-female.svg`
   - `OTHER` / `PREFER_NOT_TO_SAY` -> `/avatars/default-neutral.svg`
3. **Deterministic Initials Badge**:
   - 2-letter uppercase initials with deterministic background hue based on name hash.

---

## System vs. Human Event Differentiation

| Event Domain | Trigger Type | Actor Identity Displayed | Avatar / Icon Style |
| :--- | :--- | :--- | :--- |
| **Student Leave / OD** | Human (Student / Mentor / HOD) | Student / Mentor Full Name + Role | Circular `ProfileAvatar` + Category badge |
| **Faculty Leave** | Human (Faculty / HOD / Principal)| Faculty / HOD Full Name + Role | Circular `ProfileAvatar` + Category badge |
| **Campus Workspace** | Human (Author / Editor) | Document Author Name + Role | Circular `ProfileAvatar` + Category badge |
| **Task Assignment** | Human (Creator / Assigner) | Task Assigner Name + Role | Circular `ProfileAvatar` + Category badge |
| **Institutional Circular** | Human (Author / Admin) | Author Name + Administration | Circular `ProfileAvatar` + Category badge |
| **Complaint / Grievance**| Human (Complainant / Resolver)| Submitter / Resolver Name + Role | Circular `ProfileAvatar` + Category badge |
| **Emergency / Security** | System Alert | `CampusOS System Alert` | Institutional Alert Shield Icon (No fake human avatar) |
| **Automated Job / Sync** | System Alert | `CampusOS System` | Module Icon (No fake human avatar) |

---

## Verification Status
- **Actor Resolution Engine**: `BUILD VERIFIED`
- **Gender Fallback Cascade**: `BUILD VERIFIED`
- **System Icon Isolation**: `BUILD VERIFIED`
- **ProfileAvatar Integration**: `BUILD VERIFIED`
