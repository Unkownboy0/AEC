# GEETORUS CampusOS — Mobile Platform Support Report

**Document Version**: 1.0.4  
**Release Target**: Production Mobile Release (Android & iOS)  
**Date**: 2026-08-19  

---

## 1. Android Platform Specification

| Parameter | Current Configuration | Compliance & Status | Notes |
| :--- | :--- | :--- | :--- |
| **Minimum SDK** | `API 26` (Android 8.0 Oreo) | **STRICTLY ENFORCED** | Retained at API 26 per specifications. Zero dependencies require API 27+. |
| **Target SDK** | `API 35` (Android 15) | **COMPLIANT** | Complies with Google Play Store 2025/2026 Target SDK mandates. |
| **Compile SDK** | `API 35` (Android 15) | **COMPLIANT** | Built with Android SDK 35 build tools & Gradle 8.13. |
| **Gradle Version** | `8.13` | **COMPLIANT** | Modern Gradle daemon with Java 21 LTS toolchain. |
| **Android Gradle Plugin** | `8.7.3` | **COMPLIANT** | Supports full R8 code shrinking and resource optimization. |
| **Java / JVM Target** | `Java 21 LTS` (Oracle 21.0.9) | **COMPLIANT** | High performance enterprise Java runtime. |
| **Application ID** | `com.campusos.app` | **AUTHORITATIVE** | Configurable via `CAMPUSOS_APP_ID` environment variable. |
| **Version Name / Code** | `1.0.4` / `5` | **UPDATED** | Synchronized across `package.json` and `build.gradle`. |

### Android Compatibility Testing Matrix

| Android Version | API Level | Environment | Verification Level | Results & Observations |
| :--- | :--- | :--- | :--- | :--- |
| **Android 8.0 / 8.1** | API 26 / 27 | Emulated / Headless | TEST VERIFIED | Native keystore fallback, scoped storage compatibility, legacy status bar styling. |
| **Android 9.0 (Pie)** | API 28 | Emulated / Headless | TEST VERIFIED | HTTP cleartext traffic policies enforced by `network_security_config.xml`. |
| **Android 10 (Q)** | API 29 | Emulated / Headless | TEST VERIFIED | Dark theme system toggle, scoped storage sandbox boundaries. |
| **Android 11 (R)** | API 30 | Emulated / Headless | TEST VERIFIED | Scoped storage file downloads, no broad external storage permissions requested. |
| **Android 12 / 12L** | API 31 / 32 | Emulated / Headless | TEST VERIFIED | SplashScreen API compatibility, splash icon centered without clipping. |
| **Android 13 (Tiramisu)** | API 33 | Emulated / Headless | TEST VERIFIED | `POST_NOTIFICATIONS` runtime permission prompt lifecycle, themed launcher icons. |
| **Android 14 (Upside Down Cake)** | API 34 | Emulated / Headless | TEST VERIFIED | Predictive back gestures, partial media picker integration. |
| **Android 15 (Vanilla Ice Cream)** | API 35 | Emulated / Headless | TEST VERIFIED | Edge-to-edge system bars with `--safe-area-inset-*` CSS injection. |

---

## 2. iOS Platform Specification

| Parameter | Current Configuration | Compliance & Status | Notes |
| :--- | :--- | :--- | :--- |
| **Capacitor Core / iOS** | `@capacitor/ios@8.5.0` | **COMPLIANT** | Modern Capacitor 8 mobile runtime. |
| **Minimum Deployment Target** | `iOS 14.0` | **DETERMINED & LOCKED** | Declared in `ios/App/Podfile` (`platform :ios, '14.0'`). |
| **Xcode Support Matrix** | `Xcode 15 / 16` | **DOCUMENTED** | Required toolchain for compiling iOS 14.0 - iOS 18+ binaries. |
| **CocoaPods Pods** | 13 Capacitor Native Plugins | **SYNCED** | BiometricAuth, App, Camera, Filesystem, Haptics, Push, Storage. |
| **PWA Web Clip / Safari** | Standalone PWA Manifest | **VERIFIED** | Full screen Web Clip support with `apple-touch-icon.png` (180x180). |
| **Host Build Environment** | Windows 11 (Current) | **BLOCKED (macOS Required)** | Per Rule 39/49: Native `.ipa` archive requires macOS + Xcode toolchain. |

---

## 3. Platform Branding & Asset Specifications

| Asset | Platform | Resolution / Path | Details |
| :--- | :--- | :--- | :--- |
| **Adaptive Foreground** | Android | `108x108` to `432x432` (`res/mipmap-*/`) | 72% safe-zone centered 3D squircle Al-Ameen crest |
| **Launcher Circular** | Android | `48x48` to `192x192` (`res/mipmap-*/`) | Clipped circular launcher badge |
| **Apple Touch Icon** | iOS | `180x180` (`public/apple-touch-icon.png`) | iOS Home Screen icon |
| **PWA Icon** | Web / PWA | `512x512` & `192x192` (`public/pwa-*.png`) | Maskable progressive web application icons |
| **Splash Screen** | Android & iOS | `480x480` & `720x720` (`res/drawable-*/`) | Centered brand emblem with smooth fade-out |
| **Document Watermark** | Universal | Transparent Alpha 0.08 (`branding/watermark-logo.png`) | ID cards, certificates, grade sheets & PDFs |
