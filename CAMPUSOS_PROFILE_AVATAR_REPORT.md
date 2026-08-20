# CAMPUSOS PROFILE AVATAR & IDENTITY REPORT

**Target Platform:** Mobile (Capacitor) & Responsive Web  
**System:** GEETORUS CampusOS  
**Scope:** Canonical profile picture uploads, `PUT /api/users/profile/avatar` routing, gender-aware default SVGs, instant UI synchronization without logout, and multi-role identity consistency.

---

## 1. Executive Summary

Previously, uploading a profile image from certain role profile pages (e.g. Student Profile, Staff Profile) caused an unhandled error:
`"Use the profile avatar endpoint to upload or remove a profile image"`
This occurred because profile forms bundled raw base64 photo strings into the generic user profile mutation payload (`PUT /api/users/profile`), which intentionally rejected inline image blobs in favor of the dedicated media endpoint.

---

## 2. Canonical Avatar Pipeline & Fixes

### 2.1 Server-Side Dual Compatibility & Storage
- **Dedicated Avatar Endpoint:** `PUT /api/users/profile/avatar` processes `{ name, mimeType, base64 }` payloads, writing optimized binaries into `uploads/profiles/<userId>/<uuid>.<ext>` and updating `user.profileImageFileId` and `user.profilePhoto`.
- **Graceful Profile Mutation Fallback:** In `product/server/src/modules/users/users.service.ts`, `updateProfile` was updated to intercept base64 image strings and seamlessly delegate to `ProfileMediaService.upload()`, eliminating `BadRequestException` errors regardless of which endpoint is invoked.
- **Binary Streaming & Caching:** `GET /api/users/:id/avatar` streams the validated image binary with proper MIME type headers and client caching directives.

### 2.2 Client-Side Profile Updates & Live Invalidation
- Profile edit components (`StudentProfile.tsx`, `HODProfile.tsx`, etc.) now call `api.put('/users/profile/avatar', { name, mimeType, base64 })` immediately on file selection.
- Upon successful upload, `refreshUser()` is called, invalidating auth context and updating the mobile header avatar, top nav, ID card, and profile views simultaneously across the app without requiring user re-authentication.

### 2.3 Avatar Fallback & Gender Hierarchy

The canonical `ProfileAvatar` component enforces a deterministic 3-tier fallback hierarchy:

```
[Tier 1: Custom Photo]
    └── Is user.profilePhoto or /users/:id/avatar present? 
        ├── YES ──> Render high-res optimized photo (object-cover)
        └── NO  ──> Proceed to Tier 2

[Tier 2: Gender-Aware Default SVG]
    └── Resolve user.gender / student.gender / faculty.gender
        ├── 'MALE'               ──> /avatars/default-male.svg
        ├── 'FEMALE'             ──> /avatars/default-female.svg
        ├── 'OTHER' / 'NEUTRAL'  ──> /avatars/default-neutral.svg
        └── 'UNSPECIFIED'        ──> Proceed to Tier 3

[Tier 3: Initials & Neutral Fallback]
    └── Generate uppercase initials (e.g. "JD") on balanced brand background (#6547E8 / --primary).
```

---

## 3. Multi-Role Identity Guarantee (Same Person = Same Avatar)
In CampusOS, a single physical individual who possesses multiple roles (e.g., Faculty + Mentor + Class Adviser + HOD) has one underlying `User` identity. Updating the profile picture in any workspace or role portal immediately updates the avatar across all associated roles and workspaces.
