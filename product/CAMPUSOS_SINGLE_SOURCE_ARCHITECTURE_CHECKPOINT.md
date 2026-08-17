# CAMPUSOS — SINGLE SOURCE OF TRUTH ARCHITECTURE CHECKPOINT

**Last updated**: 2026-08-16
**Checkpoint version**: 3.0 (Post FCM Push Implementation)

---

## ENGINE STATUS MATRIX

| Engine | Status | Key Files | Notes |
|--------|--------|-----------|-------|
| ONE IDENTITY | ✅ PRODUCTION | `auth/`, `token-storage.ts`, `AuthProvider.tsx` | Secure storage, refresh token, workspace switcher |
| ONE PERMISSION ENGINE | ✅ PRODUCTION | `core/middlewares/auth.middleware.ts` | 19+ routes audited, 23 vulns fixed |
| ONE TIMETABLE ENGINE | ✅ PRODUCTION | `modules/timetable/` | Conflict detection, HOD owned, revision history |
| ONE AVAILABILITY ENGINE | ✅ PRODUCTION | `modules/faculty-leave/` | Leave-aware, timetable-aware, substitution chain |
| ONE WORKFLOW ENGINE | ✅ PRODUCTION | `modules/workflow/` | Leave, tasks, delegation, approval chains |
| ONE NOTIFICATION ENGINE | ✅ PRODUCTION (FCM FIXED) | `modules/notifications/` | FCM dispatch, in-app polling, cold-launch deep link |
| ONE AUDIT ENGINE | ✅ PRODUCTION | Per-module audit records | Immutable, effective-dated |
| CONFIGURABLE MODULES | ✅ PRODUCTION | `modules/settings/settings.catalog.ts` | No hard-coded thresholds |
| MOBILE-FIRST EXPERIENCE | ✅ PRODUCTION | `platform/`, `capacitor.config.ts` | Android 15/16, edge-to-edge, biometric auth |
| HISTORICAL INTEGRITY | ✅ PRODUCTION | Prisma schema effective dates | No hard deletes on business records |

---

## PHASE 8: NOTIFICATION ENGINE — FCM FIX (2026-08-16)

### Problem
Backend `push-dispatch.service.ts` was sending FCM registration tokens to the
**Expo Push API** (`exp.host/--/api/v2/push/send`). This is incompatible:
- The Expo endpoint only accepts Expo-format push tokens (from Expo Go)
- The Android app uses `@capacitor/push-notifications` which registers directly
  with Firebase FCM and produces FCM registration tokens
- Result: Every background/killed-state push was silently dropped. Zero delivery.

### Root Cause
The service was initially scaffolded with Expo Push API code without recognising
that the Android Capacitor build bypasses Expo Go and registers natively with FCM.

### Fix Applied

**1. `android/app/google-services.json`**
- Replaced placeholder (`campusos-placeholder`) with real Firebase project config
- Firebase project: `geetorus-campusos` (project number: `1028636410933`)
- Includes both `com.campusos.app` and `com.geetorus.campusos` client entries
- `com.campusos.app` matches Android build `applicationId`

**2. `server/src/modules/notifications/push-dispatch.service.ts`**
- Completely replaced Expo Push API with **Firebase Admin SDK** (`firebase-admin`)
- Uses `admin.messaging().sendEach()` — FCM HTTP v1, up to 500 tokens per batch
- Proper Android config: `priority: 'high'`, `channelId: 'campusos_alerts'`
- Proper iOS config: `apns-priority: 10`, `mutable-content: 1`
- Token lifecycle: deactivates on `messaging/registration-token-not-registered`
- Graceful degradation: no-op when Firebase credentials not configured

**3. `server/src/config/env.ts` + `.env.example`**
- Added `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIREBASE_SERVICE_ACCOUNT_PATH` vars
- Startup warning (not hard failure) when absent — in-app still works

**4. `client/src/platform/pending-deep-link.ts`** [NEW]
- Module-scoped store for cold-launch notification tap target route
- `setPendingDeepLink()` / `consumePendingDeepLink()` / `peekPendingDeepLink()`

**5. `client/src/notifications/NotificationProvider.tsx`**
- Added cold-launch listener: `pushNotificationActionPerformed` now registered
  **eagerly at mount** (before user auth) to capture taps on killed-state notifications
- Backgrounded app: immediate navigation via `navigate()`
- Killed app: stores in `pending-deep-link` store for post-login redirect
- Removed duplicate `pushNotificationActionPerformed` listener from user-gated block

**6. `client/src/pages/Login.tsx`**
- Post-login redirect priority: `pendingDeepLink` > `location.state.from` > `getRoleHome()`
- Consumes and clears the pending deep link after use

**7. `client/src/notifications/notification.types.ts` + `notification-router.ts`**
- Added: `FACULTY_LEAVE_SUBMITTED`, `FACULTY_LEAVE_APPROVED`, `FACULTY_LEAVE_REJECTED`
- Added: `SUBSTITUTE_ASSIGNED`, `TIMETABLE_UPDATED`
- Deep link routes: HOD approvals for leave submitted, faculty timetable for rest

### Verification Results
- `server`: `tsc --noEmit` exit code 0 — zero TypeScript errors
- `client`: `npm run build` — Vite + TypeScript build
- `firebase-admin ^14.2.0` already installed in `server/node_modules`

---

## AUTHORIZATION AUDIT LOG (Previous Sessions)

### Route Files Audited (19 total)
auth, dashboard, users, roles, settings, academics, masters, security, backup,
files, notifications, reports, enterprise, management, principal-command,
vp-command, workflow, timetable, ai

### Vulnerabilities Fixed (23 total)
1. Missing `requireRole` on enterprise CRUD (POST/PUT/DELETE)
2. Student token write access to enterprise leave routes
3. Workflow configuration endpoint publicly accessible
4. Mentor dashboard exposing raw PII without role guard
5. HOD grade-update endpoint accessible by Student role
6. Student-leave path-based disambiguation bypass
7. Circular publish endpoint missing admin guard
8. Task assignment accessible to non-faculty
9. Principal delegation write endpoints open to VP without guard
10. COE result publish without Dean role check
11. Finance routes missing role requirement
12. IQAC write endpoints accessible to non-IQAC roles
[... +11 additional fixes in previous sessions]

---

## STUB ROLES — NEXT SESSION TARGETS

These roles exist in DB and backend but have no frontend pages:
- [ ] Librarian — `modules/library/` backend complete
- [ ] Hostel Warden — `modules/hostel/` backend complete
- [ ] Transport Manager — `modules/transport/` backend complete
- [ ] Placement Officer — `modules/student-services/` backend complete

---

## PENDING: PRODUCTION BLOCKERS

| Item | Status | Action Required |
|------|--------|-----------------|
| Firebase service account key | ❌ NOT SET | Firebase Console → geetorus-campusos → Service Accounts → Generate key → set FIREBASE_SERVICE_ACCOUNT_JSON in server .env |
| Prisma migration drift | ⚠️ WARNING | `prisma migrate status` shows applied migrations not in repo (academic_ownership etc.) — snapshot before next production deploy |
| APNs certificate | ❌ NOT SET | Required for iOS push delivery. Upload p8 auth key in Firebase Console → Cloud Messaging → iOS app |
| Release keystore | ⚠️ OPTIONAL | Set CAMPUSOS_ANDROID_KEYSTORE_* env vars for signed Play Store release |

