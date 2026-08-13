# CampusOS cross-platform audit

Audit date: 2026-08-11. Repository: existing React/Vite client, Express/Prisma server, Capacitor Android/iOS shells.

| Area | Status | Evidence and action |
|---|---|---|
| Shared backend/database | WORKING | One Express API and Prisma schema are used by all clients. Server build passes. |
| Web client | WORKING | React 19, Vite and shared API client. Production build passes. |
| Capacitor foundation | PARTIAL | Android and iOS projects exist. CLI/runtime major mismatch corrected to Capacitor 8; native gates still required. |
| Production API configuration | PARTIAL | Production localhost fallback removed. Release now requires explicit `VITE_API_URL`/`VITE_SERVER_BASE_URL`. Deployment URL is not supplied. |
| Authentication/session refresh | PARTIAL | Shared token/refresh flow exists. Native tokens currently use Capacitor Preferences, which is not OS keychain-grade secure storage. Secure-storage plugin selection remains required. |
| RBAC/ABAC | PARTIAL | Server guards, department scope and delegation services exist; full malicious cross-role/tenant test suite is missing. |
| Canonical routing | PARTIAL | Route registry drives primary navigation. Several legacy dynamic and duplicate routes remain; authenticated 404 recovery is implemented. |
| Workspace switching | PARTIAL | Token/workspace switching exists. Permission-sensitive query-cache invalidation needs full verification across every workspace. |
| Platform adapters | PARTIAL | Platform, camera, files, network, keyboard, lifecycle, status bar and back-button adapters exist. Share, biometric, QR and NFC adapters are missing. |
| Android navigation/back | PARTIAL | Central back-handler stack exists and listener cleanup is fixed. Unsaved-form confirmation is not universal. |
| Safe areas/system UI | PARTIAL | Status bar and mobile layouts exist. Device matrix for cutouts/home indicator is not tested. |
| Offline/network | PARTIAL | Shared network adapter and offline banner exist. Mutation queue policy and reconnect refetch coverage are incomplete. |
| Realtime | PARTIAL | One realtime client and reconnect manager exist. Backend event coverage/scoping and end-to-end multi-client tests are incomplete. |
| Notifications | PARTIAL | DB/in-app/native registration architecture exists. Firebase/APNs production credentials and multi-device delivery tests are blocked. |
| Deep links | PARTIAL | Runtime URL listener plus `campusos://` Android/iOS registration added. HTTPS App/Universal Links require the production domain and association files. |
| Upload/file validation | PARTIAL | Existing upload routes and camera/files adapters exist. Complete MIME/size/ownership audit is not finished. |
| Downloads | PARTIAL | Platform-aware file saving exists. Native open/share behavior and all requested artifact tests are incomplete. |
| Payments | PARTIAL | Server order/signature verification and ledger flow exist. Native gateway return/deep-link E2E is not tested. |
| Android production security | PARTIAL | Cleartext disabled, backups disabled and R8/resource shrinking enabled. Debug and unsigned release/R8 APK builds pass; signed AAB still requires release credentials. |
| iOS production configuration | PARTIAL | Project and privacy descriptions exist. APNs, associated domains, signing and Xcode archive are BLOCKED on Windows/without Apple credentials. |
| Biometrics | MISSING | No supported biometric plugin is installed. Server authorization remains authoritative. |
| Native share | MISSING | Capacitor Share plugin/service is not installed. |
| NFC | MISSING | No NFC plugin/provider implementation; attendance remains hardware-independent at the backend level only. |
| Automated cross-platform E2E | MISSING | Required Android/iOS/Web cross-client scenarios are not implemented. |
| Security test suite | MISSING | Required ownership, tenant, delegation and tampered-payment tests need executable coverage. |

## Immediate risks

1. A production API URL, Firebase/APNs credentials and signing identities are not available.
2. Native refresh tokens are not yet stored in Keychain/Android Keystore-grade storage.
3. Several existing feature pages still contain legacy/demo-only content and need migration to authoritative APIs.
4. Android signing/AAB and iOS archive must not be called production-ready until credentials and platform-specific gates pass.
