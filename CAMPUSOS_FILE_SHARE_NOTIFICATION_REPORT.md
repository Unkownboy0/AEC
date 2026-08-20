# CAMPUSOS — FILE & DOCUMENT SHARING & NOTIFICATION REPORT

This report specifies the file and document sharing pipeline, permission levels, notification delivery mechanisms, and deep link routing for Campus Workspace.

---

## 1. Sharing Principals & Permission Levels

| Principal Type | Target Identifier | Allowed Access Levels | Description |
| :--- | :--- | :--- | :--- |
| `SPECIFIC_USER` | `userId` (UUID) | `VIEW`, `COMMENT`, `EDIT`, `MANAGE` | Direct 1-to-1 document or file sharing with another user |
| `ROLE` | `roleName` (e.g. `Faculty`, `HOD`) | `VIEW`, `COMMENT`, `EDIT` | Shared with all members holding the designated role |
| `DEPARTMENT` | `departmentId` | `VIEW`, `COMMENT`, `EDIT` | Shared across all faculty/students of a department |
| `WORKSPACE` | `workspaceName` | `VIEW`, `COMMENT`, `EDIT` | Shared within an active workspace (e.g. `IQAC`, `COE`) |
| `ALL_INSTITUTION` | `null` | `VIEW` | Campus-wide broadcast (restricted to Principal/Admin) |

---

## 2. Notification Dispatch & Deep Link Routing

When a document or Drive item is shared:
1. An access grant is recorded in `GovernedFileAccessGrant` or `CampusOfficeDocument.targetUsers`.
2. A business event (`FILE_SHARED` or `DOCUMENT_SHARED`) is emitted.
3. `NotificationService.sendNotification` delivers an in-app and push notification to each recipient.
4. **Idempotency Key**: Generated as `SHARE-${entityId}-${recipientUserId}` to prevent redundant push alerts.
5. **Deep Link Route**:
   - For Drive Files: `/workspace/drive?scope=SHARED&fileId=:fileId`
   - For Drive Folders: `/workspace/drive?scope=SHARED&folderId=:itemId`
   - For Workspace Docs: `/workspace/docs/:id`
   - For Workspace Sheets: `/workspace/sheets/:id`
   - For Workspace Slides: `/workspace/slides/:id`
   - For Workspace Forms: `/workspace/forms/:id`
   - For Workspace Notes: `/workspace/notes/:id`

---

## 3. Two-User State Synchronization Flow

```
[ User A (Owner) ]                                     [ User B (Recipient) ]
        │                                                         │
  1. Creates Doc "Syllabus 2026"                                  │
  2. Clicks "Share" -> Selects User B (VIEW)                      │
  3. POST /workspace/documents/:id/share                          │
        ├───────────────────► Emits DOCUMENT_SHARED ─────────────┤
        │                                                         ├── In-App Toast & Push Received
        │                                                         ├── Unread Notification Badge = +1
        │                                                         └── Doc appears in "Shared With Me"
        │                                                         │
  4. User A renames doc to "Syllabus 2026 Final"                  │
        ├───────────────────► Broadcast / Auto-Sync ─────────────┤
        │                                                         └── User B sees updated title
        │                                                         │
  5. User A revokes User B access                                 │
        ├───────────────────► Invalidate ACL ─────────────────────┤
        │                                                         └── User B gets 403 Forbidden on open
```
