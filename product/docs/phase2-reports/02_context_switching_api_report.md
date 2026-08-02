# Phase 2 – Context Switching API Report

## Overview
This document specifies the REST API endpoints supporting the Multi-Workspace Context Switcher Engine in GEETORUS CAMPUSOS.

---

## Endpoint Specification

### `POST /api/auth/switch-workspace`

#### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "targetRole": "Mentor"
}
```

#### Successful Response (`200 OK`)
```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "activeWorkspace": "Mentor",
    "user": {
      "id": "USR_101",
      "email": "faculty@campusos.edu",
      "firstName": "Dr. Sarah",
      "lastName": "Jenkins",
      "role": "Mentor",
      "permissions": [
        "students:view",
        "attendance:view",
        "marks:view",
        "leave:approve",
        "od:approve"
      ],
      "workspaces": ["Faculty", "Mentor"],
      "activeWorkspace": "Mentor"
    }
  }
}
```

#### Error Responses

##### `400 Bad Request` – Unauthorized Target Workspace
```json
{
  "status": "error",
  "message": "Workspace 'Super Admin' is not authorized for your account"
}
```

##### `401 Unauthorized` – Missing or Expired Token
```json
{
  "status": "error",
  "message": "Access token missing or invalid"
}
```

---

## Middleware Integration
All downstream API calls incorporate the `X-Active-Role` request header. `requireAuth` middleware dynamically resolves permissions and overrides `req.user.role` with the active workspace role.
