# Campus Workspace — Web & Mobile Parity Matrix

## 1. Executive Summary

Campus Workspace provides 100% parity across Desktop Web, Android Native APK, and iOS Native / PWA. Both web and mobile clients interface with the identical unified backend API routes, database schemas, access control models, and document lifecycles.

---

## 2. Feature & Capability Parity Matrix

| Feature / Capability | Desktop Web | Android Native | iOS Mobile / PWA | Backend Schema / API Model |
| :--- | :---: | :---: | :---: | :--- |
| **Authentication & RBAC** | ✅ Full | ✅ Full | ✅ Full | Bearer JWT / Cookie session + Prisma User |
| **Active Workspace Context** | ✅ Full | ✅ Full | ✅ Full | Multi-tenant tenant/role isolation |
| **Document Listing & Search** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents` |
| **Create Campus Docs** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents` (`type: DOC`) |
| **Create Campus Sheets** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents` (`type: SHEET`) |
| **Create Campus Slides** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents` (`type: SLIDE`) |
| **Create Campus Forms** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents` (`type: FORM`) |
| **Create Campus Notes** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents` (`type: NOTE`) |
| **Drive Folder Creation** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/drive/items` (`isFolder: true`) |
| **Drive File Upload** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/drive/files/upload` |
| **Autosave & Save Indicator** | ✅ Full | ✅ Full | ✅ Full | `PUT /api/workspace/documents/:id` (Saved / Saving / Unsaved) |
| **Rename Asset** | ✅ Full | ✅ Full | ✅ Full | `PUT /api/workspace/documents/:id` |
| **Share (View, Comment, Edit)** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents/:id/share` |
| **In-App & Push Share Alerts** | ✅ Full | ✅ Full | ✅ Full | FCM Push + In-App `DOCUMENT_SHARED` notification |
| **Move to Trash (Soft Delete)** | ✅ Full | ✅ Full | ✅ Full | `DELETE /api/workspace/documents/:id` (`status: TRASHED`) |
| **Trash Management Tab** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents?status=TRASHED` |
| **Restore from Trash** | ✅ Full | ✅ Full | ✅ Full | `POST /api/workspace/documents/:id/restore` |
| **Permanent Delete** | ✅ Full | ✅ Full | ✅ Full | `DELETE /api/workspace/documents/:id/permanent` |
| **Export PDF** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents/:id/export/pdf` |
| **Export DOCX** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents/:id/export/docx` |
| **Export XLSX / CSV** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents/:id/export/xlsx` |
| **Export PPTX** | ✅ Full | ✅ Full | ✅ Full | `GET /api/workspace/documents/:id/export/pptx` |
| **Download Stream Handler** | Browser `<a>` | Capacitor FileSystem + Share Sheet | Safari Share / Save | Unified `downloadBlob` & `saveBlobAndOpen` pipeline |
| **Institutional Template Binding** | ✅ Full | ✅ Full | ✅ Full | Header/footer logo watermarking + dynamic campus variables |
| **Audit Trail Logging** | ✅ Full | ✅ Full | ✅ Full | `AuditLog` row for create, edit, share, delete, restore |

---

## 3. Data Integrity & Single Source of Truth

* **Zero Duplicate Databases**: Mobile apps connect directly to the central PostgreSQL database via the unified REST API.
* **Shared Identifiers**: A document created on Android has the exact same `id`, `ownerId`, `currentVersion`, `createdAt`, and `updatedAt` as viewed on Desktop Web.
* **State Synchronization**: Updates made from mobile are instantly visible on web upon reload or background refetch.
