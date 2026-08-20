# GEETORUS CAMPUSOS — SUPER ADMIN CONTROL REPORT
**Module Focus**: Platform Authority, IAM Master Control Console & Account Lifecycle  
**Date**: August 19, 2026  
**Status**: BUILD VERIFIED  

---

## 1. Executive Summary

Super Admin represents the absolute administrative authority for the Geetorus CampusOS platform. The user-facing administrative **Account Settings** and IAM Master Console are strictly isolated to the Super Admin workspace (`/admin/settings` and `/admin/iam`). All other roles (Student, Faculty, Mentor, HOD, Deans, VP, Principal, Operational staff) only have access to personal user preferences (`/settings`).

---

## 2. Super Admin Capabilities & Controls

| Area | Super Admin Power | Audit & Security Control |
|---|---|---|
| **User Lifecycle Provisioning** | Create Student, Faculty, Staff, Parent, Operational user | 6-step multi-stage provisioning wizard |
| **Profile & Role Editing** | Edit authorized user fields, change department, modify designation | Prominent `ADMINISTRATIVE EDIT MODE (AUDITED)` banner |
| **Role & Workspace Management**| Add/remove roles, assign workspaces, change effective dates | Signed audit record with before/after state capture |
| **Account State Management** | Activate, Deactivate, Lock, Unlock, Secure Credential Reset | Zero raw password exposure; encrypted hash reset flow |
| **Module & Feature Control** | Toggle platform modules (Hostel, Transport, Placement, AI) | Immediate SSE / WebSocket broadcast to connected clients |
| **System Settings Control** | Configure institution policy, branding, session timeout | Guarded behind Super Admin RBAC policy |

---

## 3. 6-Step User Provisioning Wizard Specification

`IAMMasterControlConsole.tsx` implements a non-overwhelming guided wizard:
1. **Step 1 — Personal Identity**: First Name, Last Name, Official Email, Phone, Gender, Date of Birth.
2. **Step 2 — Person Type & Classification**: Student, Employee, Parent / Guardian, Operational Staff.
3. **Step 3 — Academic / Employment Assignment**: Department, Program, Semester/Year, Section, Employee ID / Roll No.
4. **Step 4 — Role & Workspace Provisioning**: Primary Role selection, Additional Assigned Roles, Workspace Access.
5. **Step 5 — Module Permissions**: Fine-grained feature module enablement.
6. **Step 6 — Review & Provision User**: Complete parameter audit summary before database commit.

---

## 4. Domain Data Ownership & Integrity Guard

- Super Admin cannot arbitrarily edit derived institutional data (such as CGPA, fee balance, attendance percentage, or library fine totals) via generic profile edits.
- All derived metrics must originate from their respective canonical workflows (Result publication, Fee collection, Class roll-call, Library circulation).

---

## 5. Security & Negative Route Tests

| Test Case | Attempted Action | Expected Result | Verified Result |
|---|---|---|---|
| **Student** | Access `/admin/account-settings` | 403 Forbidden | TEST VERIFIED |
| **Faculty** | Access `/admin/account-settings` | 403 Forbidden | TEST VERIFIED |
| **HOD** | Access `/admin/account-settings` | 403 Forbidden | TEST VERIFIED |
| **Principal** | Access `/admin/account-settings` | 403 Forbidden | TEST VERIFIED |
| **Super Admin** | Access `/admin/account-settings` | 200 OK Allowed | TEST VERIFIED |

---

## 6. Verification Status
- **Super Admin IAM Console**: BUILD VERIFIED
- **Administrative Account Settings Isolation**: TEST VERIFIED
- **Create User Wizard (6 Steps)**: BUILD VERIFIED
