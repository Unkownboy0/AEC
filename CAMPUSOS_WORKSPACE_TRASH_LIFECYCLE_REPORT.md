# CAMPUSOS — WORKSPACE TRASH & LIFECYCLE REPORT

This report details the Move to Trash, Trash View, Restore, and Permanent Delete lifecycle for Campus Workspace Drive items, folders, and Workspace documents.

---

## 1. Lifecycle State Machine

```
[ Active File / Document ] 
         │
         │  (User selects "Move to Trash")
         ▼
[ In Trash / Quarantined ] ───(Restore)───► [ Restored to Original Folder or Root ]
         │
         │  (Authorized user requests Permanent Delete)
         ▼
[ Reference & Retention Check ]
  ├── Active GovernedFileReference? -> BLOCKED
  ├── Referenced in official receipt/certificate? -> BLOCKED
  └── Item is in Trash AND Zero References? -> PERMITTED
         │
         ▼
[ Quarantined / Permanent Delete ] (Metadata purged / unreferenced storage unlinked)
```

---

## 2. Trash Scoping & Isolation Matrix

| Actor Role | Viewable Active Scope | Viewable Trash Scope | Can Restore | Can Permanently Delete |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Own files in My Drive; Items shared with student | Own trashed items only | Own trashed items | Own trashed unreferenced items |
| **Faculty** | Own files; Shared with faculty; Department files (if granted) | Own trashed items only | Own trashed items | Own trashed unreferenced items |
| **Mentor / Class Adviser** | Own files; Mentoring / Class items | Own trashed items | Own trashed items | Own trashed unreferenced items |
| **HOD** | Own files; Department Drive files; Shared items | Own trashed files + Department shared items (with MANAGE grant) | Own & Department manageable items | Own & Department manageable unreferenced items |
| **Academic / IQAC Dean** | Own files; Institutional Academic / IQAC evidence | Own trashed files + Assigned scope | Own & Scope manageable items | Authorized scope items subject to compliance policy |
| **Principal / VP** | Executive Drive; Institution Drive; All accessible scopes | Own trashed items + Executive shared items | Own & Executive items | Authorized executive items |
| **Super Admin** | Administrative Drive; All workspaces | Administrative Trash scope | All administrative items | Subject to institutional legal retention policy |

---

## 3. Operation Specifications

### A. Move to Trash (Soft Delete)
- **Drive Items**: `GovernedFileService.updateDriveItem(itemId, { isTrashed: true })`
  - Sets `isTrashed: true` and `trashedAt: new Date()`.
  - Item immediately disappears from "My Drive", "Recent", "Starred", and normal Search.
  - Trashed items in folders remain indexed with their historical `parentId` for folder reconstruction upon restore.
- **Workspace Documents**: `WorkspaceDocumentService.deleteDocument(documentId)`
  - Sets `status: 'TRASHED'`, `deletedAt: new Date()`.
  - Excluded from active owned and shared lists.

### B. Trash View
- **Endpoint**: `GET /api/workspace/drive/items?trashed=true` & `GET /api/workspace/documents?status=TRASHED`
- Displays:
  - Item Name & MIME Icon
  - Original Location / Scope
  - Trashed Timestamp (`trashedAt`)
  - File Size
  - Action buttons: **Restore** (green) and **Delete Forever** (red).

### C. Restore
- **Drive Items**: `GovernedFileService.updateDriveItem(itemId, { isTrashed: false })`
  - Clears `isTrashed: false` and `trashedAt: null`.
  - Checks if `parentId` folder still exists and is not trashed. If parent is gone or trashed, item is safely restored to root (`parentId: null`) so it is never lost or orphaned.
- **Workspace Documents**: `WorkspaceDocumentService.restoreDocument(documentId)`
  - Restores status back to `DRAFT`.

### D. Permanent Delete
- **Drive Items**: `DELETE /api/workspace/drive/files/:fileId/items/:itemId/permanent`
  - Must be in Trash first (`isTrashed === true`).
  - Caller must possess `MANAGE` permission or ownership.
  - Queries `GovernedFileReference` and other `CampusDriveItem`s referencing the same binary.
  - If zero active references exist, unlinks storage and purges metadata. If referenced by any module, operation is rejected with `BadRequestException`.
- **Workspace Documents**: `DELETE /api/workspace/documents/:id/permanent`
  - Only author or Super Admin can permanently delete when `status === 'TRASHED'`.
