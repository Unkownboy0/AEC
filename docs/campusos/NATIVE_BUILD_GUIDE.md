# CampusOS native build guide

## Prerequisites

- Node.js 22 or newer
- Java 17
- Android SDK 35 for Android
- macOS with current Xcode and CocoaPods for iOS
- Production HTTPS API URL

Never commit keystores, passwords, `.p12` files, provisioning profiles or App Store credentials.

## Android development APK

From `product/client` in PowerShell:

```powershell
$env:VITE_APP_ENV='development'
$env:VITE_API_URL='http://YOUR-LAN-IP:5000/api'
$env:VITE_ENABLE_MOBILE_DEBUG='false'
npm run build
npx cap sync android
Set-Location android
.\gradlew.bat assembleDebug
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`

Install on a connected device:

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

## Signed Android AAB

Create or use your private Play upload keystore. If creating a new upload key, keep it outside the repository and back it up securely:

```powershell
keytool -genkeypair -v -keystore C:\secure\campusos-upload.jks -alias campusos-upload -keyalg RSA -keysize 4096 -validity 10000
```

Set release values only in the current terminal or protected CI secrets:

```powershell
$env:VITE_APP_ENV='production'
$env:VITE_API_URL='https://YOUR-PRODUCTION-DOMAIN/api'
$env:VITE_SOCKET_URL='https://YOUR-PRODUCTION-DOMAIN'
$env:CAMPUSOS_ANDROID_KEYSTORE_FILE='C:\secure\campusos-upload.jks'
$env:CAMPUSOS_ANDROID_KEYSTORE_PASSWORD='YOUR_STORE_PASSWORD'
$env:CAMPUSOS_ANDROID_KEY_ALIAS='campusos-upload'
$env:CAMPUSOS_ANDROID_KEY_PASSWORD='YOUR_KEY_PASSWORD'
npm run release:android:aab
```

Signed AAB output:

`android/app/build/outputs/bundle/release/app-release.aab`

The Gradle build intentionally stops when any signing variable is missing. Verify the artifact before upload:

```powershell
jarsigner -verify -verbose -certs android\app\build\outputs\bundle\release\app-release.aab
```

## iOS preparation on Windows

Windows can build the shared web assets and synchronize the native iOS source:

```powershell
$env:VITE_APP_ENV='production'
$env:VITE_API_URL='https://YOUR-PRODUCTION-DOMAIN/api'
npm run prepare:ios
```

Windows cannot run Xcode, codesign or create an App Store IPA. Copy/checkout the same repository on a Mac; do not copy `node_modules`.

## iOS archive on macOS

Install Node 22+, Xcode command-line tools and CocoaPods, then from `product/client`:

```bash
export VITE_APP_ENV=production
export VITE_API_URL=https://YOUR-PRODUCTION-DOMAIN/api
npm ci
npm run prepare:ios
cd ios/App
pod install
open App.xcworkspace
```

In Xcode:

1. Select the `App` target and set the Apple Developer Team.
2. Confirm bundle ID `com.geetorus.campusos` is registered for that team.
3. Add Push Notifications and Associated Domains after configuring production domains.
4. Select **Any iOS Device (arm64)**.
5. Choose **Product → Archive**.
6. In Organizer, run **Validate App**, then distribute to TestFlight/App Store Connect.

For command-line CI, create the Xcode archive only after installing the signing certificate and provisioning profile in the macOS keychain:

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/CampusOS.xcarchive archive
```

Final export requires an organization-specific `ExportOptions.plist`; do not invent its team ID or signing method.

## Required external inputs

- Android upload keystore and its four signing values
- Apple Developer Team/account, distribution certificate and provisioning profile
- Production API/domain
- Firebase production configuration and APNs key for push
