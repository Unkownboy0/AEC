# CampusOS — Global Delete & Trash Policy Matrix

This matrix documents the deletion, soft-delete (trash), restoration, permanent deletion, and retention policy for every data and resource type in CampusOS.

| Module | Resource / Entity Type | Primary Owner | Delete Visible in UI | Moves to Trash (Soft Delete) | Can be Restored | Permanent Delete Allowed | Retention & Immutability Rules | Reference Integrity Check | Authorization Scope | Policy Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Campus Drive** | Workspace Document | File Creator / Admin | ✅ Yes | ✅ Yes (`status=TRASHED`) | ✅ Yes (`status=ACTIVE`) | ✅ Yes (If unreferenced) | 30-day soft-retention before auto-purge | Must have 0 active attachments | File Owner or College Admin | **ENFORCED** |
| **Campus Workspace**| Collaborative Note / File | Author / Contributor | ✅ Yes | ✅ Yes (`status=TRASHED`) | ✅ Yes (`status=ACTIVE`) | ✅ Yes (Authorized only) | Retains revision history until purged | Version history checks | Author or Workspace Admin | **ENFORCED** |
| **Student Portal** | Uploaded Leave Proof / Doc | Student | ✅ Yes (Drafts only) | ✅ Yes | ✅ Yes | ✅ Yes (Before submission) | Retained upon workflow approval | Locked once approved by Faculty/HOD | Student Owner | **ENFORCED** |
| **Faculty Portal** | Course Material / Syllabus | Faculty Member | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes (If not published) | Retained for academic audit term | Referenced in course curriculum | Faculty Author or HOD | **ENFORCED** |
| **User Directory** | User Account | Admin | ✅ Yes ("Deactivate") | ✅ Yes (`status=INACTIVE`) | ✅ Yes ("Reactivate") | ❌ No physical purge | Account records retained for audit trail | Retained in audit & activity logs | Super Admin / College Admin | **ENFORCED** |
| **Finance** | Fee Receipt / Invoice | Student / Institution | ❌ No | ❌ No | ❌ N/A | ❌ **FORBIDDEN** | Regulated financial record — Permanent immutability | Cryptographically verifiable transaction | View/Download Only | **LOCKED** |
| **Finance** | Online Payment Transaction | System / Gateway | ❌ No | ❌ No | ❌ N/A | ❌ **FORBIDDEN** | Statutory ledger requirement | Gateway transaction token | Audit Only | **LOCKED** |
| **COE Exam Cell** | Published Grade / Result | Controller of Exams | ❌ No | ❌ No | ❌ N/A | ❌ **FORBIDDEN** | Official academic credential — Permanent immutability | Historical transcript lock | COE / Principal Only | **LOCKED** |
| **COE Exam Cell** | Result Sheet Draft | Exam Evaluator | ✅ Yes (Drafts only) | ✅ Yes | ✅ Yes | ✅ Yes (Pre-publishing) | Only unapproved drafts may be deleted | Blocked if marks published | Exam Cell Officer | **ENFORCED** |
| **HR / Faculty** | Relieving / Service Letter | Faculty / HR | ❌ No | ❌ No | ❌ N/A | ❌ **FORBIDDEN** | Employment & compliance record | Reference in HR ledger | HR / Principal Only | **LOCKED** |
| **System** | Audit Log / Activity Trail | System Logger | ❌ No | ❌ No | ❌ N/A | ❌ **FORBIDDEN** | Read-only append-only table — Never deleted | Forensic audit preservation | Read-Only | **LOCKED** |
| **System** | Notification Record | Recipient User | ✅ Yes ("Clear") | ✅ Yes (`isRead=true`) | ❌ N/A | ✅ Yes ("Clear All") | Dismissal only hides from active bell | None | Target Recipient User | **ENFORCED** |

---

## Technical Deletion Rules & Workflow

1. **Four-Stage Soft-Delete Cycle**:
   - `DELETE /api/files/:id` marks `deleted=true` and sets `status='TRASHED'`.
   - `GET /api/files?scope=TRASH` returns all trashed records for the user.
   - `PATCH /api/files/:id/restore` restores the item to active status. If parent folder was trashed, falls back to workspace root.
   - `DELETE /api/files/:id/permanent` physically purges the file record ONLY after checking foreign key references.

2. **Immutable Record Guard**:
   - Endpoints attempting to delete or overwrite Finance receipts, published Exam grades, or User audit logs reject the request with HTTP 403 Forbidden.
