# CAMPUSOS — REALTIME SYNC MATRIX

This matrix tracks all file, document, and workspace lifecycle events, actors, affected parties, event triggers, in-app updates, push notifications, client cache invalidation, transport mechanisms, deep links, and test results.

---

| Event | Actor | Affected User | Server Event | In-App Update | Push Notification | Client Cache Invalidation | Realtime Transport | Deep Link Route | Test Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FILE_CREATED / UPLOADED** | File Owner | File Owner | `FILE_CREATED` | Instant list append | None | My Drive query invalidation | Optimistic React State + Query Sync | `/workspace/drive` | **TEST VERIFIED** |
| **FILE_SHARED** | File Owner | Recipient (User B) | `FILE_SHARED` | Shared list refresh + In-app Alert | Native Push (if enabled) | Shared With Me query | WebSocket / SSE / Invalidation Polling (3s) | `/workspace/drive?scope=SHARED` | **TEST VERIFIED** |
| **FILE_RENAMED** | File Owner | Owner + Shared Users | `FILE_UPDATED` | List item title update | None | Drive item cache | Live Query Invalidation | `/workspace/drive` | **TEST VERIFIED** |
| **FILE_MOVED** | File Owner | File Owner | `FILE_MOVED` | Folder contents refresh | None | Parent + Target folder cache | Live Query Invalidation | `/workspace/drive` | **TEST VERIFIED** |
| **FILE_TRASHED** | File Owner | Owner + Shared Users | `FILE_TRASHED` | Removed from My Drive -> Appears in Trash | None | Active lists + Trash list | Live Query Invalidation | `/workspace/drive?scope=TRASH` | **TEST VERIFIED** |
| **FILE_RESTORED** | File Owner | File Owner | `FILE_RESTORED` | Removed from Trash -> Appears in My Drive | None | Trash list + Target folder | Live Query Invalidation | `/workspace/drive` | **TEST VERIFIED** |
| **FILE_PERMANENTLY_DELETED** | File Owner / Admin | File Owner / System | `FILE_DELETED` | Removed from Trash | None | Trash query | Live Query Invalidation | `/workspace/drive` | **TEST VERIFIED** |
| **DOCUMENT_CREATED** | Author | Author | `DOCUMENT_CREATED` | Workspace Home Docs list update | None | Documents list | Optimistic React State | `/workspace/docs/:id` | **TEST VERIFIED** |
| **DOCUMENT_SHARED** | Author | Recipient (User B) | `DOCUMENT_SHARED` | Shared Docs list update + Alert | Native Push (if enabled) | Shared documents list | WebSocket / SSE / Invalidation Polling (3s) | `/workspace/docs/:id` | **TEST VERIFIED** |
| **DOCUMENT_TRASHED** | Author | Author + Shared Users | `DOCUMENT_TRASHED` | Removed from Active Docs list | None | Workspace Docs list | Live Query Invalidation | `/workspace/documents` | **TEST VERIFIED** |
| **DOCUMENT_RESTORED** | Author | Author | `DOCUMENT_RESTORED` | Appears in Active Docs list | None | Workspace Docs list | Live Query Invalidation | `/workspace/docs/:id` | **TEST VERIFIED** |
| **SHARE_REVOKED** | Owner / Author | Former Recipient | `SHARE_REVOKED` | Removed from Shared With Me; 403 on open | None | Shared lists cache | Next authorized request / Invalidation | N/A | **TEST VERIFIED** |
| **NEW_VERSION_CREATED** | Editor | Collaborators | `DOCUMENT_UPDATED` | Version history incremented | In-app Banner | Document details & Versions | Live Editor Sync | `/workspace/docs/:id` | **TEST VERIFIED** |
