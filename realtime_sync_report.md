# Realtime Sync Report — GEETORUS CAMPUSOS

## System Architecture
Realtime synchronization between Web and Mobile clients is governed by `src/realtime/query-invalidation-map.ts` and `RealtimeProvider.tsx`. Backend WebSocket events trigger query key invalidations rather than local-only state mutations.

---

## Event Invalidation Mapping

| Event Name | Trigger Source | Invalidated Query Keys | Web Update | Mobile Update | Status |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `attendance:marked` | Faculty App / Web | `['attendance']`, `['student', 'attendance']`, `['hod', 'availability']` | Instant | Instant | **VERIFIED** |
| `leave:created` | Student App / Web | `['leave']`, `['approvals']`, `['hod', 'availability']`, `['student', 'leave']` | Instant | Instant | **VERIFIED** |
| `leave:approved` | Mentor / HOD App | `['leave']`, `['approvals']`, `['hod', 'availability']`, `['student', 'leave']` | Instant | Instant | **VERIFIED** |
| `task:updated` | Dean / HOD / Faculty | `['tasks']`, `['faculty', 'tasks']`, `['hod', 'tasks']` | Instant | Instant | **VERIFIED** |
| `circular:published`| HOD / Principal | `['circulars']`, `['student', 'circulars']`, `['faculty', 'circulars']` | Instant | Instant | **VERIFIED** |
| `message:sent` | Any Role | `['messages']`, `['unread-counts']` | Instant | Instant | **VERIFIED** |
| `notification:sent` | Backend | `['notifications']`, `['unread-counts']` | Instant | Instant | **VERIFIED** |

---

## Verification Summary
- **Manual Count Mutations**: Removed (0 found).
- **Web ↔ Mobile Race Conditions**: Prevented by server query refetching.
