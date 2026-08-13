# CampusOS cross-platform checkpoint

## Architecture

- Client: React 19 + Vite + TanStack Query + centralized Axios API client.
- Native: Capacitor 8 Android/iOS shells sharing the web build.
- Server: Express + Prisma with shared auth, RBAC, workflows, notifications and finance/payment services.
- Navigation: role-aware route registry plus React Router.
- Realtime: shared client/reconnect manager; coverage remains partial.

## Current phase

Phase 3-5: platform abstraction, deep-link and native build stabilization after repository audit.

## Key configuration

- Capacitor app ID: `com.geetorus.campusos`
- Web output: `product/client/dist`
- API: release requires explicit HTTPS `VITE_API_URL` or `VITE_SERVER_BASE_URL`
- Deep-link scheme: `campusos://`

## Recent files changed

- `product/client/capacitor.config.ts`
- `product/client/src/shared/config/environment.ts`
- `product/client/src/platform/back-button.ts`
- `product/client/src/app/bootstrap/AppBootstrap.tsx`
- Android manifest/build configuration
- iOS `Info.plist`
- `docs/campusos/NATIVE_BUILD_GUIDE.md`

## Verification

- Existing web and server builds passed before this phase.
- Client and server production builds pass.
- Capacitor CLI/runtime aligned to 8.5.0; Node 22+ required for CLI commands.
- Android and iOS Capacitor sync pass with 11 plugins.
- Android `assembleDebug` passes.
- Android unsigned `assembleRelease` with R8/resource shrinking passes.
- Signed-AAB configuration reads credentials only from protected environment variables and fails clearly when they are absent.
- iOS CocoaPods/Xcode compile is blocked on Windows.

## Blockers

- Production API/domain
- Firebase/APNs production credentials
- Android signing keystore
- Apple Developer signing/certificates and macOS/Xcode
- Selection of an audited secure-storage/biometric/share plugin

## Next action

Select secure-storage/share/biometric plugins, configure production domain/API/push/signing, then run device and cross-client workflow tests.
