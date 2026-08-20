# CAMPUSOS GLOBAL DOWNLOAD & EXPORT MATRIX

**Target Subsystem:** Universal File Downloader & Native FileProvider Integration  
**System:** GEETORUS CampusOS  
**Scope:** Authenticated binary downloads, mobile sharing, PDF generation, CSV/Excel exports, and Cloud Storage decoupling.

---

## 1. Universal Download Pipeline Architecture

CampusOS implements a secure, cross-platform file download service in `product/client/src/platform/download.ts`:
1. **Authenticated Axios Request:** Downloads binary data using the user's active session JWT (`Authorization: Bearer <token>`).
2. **Error Boundary & JSON Detection:** Checks if the server response is an error payload (e.g. `{ "error": "Not Authorized" }`) rather than raw binary data, preventing corrupted files from being saved.
3. **MIME Type & Filename Resolution:** Inspects the `Content-Disposition` header or falls back to an explicit filename, prefixing with `CampusOS_` for clear device folder organization.
4. **Android Native FileProvider & System Share:**
   - Files are written to the app cache directory via `@capacitor/filesystem`.
   - The file is converted to a secure `content://` URI and passed to the native Android Intent system via `@capacitor/share`.
   - The system share sheet allows the user to Open, Save to Downloads, Print, or Share to WhatsApp/Drive/Gmail without external cloud storage uploads.
5. **Web Fallback:** On web browsers, the binary is converted to an `ObjectUrl` and triggered via a temporary `<a>` anchor download element.

---

## 2. Complete Document & Report Export Matrix

| Module | Export / Document Type | Client Route | Backend API Endpoint | Output Format | Native Share Support |
|---|---|---|---|---|---|
| **Student Finance** | Fee Payment Receipt | `/fees` | `GET /api/enterprise/fees/student/payments/:id/receipt` | PDF | YES |
| **Student Academics** | Semester Grade Card | `/student/results` | `GET /api/student/academics/grade-card/:sem` | PDF | YES |
| **Student Identity** | Digital ID Card | `/student/id-card` | Rendered + Canvas PNG / Print | PDF / PNG | YES |
| **Faculty Leave** | Leave / OD Approval Slip | `/faculty/leave-od` | `GET /api/workflow/requests/:id/pdf` | PDF | YES |
| **COE (Exams)** | Exam Hall Ticket | `/coe/hall-tickets` | `GET /api/coe/hall-tickets/:id/download` | PDF | YES |
| **COE (Exams)** | Consolidated Marks Sheet | `/coe/marks` | `GET /api/coe/marks/export?format=xlsx` | XLSX | YES |
| **HOD Workspace** | Department Faculty Workload | `/hod/reports` | `GET /api/hod/reports/faculty-workload` | CSV / XLSX | YES |
| **HOD Workspace** | Department Attendance Summary | `/hod/reports` | `GET /api/hod/reports/attendance-summary` | CSV / PDF | YES |
| **Campus Workspace**| Exported Document | `/workspace` | `GET /api/documents/:id/export` | PDF / DOCX | YES |
| **Super Admin** | System Audit Log | `/admin/audit` | `GET /api/admin/audit/export` | CSV | YES |

---

## 3. Strict Decoupling from Cloud Storage
- No downloads, exports, or document views trigger unwanted cloud uploads or external third-party storage syncs.
- All file operations occur strictly between the authenticated CampusOS backend and local device storage.
