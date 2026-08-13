# CampusOS mobile release checklist

## Android

- [ ] Set production HTTPS API URL at build time.
- [ ] Confirm `com.geetorus.campusos`, versionCode and versionName.
- [ ] Supply release keystore through uncommitted Gradle properties/environment.
- [ ] Build and inspect signed AAB; test R8 release build.
- [ ] Verify adaptive icon, splash and monochrome notification icon on devices.
- [ ] Configure production Firebase project and verify token refresh/logout invalidation.
- [ ] Publish privacy policy and complete Data Safety from verified data flows.
- [ ] Document camera, notification, file and biometric permission purposes actually used.
- [ ] Provide reviewer test account and account-deletion behavior.
- [ ] Capture required phone/tablet screenshots from release build.

## iOS

- [ ] Confirm bundle ID, marketing version and build number.
- [ ] Configure Apple signing team, certificates and provisioning profiles.
- [ ] Configure APNs capability and production Firebase plist if used.
- [ ] Add production Associated Domains and publish `apple-app-site-association`.
- [ ] Verify privacy usage descriptions against enabled features.
- [ ] Supply complete AppIcon set and launch experience.
- [ ] Complete App Privacy answers from verified data flows.
- [ ] Archive and validate using current Xcode on macOS.
- [ ] Test notification, deep-link, document picker, share and Face ID flows on a physical device.

No signing secrets, store credentials or private keys belong in the repository.

