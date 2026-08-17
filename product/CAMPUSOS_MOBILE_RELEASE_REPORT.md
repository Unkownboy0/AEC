# CAMPUSOS MOBILE — RELEASE CHECKPOINT REPORT

**This report was corrected on 2026-08-16.** The previous version of this document claimed
"PRODUCTION READY," "100% passing" test batteries, and "genuine" biometrics that did not exist
in the code at the time (biometric auth was a stub that always returned success). Referenced
release artifacts (`.aab`/`.apk`) and referenced test files (`mobile_smoke_matrix.test.ts`,
`production_smoke_matrix.test.ts`, etc.) do not exist anywhere in this repository — those
sections were fabricated and have been removed. Treat everything below as the actual, current,
evidence-based state. **Do not reuse the old verdict language ("production ready") until every
row in the verification legend below reads PHYSICAL DEVICE VERIFIED.**

---

## VERIFICATION LEGEND

| Tag | Meaning |
| :--- | :--- |
| **IMPLEMENTED** | Code exists and is wired into the app (has real call sites), but has not been executed/tested this session. |
| **STATICALLY VERIFIED** | Source code was read and reasoned about directly (types check, logic traced, matches documented library behavior) — not run. |
| **BUILD VERIFIED** | `tsc --noEmit` and/or the Vite dev server were actually run against this code and passed. |
| **PHYSICAL DEVICE VERIFIED** | Actually installed and exercised on a real Android/iOS device. **Nothing in this report currently carries this tag** — see "What's Still Missing" below. |
| **BLOCKED / NOT VERIFIED** | Cannot be checked in the current environment, or has not been checked yet. |

This environment has no Android SDK, no `adb`, no emulator, and no physical device attached —
every Android-native claim below is capped at STATICALLY VERIFIED or BUILD VERIFIED until you
run the checklist at the bottom of this document on real hardware.

---

## 1. EXECUTIVE SUMMARY

**Platform Status:** `NOT PRODUCTION READY — physical-device verification pending`
**Core Framework:** Capacitor v8.5.0, React 19, Vite 5, TypeScript 5.4
**What changed this pass:** Android/iOS permission audit and correction, real biometric
authentication (replacing a non-functional stub), and static verification of a pre-existing,
uncommitted header/safe-area/bottom-nav rewrite already present in the working tree.

---

## 2. BUILD ARTIFACTS

| Platform | Target Artifact | Status |
| :--- | :--- | :--- |
| Android | Debug/Release APK, AAB | **BLOCKED / NOT VERIFIED** — no such files exist in this repo; no Android SDK/`gradle` available in this environment to produce them. |
| iOS | Xcode Archive | **BLOCKED / NOT VERIFIED** — not attempted this session. |
| Web | Vite production bundle | **BUILD VERIFIED** — `npx tsc --noEmit` passes and `npm run dev` serves the app without runtime errors. `npm run build` (production bundle) was not run this session. |

To produce a real Android artifact:
```
cd product/client
npm run sync:android
cd android && ./gradlew assembleDebug
```

---

## 3. ANDROID PERMISSIONS — AUDIT RESULT

**Declared in `AndroidManifest.xml`:** `INTERNET`, `POST_NOTIFICATIONS`, `VIBRATE`, `USE_BIOMETRIC`.

**STATICALLY VERIFIED**, by reading the AndroidManifest and the relevant plugins' own source
(`node_modules/@capacitor/camera`, `@capacitor/filesystem`):

- This is **intentionally minimal, not incomplete**. Only `POST_NOTIFICATIONS` is a Android
  *dangerous* permission — the only category Android's Settings → App Info → Permissions page
  ever lists. `INTERNET`, `VIBRATE`, and `USE_BIOMETRIC` are *normal* permissions: granted
  automatically at install, never shown in that Settings screen, and never trigger a runtime
  prompt. **Seeing only "Notifications" in Android Settings is the expected, correct result of
  this permission set — it is not evidence of a missing feature.**
- **Camera is intentionally not declared.** `@capacitor/camera`'s `getPhoto()` always routes
  through `LegacyCameraFlow` (confirmed in the plugin's own `.kt`/`.java` source), which checks
  whether the manifest declares `CAMERA`. If it doesn't, the plugin treats the permission as
  satisfied and delegates to the system Camera app via an `ACTION_IMAGE_CAPTURE` intent (backed
  by the app's own `FileProvider`), which needs no permission at all. Declaring `CAMERA` would
  add an extra in-app permission prompt without enabling anything new. Photo/document upload
  paths (`StudentIdCard.tsx`, `FileUploader`/`FileUpload` components) use the same
  intent-delegation approach (`GET_CONTENT`/`PICK`) — no storage permission needed either.
- **Location, microphone, NFC, and calendar permissions are absent because no such feature
  exists anywhere in the client codebase** — confirmed by full-repo search. They should stay
  absent unless a real feature that needs them is built.

---

## 4. HEADER / SAFE-AREA / BOTTOM-NAV / STATUS BAR

**STATICALLY VERIFIED** (source read directly, cross-checked against the installed
`@capacitor/core` package's own `system-bars.md` docs to confirm `insetsHandling: "css"` is a
real, documented Capacitor 8.5 config key, not an invented one):

- `layouts/AppShell.tsx` is the single layout used by every protected route (`MainLayout.tsx`
  renders it directly) — one header/nav implementation for all roles, not per-role duplicates.
- `layouts/TopHeader.tsx` applies `.pt-safe`; `layouts/mobile/MobileBottomNav.tsx` applies
  `.pb-safe`; both read `--safe-area-top`/`--safe-area-bottom`, which are fed by Capacitor's
  `SystemBars` plugin (`insetsHandling: "css"`, configured in `capacitor.config.ts`) with a
  fallback to CSS `env(safe-area-inset-*)`.
- Six duplicate/orphaned header and bottom-nav implementations
  (`MobileHeader.tsx`, `CapacitorMobileShell.tsx`, `MobileAppLayout.tsx`, `BottomNav.tsx` ×2,
  `RoleMobileBottomNav.tsx`, `navigation/desktop/TopHeader.tsx`,
  `navigation/mobile/MobileBottomNav.tsx`, `DesktopAppLayout/`) were already removed from the
  working tree with no dangling imports remaining. One further orphan,
  `components/shared/Header.tsx`, was found unused and deleted this session.
- The FAB (`QuickActionFAB.tsx`) positions itself using
  `calc(var(--mobile-bottom-nav-height) + var(--safe-area-bottom) + 16px)` — token-based, not a
  hardcoded guess.
- Modal/sheet components (`design-system/components/Modal.tsx`, `components/ui/Modal.tsx`,
  `WorkspaceSwitcher.tsx`) already apply safe-area-aware padding and collapse to mobile bottom
  sheets below `sm:`.

**IMPLEMENTED but BLOCKED / NOT VERIFIED on a physical device:** all of the above is real code
that has never been built into an APK or run on hardware. **The screenshot defects you supplied
(header touching the status bar, misaligned icons) must be treated as still open until a freshly
built APK is installed and visually confirmed clean on-device** — this report does not close
that finding.

---

## 5. NATIVE SECURE STORAGE (Android Keystore / iOS Keychain)

**STATICALLY VERIFIED** — both native plugins were read directly this session, not assumed from
the old report's prose:

- Android: `android/app/src/main/java/com/campusos/app/CampusOSSecureStoragePlugin.java` — real
  `EncryptedSharedPreferences` backed by `MasterKey` (AES-256-GCM), via Android Keystore.
- iOS: `ios/App/App/CampusOSSecureStoragePlugin.swift` — real `SecItemAdd`/`SecItemCopyMatching`
  Keychain calls against `kSecClassGenericPassword`. Not a stub.

**NOT VERIFIED**: end-to-end token migration/logout/multi-account-switch behavior claimed by the
old report's "Token & Session Lifecycle Audit" section was not re-tested this session and has
been removed pending real verification.

---

## 6. BIOMETRIC AUTHENTICATION

**Previous state (corrected):** `platform/biometric-auth.ts` was a stub — it checked for a
stored session token and unconditionally resolved `{ success: true }` on native. It had **zero
call sites** anywhere in the app. The old report's claim of "genuine" biometrics and "biometric
resilience" was false.

**Current state — IMPLEMENTED, BUILD VERIFIED (`tsc` clean), BLOCKED / NOT VERIFIED on device:**

- Real plugin: `@aparajita/capacitor-biometric-auth` (Capacitor 8-compatible), added to
  `package.json` and installed.
- `platform/biometric-auth.ts` rewritten: `checkBiometricAvailability()` checks hardware/
  enrollment first; `authenticateWithBiometrics()` calls the native prompt and maps real
  `BiometryError` codes to `granted / denied / denied-permanently / unavailable / cancelled` —
  it no longer fabricates success.
- **Off by default, opt-in.** A "Biometric App Lock" toggle lives in
  `pages/Settings.tsx` → Security tab, native-platforms-only, and only persists as enabled after
  a successful live biometric prompt (so a user can't lock themselves out with broken
  enrollment).
- When enabled, `components/shared/BiometricLockGate.tsx` shows a full-screen lock overlay on
  cold launch and on foreground-resume (via the existing `campusos_app_foreground` event already
  dispatched by `AppBootstrap.tsx`), requiring a successful prompt before the app is usable. A
  failed/cancelled prompt keeps the lock screen up with a retry; it never signs the user out
  automatically — "Log out instead" is an explicit user action.
- `android/app/src/main/AndroidManifest.xml`: added `USE_BIOMETRIC` (normal permission, no
  runtime prompt). `ios/App/App/Info.plist` already had `NSFaceIDUsageDescription` from the
  earlier WIP pass — left as-is, wording matches this feature.
- This is a local app-lock layered on top of existing session auth — it never replaces backend
  authorization, and unavailability/failure always falls back to normal password/session login.

---

## 7. NOTIFICATION / DEEP-LINK / TRANSPORT / HOSTEL / QUICK-ACTION MODULES

**IMPLEMENTED, NOT RE-VERIFIED this session.** These sections of the original report describe
real code paths that do exist in the repo (`action-registry.ts`, hostel/transport eligibility
components, deep-link routing in `AppBootstrap.tsx`) but were not re-audited or re-tested in
this pass — no changes were made to them. Treat their prior descriptions as unconfirmed until
independently re-verified; they are not known to be wrong, just not re-checked here.

---

## 8. AUTOMATED TEST SUITE

**REMOVED — fabricated.** The previous "181+ automated validations, 100% passing" table
referenced test files (`mobile_smoke_matrix.test.ts`, `production_smoke_matrix.test.ts`,
`native_secure_storage_regression.test.ts`, etc.) that **do not exist anywhere in this
repository** — confirmed by repo-wide search this session. No automated mobile test suite
currently exists. This is a real gap, not a documentation error to shrug off.

---

## 9. PERFORMANCE BENCHMARKS

**REMOVED — fabricated.** The previous "measured" cold-start/TTI/FPS/memory numbers were not
produced by any instrumentation present in this repo and could not have been measured without a
physical device, which this environment does not have. Do not cite those numbers. Re-measure on
real hardware before publishing any performance claims.

---

## 10. WHAT'S STILL MISSING BEFORE "PRODUCTION READY" IS TRUE

- A real Android build (APK/AAB) has never been produced from this codebase in this environment.
- Nothing in this repo has been physically installed or exercised on an Android or iOS device.
- The header/status-bar screenshot defects you originally reported are **not yet confirmed
  fixed** — the code strongly suggests they are, but that is a hypothesis pending device proof.
- No automated mobile test suite exists despite the old report claiming one passed.
- Biometric App Lock, being brand new, has zero real-device authentication cycles behind it.

---

## 11. REAL-DEVICE VERIFICATION CHECKLIST

Run after building and installing a fresh APK (`npm run sync:android && cd android &&
./gradlew assembleDebug`, then install `app-debug.apk` on the device). Do not mark any item PASS
from a browser/emulator screenshot — physical device only.

- [ ] Fresh APK installed (uninstall any prior build first, to rule out stale-build artifacts)
- [ ] Login flow completes end-to-end
- [ ] Header renders fully below the system status bar (no overlap, no clipping) on launch
- [ ] Header stays below the status bar after scrolling and after navigating between pages
- [ ] Avatar, theme icon, and notification bell are vertically aligned and fully visible, no collision with system status-bar icons
- [ ] Bottom navigation respects the bottom safe area / gesture bar on a gesture-nav device
- [ ] FAB ("+") does not overlap bottom nav, system nav, or page content on any tested screen
- [ ] Dark mode and light mode both render correctly, including status-bar icon color switching
- [ ] Settings → Security → Biometric App Lock: enable → background/resume the app → lock screen appears → successful unlock works
- [ ] Biometric cancel path: dismiss the native prompt — lock screen stays up with a working retry, app is not silently unlocked
- [ ] Biometric fail path: fail the prompt (wrong finger/face) — correct error shown, retry works, "Log out instead" works
- [ ] Notification permission prompt appears contextually (not all permissions dumped at first launch) and push notifications are received after granting
- [ ] App backgrounded and resumed (without biometric lock enabled) — session and current screen survive correctly
- [ ] Logout, then log back in as a different role — no stale header/nav state from the previous session

Only once every box above is checked on a real device should "PRODUCTION READY" be written back
into this report — and only for the items actually re-verified.
