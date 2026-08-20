# CampusOS Android Final Build Report

Date: 2026-08-19 (Asia/Calcutta)

## 1. Source commit

- Branch: `new-updates-from-tuf`
- Commit: `920c9d11f9b59cf18fdef4938dfde100d62d8302`

## 2. Working tree state

The pre-existing dirty working tree was preserved. No reset, revert, stash, or discard operation was performed. Final porcelain summary: 224 modified, 7 deleted, and 146 untracked entries (377 total). Generated build outputs and the requested version metadata are included in that state.

## 3. Version and Android SDK metadata

- versionName: `1.0.6`
- versionCode: `7`
- applicationId: `com.campusos.app`
- minSdk: `26`
- targetSdk: `35`
- compileSdk: `35`

Build 6 had previously been generated as a test candidate, so this internal candidate was advanced from 1.0.5/code 6 to 1.0.6/code 7.

## 4. Web build result

Status: **BUILD VERIFIED**

- Client TypeScript: passed
- Server TypeScript: passed
- Vite: 5.4.21
- Modules transformed: 3,266
- Build duration: 17.23 seconds
- Build timestamp: `2026-08-19T16:33:59.5254517Z`
- Dist total: 6,849,194 bytes
- Main JS: `assets/index-CHpS2kyx.js`, 4,724,655 bytes (4,716.62 kB as reported by Vite)
- CSS: `assets/index-Cs2e53xL.css`, 226,639 bytes (226.64 kB as reported by Vite)
- Existing >500 kB chunk warning remains.

## 5. Capacitor sync result

Official `cap sync android`: **BLOCKED / NOT VERIFIED**. The CLI terminated before synchronization with `SystemError [ERR_SYSTEM_ERROR]: uv_os_get_passwd returned ENOMEM`.

The documented safe generated-web-asset refresh was used after recording the failure. Only `android/app/src/main/assets/public` was cleared and repopulated from the newly built, pruned `dist`. Source and destination each contain 69 files and 6,849,194 bytes. Existing native plugin metadata was preserved.

## 6. Web/Android asset hash comparison

Status: **STATICALLY VERIFIED**

- `dist/index.html` SHA-256: `8E4044A905F69CD9604C76B2980C22CE4F15E265CEAA9E033293D7E9BAEBD106`
- Android `assets/public/index.html` SHA-256: `8E4044A905F69CD9604C76B2980C22CE4F15E265CEAA9E033293D7E9BAEBD106`
- APK-embedded `assets/public/index.html` SHA-256: `8E4044A905F69CD9604C76B2980C22CE4F15E265CEAA9E033293D7E9BAEBD106`
- Result: all three match.

## 7. Nested artifact check

Status: **STATICALLY VERIFIED**

- Android web-assets forbidden `.apk/.aab/.ipa/.zip/.map` count: 0
- APK ZIP entries: 1,147
- Forbidden nested APK ZIP entries: 0
- Expected current JS, CSS, official branding, avatars, and localization-bearing application bundle are present.

## 8. Debug APK

Status: **BUILD VERIFIED**

- Gradle source artifact: `product/client/android/app/build/outputs/apk/debug/app-debug.apk`
- Handoff artifact: `output/CampusOS-v1.0.6-build7-debug.apk`
- Size: 19,124,305 bytes (18.24 MiB)
- SHA-256: `FBFC5D39E0572E8991223D51CC3866BC30EF9C01C3F33B46F10A4CE9C712636E`
- The handoff copy is byte-identical to the Gradle output.
- `aapt` confirms applicationId/version/sdk metadata listed above.

## 9. Release APK

Status: **BLOCKED / NOT VERIFIED**. No release artifact was produced because real production signing variables are absent.

## 10. AAB

Status: **BLOCKED / NOT VERIFIED**. No AAB was produced because real production signing variables are absent.

## 11. Signing verification

The debug APK passes `apksigner verify` with v2 and v3 schemes. Its signer is explicitly `CN=Android Debug`; debug certificate SHA-256 is `CCF6B5FB37604851AAFC9D8F8EA4A6CBF4E0B880F67F66EA4AA55A5D523C5292`. This is not release signing evidence.

Release signing is fail-closed in `app/build.gradle` and requires all four existing variables: `CAMPUSOS_ANDROID_KEYSTORE_FILE`, `CAMPUSOS_ANDROID_KEYSTORE_PASSWORD`, `CAMPUSOS_ANDROID_KEY_ALIAS`, and `CAMPUSOS_ANDROID_KEY_PASSWORD`. All four were absent. No debug signing fallback was used for release.

## 12. APK/AAB hashes

- Debug APK: `FBFC5D39E0572E8991223D51CC3866BC30EF9C01C3F33B46F10A4CE9C712636E`
- Release APK: **BLOCKED / NOT VERIFIED**
- Release AAB: **BLOCKED / NOT VERIFIED**

## 13. APK/AAB sizes

- Prior problematic nested-installer artifact: approximately 212 MB
- Prior healthy debug artifact: approximately 22.8 MB
- Current debug APK: 19,124,305 bytes / 18.24 MiB
- Release APK/AAB: **BLOCKED / NOT VERIFIED**

## 14. ADB availability

The SDK contains `adb.exe`, but every invocation fails before enumeration because it attempts to create `\.android` and receives `Permission denied`, including with isolated `ANDROID_USER_HOME` and `ANDROID_SDK_HOME`. ADB operation is therefore **BLOCKED / NOT VERIFIED**.

## 15. Install result

- ADB install: **BLOCKED / NOT VERIFIED**
- Physical Android runtime: **BLOCKED / NOT VERIFIED**
- No startup/logo/runtime claim is made.

## 16. Remaining blockers and configuration notes

- Official Capacitor sync: **BLOCKED / NOT VERIFIED** due the local Node/Ionic `uv_os_get_passwd` ENOMEM failure.
- Signed release APK/AAB: **BLOCKED / NOT VERIFIED** due missing production signing material.
- Production endpoint readiness: **BLOCKED / NOT VERIFIED**. The checked `.env.production` classifies its API/server endpoint as private plain HTTP, so this artifact is restricted to internal debug use. No public HTTPS endpoint was guessed.
- Main Android manifest denies global cleartext (`usesCleartextTraffic=false`) and main network security base config denies cleartext. Debug-only controlled LAN support remains separate.
- FCM physical behavior: **BLOCKED / NOT VERIFIED**.
- Physical installation and runtime: **BLOCKED / NOT VERIFIED**.

Fast regression evidence: post-security functional route/settings/workspace contract passed; mobile release signing/transport/API/APNs source-policy regression passed; i18n/RTL/COE contract passed.
