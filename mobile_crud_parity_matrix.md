# Mobile CRUD Parity Matrix — GEETORUS CAMPUSOS

## Audit Overview
This matrix verifies complete action parity between Web and Capacitor Mobile platforms across all user roles and system modules without breaking existing backend API contracts.

---

## Role-by-Role CRUD Matrix

| Role | Module | Page | Create Web | Create Mobile | Read Web | Read Mobile | Update Web | Update Mobile | Delete Web | Delete Mobile | Backend API Endpoint | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Student** | Profile | `/student/profile` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/profile` | **VERIFIED** |
| **Student** | Leave | `/student/leave-od` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/leave` | **VERIFIED** |
| **Student** | OD | `/student/leave-od` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/od` | **VERIFIED** |
| **Student** | Assignments | `/student/assignments` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/assignments/submit` | **VERIFIED** |
| **Student** | Complaints | `/student/complaints` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/complaints` | **VERIFIED** |
| **Student** | Tasks | `/student/tasks` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/student/tasks` | **VERIFIED** |
| **Student** | Messages | `/student/messages` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | `/messages` | **VERIFIED** |
| **Faculty** | Attendance | `/faculty/attendance` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/faculty/attendance` | **VERIFIED** |
| **Faculty** | Assignments | `/faculty/assignments` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/faculty/assignments` | **VERIFIED** |
| **Faculty** | Marks | `/faculty/marks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/faculty/marks` | **VERIFIED** |
| **Faculty** | Resources | `/faculty/resources` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/faculty/resources` | **VERIFIED** |
| **Faculty** | Tasks | `/faculty/tasks` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/faculty/tasks` | **VERIFIED** |
| **Faculty** | Leave / OD | `/faculty/leave` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/faculty/leave` | **VERIFIED** |
| **Faculty** | Mentor Actions| `/faculty/mentor` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/mentor/approvals` | **VERIFIED** |
| **HOD** | Approvals | `/hod/approvals` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/hod/approvals` | **VERIFIED** |
| **HOD** | Tasks | `/hod/tasks` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/hod/tasks` | **VERIFIED** |
| **HOD** | Circulars | `/hod/circulars` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/hod/circulars` | **VERIFIED** |
| **HOD** | Complaints | `/hod/complaints` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/hod/complaints` | **VERIFIED** |
| **Principal**| Approvals | `/principal/approvals`| ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/principal/approvals` | **VERIFIED** |
| **Principal**| Delegation | `/principal/delegation`| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `/principal/availability` | **VERIFIED** |
| **VP** | Acting Principal| `/vp/acting-principal`| ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | `/vp/acting-principal` | **VERIFIED** |

---

## Parity Summary
- **Total Modules Audited**: 21
- **100% Mobile Parity Achieved**: YES
- **Backend API Modded**: 0 (Strict Preservation Rule satisfied)
