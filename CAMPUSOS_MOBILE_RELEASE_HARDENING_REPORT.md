# CampusOS Mobile Release Hardening Report

Date: 2026-08-19

## Release gate summary

| Gate | Status | Result |
|---|---|---|
| Production web build | BUILD VERIFIED | Vite production build passed |
| Android debug build | BUILD VERIFIED | `assembleDebug` passed, 457 tasks |
| Android release signing policy | TEST VERIFIED | Source regression proves no debug fallback and required signing variables |
| Signed Android release artifact | BLOCKED / NOT VERIFIED | Production keystore inputs are unavailable |
| Android physical install/update | BLOCKED / NOT VERIFIED | No emulator/physical device was attached |
| iOS APNs project configuration | STATICALLY VERIFIED | Capability, entitlement, and background mode added |
| iOS archive/device push | BLOCKED / NOT VERIFIED | macOS/Xcode, signing identity, and device unavailable |
| CocoaPods lockfile | BLOCKED / NOT VERIFIED | CocoaPods/macOS unavailable; lockfile was not fabricated |

## Android signing

Release no longer falls back to the debug signing configuration. Release or bundle tasks require all four production signing inputs and fail instead of producing a misleading candidate:

- `CAMPUSOS_RELEASE_STORE_FILE`
- `CAMPUSOS_RELEASE_STORE_PASSWORD`
- `CAMPUSOS_RELEASE_KEY_ALIAS`
- `CAMPUSOS_RELEASE_KEY_PASSWORD`

Passwords are not logged. Debug signing remains limited to debug builds.

File: `product/client/android/app/build.gradle`

Status: policy **TEST VERIFIED**. A release invocation did not yield an artifact; this environment also encountered local Gradle toolchain discovery limits. Because no production keystore was supplied, certificate and artifact verification are **BLOCKED / NOT VERIFIED**.

## Cleartext and network security

- Main/production Android manifest has `usesCleartextTraffic=false`.
- Main network security config denies base cleartext and trusts system certificates only.
- Debug manifest/config retains controlled development HTTP behavior.
- Capacitor enables cleartext only for an explicitly configured development HTTP server; production rejects a development server URL.

Files:

- `product/client/android/app/src/main/AndroidManifest.xml`
- `product/client/android/app/src/main/res/xml/network_security_config.xml`
- `product/client/android/app/src/debug/AndroidManifest.xml`
- `product/client/android/app/src/debug/res/xml/network_security_config.xml`
- `product/client/capacitor.config.ts`

Status: **TEST VERIFIED** and Android debug **BUILD VERIFIED**.

## Production API and realtime URL policy

- Removed the hardcoded `http://10.226.116.201:5000/api` production fallback.
- Removed production localhost socket fallback.
- Production native startup requires configured HTTPS and rejects localhost, loopback, and private IPv4 destinations.
- Development LAN overrides remain non-production only.
- `validateApiConfig()` is invoked by authenticated application bootstrap before session restoration.
- Realtime uses the configured API origin and the actual SSE endpoint.

Files:

- `product/client/src/shared/config/environment.ts`
- `product/client/src/config/api-config.ts`
- `product/client/src/config/api-url-policy.ts`
- `product/client/src/app/bootstrap/AppBootstrap.tsx`
- `product/client/src/realtime/realtime-client.ts`
- `product/server/src/__tests__/mobile_release_security_regression.test.ts`

Tests: production localhost, private IP, and HTTP rejection plus valid HTTPS acceptance passed against the real policy module.

Status: **TEST VERIFIED**.

## Server production perimeter

- Production CORS is environment-driven; hardcoded developer LAN origins are development-only.
- `DATABASE_URL` has no silent Prisma localhost fallback.
- Production password-reset links require the configured HTTPS public URL.
- Missing Firebase credentials degrade to durable in-app notifications, and health diagnostics now expose push as `configured` or `in_app_only`.

Status: server TypeScript **BUILD VERIFIED** and policy **STATICALLY VERIFIED**.

## iOS APNs configuration

- Added `App.entitlements` with `aps-environment=$(APS_ENVIRONMENT)` instead of hardcoding one environment.
- Xcode project enables the Push Notifications and Background Modes capabilities.
- Debug resolves APNs to development and Release to production through build settings.
- `CODE_SIGN_ENTITLEMENTS` points to the entitlement file.
- `UIBackgroundModes` contains `remote-notification`.
- The existing Capacitor Push Notifications pod/plugin remains in the Podfile.

Files:

- `product/client/ios/App/App/App.entitlements`
- `product/client/ios/App/App.xcodeproj/project.pbxproj`
- `product/client/ios/App/App/Info.plist`
- `product/client/ios/App/Podfile`

Status: **STATICALLY VERIFIED**. Xcode archive, provisioning-profile entitlement inspection, APNs registration, and physical-device delivery are **BLOCKED / NOT VERIFIED**.

## Native notification code and secure storage

Duplicate push/local notification registration methods and imports were removed from `src/lib/capacitor-native.ts`. `NotificationProvider` remains the canonical registration/listener path. Native UI initialization, status/system bars, networking, and non-secret Preferences wrappers remain intact. Authentication token handling continues through the existing secure native storage/session path; it was not moved into Preferences.

Status: client TypeScript and Vite production build **BUILD VERIFIED**.

## Branding assets and stale artifacts

Hash inspection showed `al-ameen-logo.png`, `institution-logo.png`, `official-logo.png`, and `watermark-logo.png` were byte-identical (279,853 bytes). Runtime consumers were changed to the canonical `official-logo.png`; distinct launcher, PWA, splash, and watermark usages remain conceptually separate.

Deletion of duplicate source files and stale v1.0.1/v1.0.2 AAB files was attempted only after reference/hash inspection, but the execution safety reviewer rejected the destructive operation. The files therefore remain in the working tree and are not claimed as removed.

Status: consumer consolidation **STATICALLY VERIFIED**; physical asset/AAB deletion **BLOCKED / NOT VERIFIED**.

## Build and artifact record

Current configuration was preserved:

- applicationId: `com.geetorus.campusos`
- versionName: `1.0.5`
- versionCode: `6`
- minSdk: `26`
- targetSdk: `35`
- compileSdk: `35`

Verified:

- Client TypeScript passed.
- Vite production build passed (3,263 modules; only chunk-size/dynamic-import warnings).
- Android `assembleDebug` passed.

Not claimable without a newly signed release artifact:

- release certificate SHA-256
- release APK/AAB SHA-256
- `apksigner verify --verbose --print-certs`
- clean/update install result
- `SIGNED RELEASE VERIFIED`

Those remain **BLOCKED / NOT VERIFIED**.

## Environment blockers

- Capacitor sync failed in the available Windows Node runtime with `uv_os_get_passwd returned ENOMEM`; generated native projects were therefore verified through their committed sources and Android Gradle build, not a successful sync.
- The legacy phase-2 workflow suite attempted a live Firebase send; outbound FCM access was denied. In-app workflow assertions before delivery ran, but external push delivery is **BLOCKED / NOT VERIFIED**.
- CocoaPods and Xcode are unavailable on Windows, so `Podfile.lock`, archive signing, and physical iOS push are **BLOCKED / NOT VERIFIED**.
