# Phase 1 – Migration Report: Enterprise Role Hierarchy & RBAC

## Executive Summary
This document records all database migration steps, schema transformations, and entity definitions applied to implement **Enterprise Role Hierarchy and Role-Based Access Control (RBAC)** in GEETORUS CAMPUSOS.

---

## 1. Schema Modifications Summary

| Action | Target Entity | Detail |
|---|---|---|
| **ADDED** | `PermissionGroup` | Categorizes permissions into 21 functional groups (e.g. Dashboard, Users, Students, Attendance) |
| **ADDED** | `PermissionAudit` | Audits every permission grant, revocation, and denied request attempt with endpoint & IP tracking |
| **VERIFIED** | `SecurityAuditLog` | Audits 403 Forbidden events, module actions, and user security events |
| **MODIFIED** | `Permission` | Added nullable `groupId` relation referencing `PermissionGroup` |
| **PRESERVED** | `Role`, `UserRole`, `RolePermission`, `RbacAuditLog`, `DepartmentMembership` | Maintained existing architecture with backward compatibility |

---

## 2. DDL Details & Field Mappings

### `permission_groups` Table
```sql
CREATE TABLE "permission_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "permission_groups_name_key" ON "permission_groups"("name");
CREATE UNIQUE INDEX "permission_groups_code_key" ON "permission_groups"("code");
```

### `permission_audits` Table
```sql
CREATE TABLE "permission_audits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "roleId" TEXT,
    "permissionId" TEXT,
    "action" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "endpoint" TEXT,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "permission_audits_userId_idx" ON "permission_audits"("userId");
CREATE INDEX "permission_audits_action_idx" ON "permission_audits"("action");
CREATE INDEX "permission_audits_createdAt_idx" ON "permission_audits"("createdAt");
```

---

## 3. Seed Execution Log
- **21 Permission Groups** created.
- **210 Granular Permissions** created (21 groups × 10 action types).
- **11 Core Hierarchy Roles** configured with priorities 1 through 11.
- **1,000+ Role-Permission links** generated.

---

## 4. Rollback Plan
In case of rollback:
1. Delete records from `permission_audits` and `permission_groups`.
2. Remove `groupId` foreign key column from `permissions`.
3. Existing roles and users remain untouched and operate normally using legacy JSON fallback.
