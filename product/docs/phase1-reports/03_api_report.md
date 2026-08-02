# Phase 1 – API Protection Report

## Overview
This report lists all API routes, their required permissions, HTTP status responses, and audit behavior under Phase 1 RBAC protection.

---

## Permission Protection Standard
Every protected API endpoint enforces permission validation. Unauthorized requests return:
- **401 Unauthorized**: Missing or corrupted Bearer token
- **403 Forbidden**: Valid token, but missing required permission for group and action

Every 403 Forbidden response triggers an automatic silent entry in both `PermissionAudit` and `SecurityAuditLog` tables.

---

## Protected API Endpoint Mapping Matrix

| Route | HTTP Method | Required Permission | Description |
|---|---|---|---|
| `/api/rbac/groups` | GET | `rbac:view` | List all 21 permission groups and granular actions |
| `/api/rbac/matrix` | GET | `rbac:view` | Retrieve master role-permission matrix |
| `/api/rbac/roles` | POST | `roles:create` | Create custom enterprise role |
| `/api/rbac/permission-audits` | GET | `audit:view` | Retrieve permission audit log entries |
| `/api/enterprise/students` | GET | `students:view` | List students (filtered by scope) |
| `/api/enterprise/students` | POST | `students:create` | Register new student record |
| `/api/enterprise/students/:id` | PUT | `students:update` | Edit student details |
| `/api/enterprise/students/:id` | DELETE | `students:delete` | Archive/delete student record |
| `/api/enterprise/faculty` | GET | `faculty:view` | List faculty records |
| `/api/enterprise/faculty` | POST | `faculty:create` | Register faculty profile |
| `/api/enterprise/attendance` | GET | `attendance:view` | Fetch attendance records |
| `/api/enterprise/attendance` | POST | `attendance:create` | Record class attendance |
| `/api/enterprise/marks` | GET | `marks:view` | View subject marks |
| `/api/enterprise/marks` | POST | `marks:create` | Entry/Update examination marks |
| `/api/enterprise/fees/bills` | GET | `fees:view` | List student fee bills |
| `/api/enterprise/fees/bills` | POST | `fees:create` | Generate new fee bill |
| `/api/reports` | GET | `reports:view` | Generate institutional reports |
| `/api/settings` | GET | `settings:view` | View system settings |
| `/api/settings` | PUT | `settings:update` | Update system settings |

---

## 403 Forbidden Audit Response Schema

When a request is denied:
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "Forbidden: Missing required permission 'students:delete'"
}
```

Audit Log entry created:
```json
{
  "userId": "USER_FACULTY_101",
  "action": "DENIED",
  "endpoint": "DELETE /api/enterprise/students/STU_99",
  "result": "DENIED",
  "reason": "User with role 'Faculty' lacks permission 'students:delete'"
}
```
