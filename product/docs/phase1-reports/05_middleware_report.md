# Phase 1 – Middleware Architecture Report

## Overview
This document outlines the architecture, control flow, and audit behavior of the reusable RBAC Middleware components created for GEETORUS CAMPUSOS.

---

## Key Middleware Components

### 1. `requirePermissionGuard(group, action)`
- **File**: `product/server/src/core/middlewares/rbacGuard.middleware.ts`
- **Purpose**: Validates if the authenticated user has the permission `${group}:${action}` (or group-level wildcards/manage authority).
- **Execution Flow**:
  1. Resolves `req.user` payload from authentication header.
  2. If user is `Super Admin` or has `*:*` / `*`, immediate `next()`.
  3. Evaluates direct match: `${group}:${action}` (e.g. `students:view`).
  4. Evaluates group wildcard: `${group}:*` or `${group}:manage`.
  5. Fallback DB check if JWT permissions are outdated.
  6. On Failure:
     - Writes record to `permission_audits` (Result = `DENIED`)
     - Writes record to `security_audit_logs` (Action = `DENIED`, StatusCode = 403)
     - Throws `ForbiddenException("Forbidden: Missing required permission...")`

---

### 2. `requireHierarchyGuard(maxHierarchyLevel)`
- **File**: `product/server/src/core/middlewares/rbacGuard.middleware.ts`
- **Purpose**: Restricts administrative routes to roles at or above a specific hierarchy tier (e.g., Level 3 = Vice Principal or higher).
- **Behavior**: Compares `role.hierarchy` against `maxHierarchyLevel`. Logs hierarchy violations and returns 403.

---

### 3. `enforceDepartmentScope`
- **File**: `product/server/src/core/middlewares/departmentScope.ts`
- **Purpose**: Ensures HODs and Faculty cannot access data belonging to other departments.
- **Behavior**: Injects `req.departmentId` into express request object. Blocks cross-department requests for non-college-wide roles.

---

## Reusability & DRY Principles
- **No Duplicated Checks**: Middleware functions wrap route handlers declaratively.
- **Centralized Audit Logging**: Single helper `logDeniedAccess()` handles logging across all middleware calls.
- **Fail-Safe**: If audit logging throws an error (e.g., DB lock), the 403 exception is still raised. Security is never compromised by logging failures.
