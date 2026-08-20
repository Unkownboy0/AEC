# CampusOS — Global Action Audit Report: Download, Export, Trash, Restore & Gender

**Audited Systems:** GEETORUS CampusOS Web Platform & Native Android/iOS Shell  
**Scope:** Universal Action Verification Across All 16 Roles, Modals, Document Engines, and Profile Systems  
**Status:** **100% OPERATIONAL & VERIFIED**

---

## 1. Executive Summary & Verification Findings

This audit provides comprehensive verification for every visible file action, download button, export button, document lifecycle transition, and gender identity cascade across CampusOS.

### Core Guarantees & Enforced Invariants
1. **Zero Dead Buttons**: Every visible Download, Export, Save, and Print trigger connects to an authenticated handler producing verified non-empty byte streams (> 0 bytes).
2. **Standardized Content-Types & Security Headers**: All generated PDFs (`application/pdf`), Excel spreadsheets (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`), and CSV datasets (`text/csv`) send explicit `Content-Length`, `X-Content-Type-Options: nosniff`, and non-caching headers (`Cache-Control: private, no-store, max-age=0, must-revalidate`).
3. **Four-Stage Document Lifecycle**:
   $$\text{Active Workspace} \xrightarrow{\text{Soft Delete}} \text{Trash Scope} \xrightarrow{\text{Restore}} \text{Active Workspace} \xrightarrow{\text{Permanent Delete (Authorized)}} \text{Purged}$$
4. **Regulated Record Retention**: Official institutional records (Fee Receipts, Published Exam Results, Regulated Certificates, Audit Trails) cannot be permanently destroyed through user-facing trash actions.
5. **Canonical Gender Identity & Multi-Tier Avatar Cascade**:
   - Single source of truth in `User.gender` synchronized with `Student.gender` and `Faculty.gender`.
   - Normalization: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`, `UNSPECIFIED`.
   - Cascade: `Custom Photo` $\to$ `Gender Default SVG` $\to$ `Neutral Fallback`.

---

## 2. File & Document Action Audit by Portal

### A. Student Portal
* **Digital Student ID Card**:
  - *Trigger:* "Download ID Card" / "Save to Device" in Student ID Card modal.
  - *Endpoint:* `GET /api/enterprise/id-cards/student/:id?`
  - *Format:* PDF (Buffered `pdfkit` vector layout with institution crest, QR validation token, and watermark).
  - *Status:* **WORKING — Non-empty PDF bytes verified.**
* **Certificates & Bonafide Letters**:
  - *Trigger:* "Open" / "Save to Device" in `StudentDocuments.tsx`.
  - *Endpoint:* `GET /api/files/:id/download`
  - *Format:* PDF / Stored Blob.
  - *Status:* **WORKING — Normalized URL path avoids double prefixing.**
* **Fee Receipts & Payment Slips**:
  - *Trigger:* "Download Receipt" in Fee History and Payment Success screens.
  - *Endpoint:* `GET /api/finance/receipts/:id/download`
  - *Format:* PDF with digital invoice stamp.
  - *Status:* **WORKING — Immutable record protected from deletion.**

### B. Faculty & Mentor Portal
* **Digital Faculty ID Card**:
  - *Trigger:* "Download Faculty ID" in Faculty Profile & Settings.
  - *Endpoint:* `GET /api/enterprise/id-cards/faculty/:id?`
  - *Format:* PDF with faculty barcode and security hash.
  - *Status:* **WORKING — Non-empty PDF bytes verified.**
* **Course Materials & Assignments**:
  - *Trigger:* Download attachment / Upload syllabus.
  - *Endpoint:* `GET /api/files/:id/download`
  - *Lifecycle:* Supports Soft Delete $\to$ Trash $\to$ Restore $\to$ Permanent Delete.
  - *Status:* **WORKING — Full 4-stage lifecycle active.**
* **Student Roster & Attendance Exports**:
  - *Trigger:* "Export Class Attendance" / "Export Roster".
  - *Format:* Excel (.xlsx) and CSV (.csv).
  - *Status:* **WORKING — Valid OpenXML & CSV formats.**

### C. HOD Portal (Department Management)
* **Department Student Roster Export**:
  - *Trigger:* "Export Students CSV" in Department Roster.
  - *Endpoint:* `GET /api/hod/reports/export?type=STUDENTS`
  - *Status:* **WORKING — Fixed field mapping and safe null checks.**
* **Department Faculty Directory Export**:
  - *Trigger:* "Export Faculty CSV".
  - *Endpoint:* `GET /api/hod/reports/export?type=FACULTY`
  - *Status:* **WORKING — Generates employee directory CSV.**
* **Department Leaves & Attendance Reports**:
  - *Trigger:* "Export Leaves Report" / "Export Attendance Report".
  - *Endpoint:* `GET /api/hod/reports/export?type=LEAVES` and `type=ATTENDANCE`
  - *Status:* **WORKING — Added endpoints for all 4 HOD report datasets.**

### D. Executive Portals (Principal, Vice Principal, Academic Dean, Admission Dean)
* **Institution Comprehensive Summary Export**:
  - *Trigger:* Export dropdown in Executive Dashboard & Role Portals (`RolePortals.tsx`).
  - *Endpoint:* `GET /api/reports/export?type=...&format=PDF|EXCEL|CSV`
  - *Formats:*
    - **PDF:** Buffered multi-page layout with department summaries and institutional watermark.
    - **Excel (.xlsx):** Multi-sheet workbook with KPI summary and department breakdown.
    - **CSV (.csv):** Clean comma-separated values with corrected filename extensions.
  - *Status:* **WORKING — 100% verified across all formats.**
* **Enterprise Student & Faculty Master Exports**:
  - *Trigger:* Live Data Export in Enterprise Management.
  - *Endpoints:* `GET /api/enterprise/exports/students-excel`, `faculty-excel`, `students-csv`
  - *Status:* **WORKING — Verified with Content-Length and audit logging.**

---

## 3. Delete & Trash Action Verification

| Action | Resource Type | Trigger | Backend Route | Lifecycle Outcome | Retention Safety |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Delete** | Workspace Document | Trash Icon / "Delete" | `DELETE /api/files/:id` | Status $\to$ `TRASHED`, hidden from active list | Safe soft delete |
| **Restore** | Workspace Document | "Restore" in Trash Scope | `PATCH /api/files/:id/restore` | Status $\to$ `ACTIVE`, restored to parent folder | Preserves integrity |
| **Purge** | Workspace Document | "Delete Forever" | `DELETE /api/files/:id/permanent` | Hard delete if zero foreign key references | Blocked if referenced |
| **Delete** | Fee Receipt / Result | Blocked | N/A | Action disabled / endpoint returns 403 | Protected record |
| **Delete** | Audit / Activity Log | Blocked | N/A | Read-only append-only table | Permanent record |

---

## 4. Gender Profile Hardening Verification

* **Stored Fields**:
  - `User.gender`: Canonical single source of truth (`String?`).
  - `Student.gender`: Synchronized in same transaction.
  - `Faculty.gender`: Synchronized in same transaction.
* **Creation Modals**:
  - `EnterpriseUserDirectory.tsx`: Added explicit Gender dropdown with `UNSPECIFIED`, `MALE`, `FEMALE`, `OTHER`, and `PREFER_NOT_TO_SAY`.
  - Bulk Provisioning (`provisioning.service.ts`): Parses `gender` column, normalizes, and assigns to User, Student, and Faculty records.
* **Avatar Cascades**:
  1. If `profileImage.url` exists $\to$ Renders custom photo via authenticated URL.
  2. Else if gender is `MALE` $\to$ Renders `/avatars/default-male.svg`.
  3. Else if gender is `FEMALE` $\to$ Renders `/avatars/default-female.svg`.
  4. Else (or `OTHER` / `PREFER_NOT_TO_SAY` / `UNSPECIFIED`) $\to$ Renders `/avatars/default-neutral.svg` or user initials.
