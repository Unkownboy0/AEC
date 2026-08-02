# Phase 2 – Token Payload Specification Report

## Overview
This document defines the JWT access token and refresh token schemas used to convey active workspace context in GEETORUS CAMPUSOS.

---

## 1. Access Token Payload (`JwtAccessPayload`)

Upon workspace context switch, the backend issues a renewed short-lived JWT access token (15-minute expiration) with the active workspace role embedded.

```json
{
  "id": "USR_101",
  "email": "faculty@campusos.edu",
  "role": "Mentor",
  "permissions": [
    "students:view",
    "attendance:view",
    "marks:view",
    "leave:approve",
    "od:approve"
  ],
  "iat": 1753914000,
  "exp": 1753914900
}
```

---

## 2. Refresh Token Payload (`JwtRefreshPayload`)

The long-lived session refresh token remains anchored to the primary user ID and session record.

```json
{
  "userId": "USR_101",
  "sessionId": "SES_9081",
  "iat": 1753914000,
  "exp": 1754518800
}
```

---

## 3. Request Header propagation (`X-Active-Role`)

For active session persistence, the client HTTP interceptor injects:
```http
Authorization: Bearer <access_token>
X-Active-Role: Mentor
```

The server `auth.middleware.ts` reads `X-Active-Role`, verifies its validity against database user roles, and applies active workspace permissions dynamically to `req.user`.
