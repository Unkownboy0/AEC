# CampusOS Production Android Release Report

Date: 2026-08-19

## Source and version

- Source branch: `new-updates-from-tuf`
- Source commit: `920c9d11f9b59cf18fdef4938dfde100d62d8302`
- versionName: `1.0.6`
- versionCode: `7`
- applicationId: `com.campusos.app`
- minSdk: `26`
- targetSdk / compileSdk: `35` / `35`

The existing dirty working tree was preserved. No reset, revert, stash, or source discard was performed.

## Production API URL classification

Status: **BLOCKED / NOT VERIFIED**

The current `.env.production` endpoint classifies as private and plain HTTP. No approved public HTTPS origin was supplied, and no replacement domain was guessed. A production release must provide a stable public `https://` API URL; realtime/SSE must derive from the same approved HTTPS origin.

Fail-closed policy is **BUILD VERIFIED** by:

- `mobile_release_security_regression.test.ts`
- `mobile_readiness_verification.test.ts`

The tested policy rejects empty URLs, plain HTTP, localhost, `127.0.0.1`, `10/8`, `172.16/12`, and `192.168/16`, while accepting a syntactically valid public HTTPS origin. The bundled production Capacitor path disables cleartext; an explicit development-server URL is rejected in production.

## Capacitor sync

Status: **BUILD VERIFIED**

Root cause of the earlier CLI failure is the local Node 24.19 runtime: `os.userInfo()` fails with `uv_os_get_passwd ENOMEM`. Global npm/npx are separately misdirected to missing roaming npm modules. A temporary invocation-only preload supplied the already verified Windows `USERPROFILE` to Node's `os.userInfo`; no project dependency was upgraded. The installed Capacitor CLI then completed official Android sync with all 13 configured plugins. The temporary preload file was removed afterward.

- Web index SHA-256: `8E4044A905F69CD9604C76B2980C22CE4F15E265CEAA9E033293D7E9BAEBD106`
- Android index SHA-256: `8E4044A905F69CD9604C76B2980C22CE4F15E265CEAA9E033293D7E9BAEBD106`
- Hash result: match
- Forbidden `.apk/.aab/.ipa/.zip/.map` files in Android web assets: 0

The generated Capacitor config still classifies its host as private and therefore is not approved production configuration.

## Production release signing

Status: **BLOCKED / NOT VERIFIED**

The existing required variables remain unchanged:

- `CAMPUSOS_ANDROID_KEYSTORE_FILE`
- `CAMPUSOS_ANDROID_KEYSTORE_PASSWORD`
- `CAMPUSOS_ANDROID_KEY_ALIAS`
- `CAMPUSOS_ANDROID_KEY_PASSWORD`

All four are absent. The Gradle release path is fail-closed and does not fall back to debug signing. No replacement key was generated.

## Release APK

- Required name: `CampusOS-v1.0.6-build7-release.apk`
- Path: **BLOCKED / NOT VERIFIED**
- Size: **BLOCKED / NOT VERIFIED**
- SHA-256: **BLOCKED / NOT VERIFIED**
- Signer certificate SHA-256: **BLOCKED / NOT VERIFIED**
- Status: **BLOCKED / NOT VERIFIED**

No release APK was assembled because the public HTTPS endpoint and production signing material are missing.

## Release AAB

- Required name: `CampusOS-v1.0.6-build7-release.aab`
- Path: **BLOCKED / NOT VERIFIED**
- Size: **BLOCKED / NOT VERIFIED**
- SHA-256: **BLOCKED / NOT VERIFIED**
- versionCode verification: **BLOCKED / NOT VERIFIED**
- Status: **BLOCKED / NOT VERIFIED**

No AAB was assembled because the public HTTPS endpoint and production signing material are missing.

## Nested artifact check

Android synchronized web assets contain zero nested APK, AAB, IPA, ZIP, or source-map artifacts. Release-package inspection remains **BLOCKED / NOT VERIFIED** because no release package exists.

## ADB status

Status: **BUILD VERIFIED**

The prior `\.android` permission failure was caused by the restricted execution boundary. Running the SDK's existing ADB with normal access to the Windows user-owned Android directory succeeds:

```text
List of devices attached

```

No Android device or emulator is connected.

## Install and physical-device verification

- Clean release install: **BLOCKED / NOT VERIFIED**
- Update release install: **BLOCKED / NOT VERIFIED**
- Physical launch/login/session restore: **BLOCKED / NOT VERIFIED**
- Workspace switch/theme/language/profile/avatar: **BLOCKED / NOT VERIFIED**
- Student ID/HOD mentor assignment/Faculty Allocation/Leave Approval: **BLOCKED / NOT VERIFIED**
- Workspace/downloads/Hall Ticket: **BLOCKED / NOT VERIFIED**
- Device HTTPS API/login/SSE behavior: **BLOCKED / NOT VERIFIED**

No release artifact or connected device exists, so no installation or runtime claim is made.

## Firebase / FCM

An Android `google-services.json` file is present, but foreground/background/killed/tap behavior has not been exercised on a physical device. Status: **BLOCKED / NOT VERIFIED**.

## Size comparison

- Current verified debug APK: 19,124,305 bytes / 18.24 MiB
- Release APK: **BLOCKED / NOT VERIFIED**
- Release AAB: **BLOCKED / NOT VERIFIED**

## Remaining prerequisites

1. Supply the approved stable public HTTPS API origin and rebuild/sync with that configuration.
2. Supply the existing production keystore and all four signing variables without exposing their values.
3. Run `gradlew.bat clean assembleRelease bundleRelease`.
4. Verify the release APK with `apksigner`, reject any `CN=Android Debug` signer, and record the production certificate digest.
5. Verify APK/AAB hashes, sizes, version metadata, source alignment, and zero nested artifacts.
6. Connect a physical Android device, perform clean/update installs, and execute the critical smoke and production-network checks.
7. Exercise FCM behavior if Firebase production configuration is approved.

## Final verdict

Production Android release: **BLOCKED / NOT VERIFIED**.

The public HTTPS endpoint and production signing material are mandatory missing prerequisites. Physical-device verification is also pending. CampusOS is not declared production ready.
