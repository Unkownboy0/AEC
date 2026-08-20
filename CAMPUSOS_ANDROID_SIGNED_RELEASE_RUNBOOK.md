# CampusOS Android Signed Release Runbook

## Required secret environment variables

- `CAMPUSOS_APP_ID`
- `CAMPUSOS_KEYSTORE_PATH` - absolute path outside the repository
- `CAMPUSOS_KEYSTORE_PASSWORD`
- `CAMPUSOS_KEY_ALIAS`
- `CAMPUSOS_KEY_PASSWORD`

Never commit the keystore, passwords, generated signing properties, certificate dumps, or shell history containing secrets. Restrict keystore file permissions and obtain it through the approved secret manager.

## Build and verify

1. Confirm a clean, reviewed commit and record `git rev-parse HEAD`.
2. Build the web client, prune forbidden nested artifacts, and run the approved Capacitor sync.
3. From `product/client/android`, run `gradlew.bat clean assembleRelease bundleRelease`.
4. Locate the APK under `app/build/outputs/apk/release/` and AAB under `app/build/outputs/bundle/release/`.
5. Run `apksigner verify --verbose --print-certs <release.apk>` using the Android SDK Build Tools binary.
6. Record certificate SHA-256, APK SHA-256, AAB SHA-256, byte sizes, application ID, version name, and version code.
7. Inspect the archives and require zero nested `.apk`, `.aab`, `.zip`, or `.map` entries below `assets/public`.
8. Rename without modifying bytes: `CampusOS-<versionName>-build<versionCode>-<commit>-release.apk` and equivalent `.aab`.

## Device verification

1. `adb devices -l`
2. `adb install <exact-release.apk>` on a clean test device.
3. Record output and complete the Android checklist.
4. Install the previously approved version, then run `adb install -r <exact-release.apk>` to prove update compatibility.
5. Re-run `sha256sum`/`Get-FileHash` on the installed candidate source artifact.

## Play/AAB readiness

Confirm the AAB is signed, versionCode is unused and increasing, target/compile SDK policy is current, Play App Signing ownership is confirmed, Data Safety/privacy declarations match behavior, mapping/native symbols are retained securely, staged rollout and rollback owners are assigned, and the exact uploaded AAB hash matches this record.
