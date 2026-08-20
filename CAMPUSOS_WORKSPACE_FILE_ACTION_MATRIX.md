# CAMPUSOS WORKSPACE & FILE ACTION MATRIX

**Target Subsystems:** Campus Workspace, Document Editor, Files, and Storage Services  
**System:** GEETORUS CampusOS  
**Scope:** Document creation, rich text editing, trash & permanent deletion parity, folder navigation, and workflow decoupling.

---

## 1. Executive Summary

Campus Workspace is a lightweight, collaborative document and folder management system tailored for academic and administrative staff. An audit confirmed that:
1. **Workflow Decoupling:** Regular document drafting, saving, and editing in Campus Workspace does **NOT** spawn unwanted administrative approval requests or workflow blockers.
2. **Trash Lifecycle Parity:** Documents and files moved to Trash are securely hidden from standard directory listings and can be restored or permanently destroyed.
3. **Responsive Mobile Actions:** Document creation, renaming, and export operate seamlessly on touch devices.

---

## 2. File & Document Action Lifecycle Matrix

| Action | User Role | API Endpoint | Behavior / Side Effects | Trash State |
|---|---|---|---|---|
| **Create Document** | All Authorized Roles | `POST /api/documents` | Creates new draft in active workspace folder; no workflow triggered. | `deleted: false`, `isTrash: false` |
| **Update / Autosave** | Owner / Collaborators | `PUT /api/documents/:id` | Saves markdown/HTML content and updates `updatedAt`. | `deleted: false` |
| **Move to Trash** | Owner / Admin | `POST /api/documents/:id/trash` | Soft deletes item; removes from active folder views; retains contents for 30 days. | `isTrash: true`, `trashedAt: now()` |
| **Restore from Trash** | Owner / Admin | `POST /api/documents/:id/restore` | Restores item to its original workspace folder. | `isTrash: false`, `trashedAt: null` |
| **Permanent Delete** | Owner / Admin | `DELETE /api/documents/:id` | Permanently purges document and associated media blocks from database. | PURGED |
| **Upload Attachment** | All Authorized Roles | `POST /api/files/upload` | Validates file size (≤ 8 MB), calculates SHA-256 hash, stores in local uploads directory. | Active |
| **Download File** | All Authorized Roles | `GET /api/files/:id/download` | Binary stream with authentication validation. | Active |
| **Export to PDF** | All Authorized Roles | `GET /api/documents/:id/export` | Compiles document to clean PDF format. | Active |

---

## 3. Workflow Isolation Guarantee
Only designated administrative requests (e.g. Leave, On-Duty, Hall Booking, Budget Requisition, Certificate Issuance) enter the CampusOS Workflow Engine. General workspace documents remain 100% private to the author and their explicit collaborators.
