# CampusOS Post-Security Functional Closure Report

Date: 2026-08-19  
Baseline: Critical Security Fix, Critical Route Fix, and Mobile Release Hardening reports  
Target milestone: Functionally stable release candidate

## Evidence boundary

This pass used production web builds, authenticated local API execution, generated-file rendering, source/contract tests, and an Android debug build. No physical Android/iOS device, production keystore, macOS/Xcode archive, or live FCM/APNs device was available. `ANDROID RUNTIME` and `iOS RUNTIME` columns therefore do not inherit claims from older reports.

## Functional closure matrix

| Issue | Previous State | Current State | Root Cause | Fix | Automated Test | Android Runtime | iOS Runtime | Status | Remaining Blocker |
|---|---|---|---|---|---|---|---|---|---|
| Stale Capacitor/PWA bundle | Android assets had a different `index.html` hash and 79 files versus 77 in the web build | Final web and Android `index.html` hashes match; 69 pruned assets; service worker cache v3 uses network-first navigation | Capacitor CLI failure left an old copied bundle; fixed cache name retained stale navigation shell | Rebuilt web; pruned installers/maps; replaced generated Android public assets; bumped service-worker cache and navigation strategy | Hash equality and zero nested artifact check | BUILD VERIFIED, not installed | BLOCKED / NOT VERIFIED | BUILD VERIFIED | Physical install/relaunch |
| Internal version diagnostics | Running build could not be identified from UI | Settings > Help exposes version, build code, source commit, build timestamp, and channel | Build metadata was not injected | Added Vite build metadata and internal diagnostics panel | Functional contract + TypeScript | BUILD VERIFIED | STATICALLY VERIFIED | TEST VERIFIED | Physical screen check |
| HOD Page Not Found | Historical missing/mismatched route | Faculty, mentors, allocation, timetable, and leave routes are mounted | Client registry and router previously diverged | Canonical route mounts retained and contract-tested | Route contract; authenticated APIs returned 200 | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Authenticated device navigation |
| Mentor assignments | Reported missing/404 | `/api/hod/mentors` returned 13 scoped faculty/mentors | Route/API mismatch in earlier build | Canonical HOD router and client page retained | Authenticated local API 200 | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Device assignment interaction |
| Faculty allocation dropdowns | Empty or malformed options; `Year undefined`; no free/busy view | Live data: 13 faculty, 6 subjects, 3 sections; labels use semester; workload includes busy/free slots | Client used nonexistent `section.year`; API omitted timetable occupancy | Corrected section label and workload response | Authenticated API plus contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Device visual check |
| Faculty allocation persistence/scope | Persistence and cross-department denial unproven | Test allocation persisted after reload; cross-department faculty attempt returned 403; test record archived afterward | Section scope was unchecked and `sectionId` could be written as `semesterId` fallback | Added section department guard and exact semester matching; removed invalid fallback | Live create/reload/403/cleanup execution | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Physical UI execution |
| `Select�` encoding | Corrupt replacement character previously visible | No replacement-character occurrence in client/server source; allocation uses `Select...` | Corrupt literal in prior client build | Clean UTF-8 strings and rebuilt bundle | Source scan + production build | BUILD VERIFIED | STATICALLY VERIFIED | BUILD VERIFIED | Device font rendering |
| Profile image upload/display | Multiple avatar paths and persistence concerns | Canonical user media service and shared `ProfileAvatar` remain; no institutional logo fallback for people | Fragmented avatar rendering | Canonical avatar component/service preserved | Profile validation and notification/workspace avatar suites passed | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Actual upload/restart on devices |
| Student ID image/data | Could show generic/fabricated field fallbacks | Uses canonical profile avatar; unresolved register/department/blood group/validity now say unavailable instead of inventing student data | UI contained `STU2026`, CSE, O+, and 2026-2030 fallbacks | Removed fabricated identity fields | TypeScript + rendered live ID PDF | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Physical avatar upload/restart |
| Personal Settings | Selectors changed component state only | Theme, font scale, language, and notification state persist through `/users/profile/preferences`; local state still works offline | UI was not connected to existing preference API | Hydrate/save through canonical preference endpoint | Live change/reload/restore passed | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Device UI interaction |
| System Settings access loop | Personal/admin destinations could be confused | Every authenticated role retains `/settings`; admin settings link is shown only to Super Admin; Help query now opens Help | Personal and governed system settings were conflated; query tab was ignored | Kept distinct routes and initialized selected settings tab from query | Source/route contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | STATICALLY VERIFIED | Authenticated role walkthrough |
| System theme | Native icon contrast and resume behavior questionable | Single `resolved` theme drives DOM and native bars; system listener handles OS changes and native resume | Status/system bar foreground styles were inverted | Corrected dark/light icon style mapping; retained system media/resume reconciliation | TypeScript + mobile policy tests | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Cold start/resume on devices |
| Font & display | Selector existed | Four presets apply root font scale and persist to server | Persistence missing | Connected existing scale engine to preference endpoint | Live preference reload | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Large-font physical QA |
| Notifications preference | Toggle was local-only | Toggle persists the actual next boolean and reloads correctly | No server write | Connected canonical preference endpoint | Live preference reload | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Push preference device effect |
| Product tour | Replay controls existed | Help link opens Help and both onboarding/role tour replay controls remain | `?tab=help` was ignored | Settings query initialization fixed | TypeScript + contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Device walkthrough |
| 12 languages | Only English/Tamil/Hindi/French selector; selection did not translate app | English, Tamil, Hindi, Malayalam, Telugu, Kannada, Bengali, Marathi, Gujarati, Punjabi, Urdu, and Arabic are selectable; common shell dictionary includes dashboard, requests, timetable, notifications, profile, settings, save, cancel, download, share, delete, search, and common errors | No language runtime existed | Added global language provider, persistence, shell navigation translation, `lang`, and RTL `dir` for Urdu/Arabic | 12-code/common-key/RTL contract + live preference API | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED for common shell | Full page-by-page translation and physical glyph QA |
| Branding distortion/duplication | Five identical institution logos and several identical/unused app icons shipped | One canonical institution logo and one canonical app icon remain; person avatar remains separate; all logo renderers use `object-contain` | Same bytes copied under semantic-looking names | Repointed consumers/manifest and removed verified unreferenced duplicates | Hash/reference audit + build | BUILD VERIFIED | STATICALLY VERIFIED | BUILD VERIFIED | Small/large device visual QA |
| Bottom navigation | Blur/shadow/glow and possible overlap | Opaque native-style surface, border, stable active marker, safe-area padding, labels/icons, badge state, keyboard hiding | Decorative backdrop/shadow remained | Removed blur/sticky shadow; retained safe-area/active/badge logic | Functional contract + mobile badge tests | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Gesture/three-button navigation devices |
| Global FAB | Could appear on non-create/detail screens | Requires real contextual actions and is blocked on profile, settings, IDs, certificates, fees, placements, results, error/access-denied, approvals, HOD allocation/mentor, and editors | Global shell rendering lacked enough route policy | Central quick-start policy retained/expanded | Functional contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Authenticated screen sweep |
| Approval action footer | Footer could sit behind bottom navigation | Mobile modal is bottom-sheet shaped, scroll-contained, z-indexed above nav, and footer has safe-area padding | Desktop-centered modal/footer sizing | Added `100dvh` bound, mobile edge alignment, safe-area action footer | TypeScript + source contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | BUILD VERIFIED | Physical small-screen approval action |
| Placement mixed theme | Reported mixed dark/light surface | Current placement page uses semantic surfaces and paired light/dark status tokens | Legacy hardcoded surfaces | Existing tokenized implementation preserved; rebuilt | TypeScript + production build | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | BUILD VERIFIED | Authenticated visual QA |
| ID/attendance/receipt PDFs | File presence had been treated as success | Live Student ID (2 pages) and attendance PDFs plus fixture fee receipt were opened as rendered PNGs; content was meaningful | Verification stopped at `%PDF` signature; attendance bio values overlapped | Added constrained bio columns and spacing; rendered again with no overlap | PDF suite; visual render verification | Download API TEST VERIFIED; device save BLOCKED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Certificate/hall-ticket fixtures; device file picker |
| Certificate/bonafide/conduct/hall ticket | Buttons/routes exist in domain modules | Not fully exercised with reproducible issued records in this pass | No deterministic current fixture/issued record supplied | No fabricated record added | Existing compile/routes only | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | Issued test records and device download |
| Download vs cloud upload | Conflicting success/failure concern | Canonical download helpers only fetch/save/open; Drive upload remains a separate input/action; fee receipt download does not upload | Earlier flows mixed responsibilities | Existing separation retained; dead embedded APK download removed | File/PDF lifecycle suite + source scan | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Physical file chooser/share-sheet behavior |
| Workspace create vs share vs submit | Personal create could appear to trigger HOD workflow | Create, share, and `submitForWorkflow` are distinct server methods/endpoints; create body has no submission call | UI semantics previously unclear | Contract added to prevent implicit submission | Functional contract + workspace access/policy suites | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Two live user sessions |
| Workspace mobile CRUD | Prior reports indicated mobile editor/route fixes | DOC/SHEET/SLIDE/FORM/NOTE/REPORT routes and create/open/edit/save/export APIs compile; Drive trash/restore/permanent delete contracts pass | Earlier wildcard routes and desktop-only shells | Existing responsive editors/routes retained | Workspace, governed-file, lifecycle suites | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED at API/contract level | Authenticated device matrix for each editor |
| Trash/retention | Lifecycle required proof | User-created documents and Drive items support trash, restore, then permanent delete; official records remain retention protected | Lifecycle was split across services | Existing governed lifecycle retained | Global trash/retention and workspace tests passed | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Device UI execution |
| Demo payment UI/ledger | Older report claimed adaptive demo, but security baseline now requires explicit server provider | Security and idempotency paths pass; current local configuration is not demo, so Razorpay/demo UI transaction was not forced | Local environment explicitly selects non-demo provider | No insecure fallback reintroduced | Payment gateway/security + 10 idempotency scenarios passed | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED for policy; BLOCKED for ₹1,300 E2E | Explicit `PAYMENT_GATEWAY=DEMO_PAYMENT` test deployment and accountant session |
| Notification badge | Mark-read and badge behavior previously failed | Idempotent read, true badge summary, zero hiding, `99+`, optimistic UI, and sender avatar contracts pass | Read/delete route and state synchronization gaps | Existing notification fixes preserved | Mobile badge and avatar tests passed | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | TEST VERIFIED | Foreground/background device behavior |
| SSE proxy | Generic Nginx proxy had 90-second timeout and buffering defaults | Exact `/api/rbac/stream` blocks disable buffering/cache, clear upgrade connection, set one-hour read/send timeouts, and emit no-buffer/no-transform headers | Production proxy was not SSE-specific | Updated both local and hardened public Nginx configs | Functional config contract | BLOCKED / NOT VERIFIED | BLOCKED / NOT VERIFIED | STATICALLY VERIFIED | Deployed Nginx and two concurrent clients |

## Build freshness and mobile packaging

- Production Vite build: **BUILD VERIFIED**, 3,265 modules.
- Capacitor CLI: **BLOCKED / NOT VERIFIED** due `uv_os_get_passwd returned ENOMEM` in the installed Node/Ionic utility path.
- Generated Android web assets were safely refreshed from the pruned production `dist` directory after the CLI failure.
- Final web/Android `index.html` SHA-256: `9BC9D35A2F9E9DF26BF5C1E75CE7442A7F314F2728E6AEB1AD23E047EB325840` (exact match).
- Nested `.apk`, `.aab`, and `.map` files in Android web assets: `0`.
- Android `assembleDebug`: **BUILD VERIFIED**, 457 tasks, 3 executed.
- Final debug APK: `22,814,973` bytes; SHA-256 `204FAC00F65E336F0BFA756BAFA02DDBACE1468B61C058B77BB0D21E74F6E43F`.
- Release APK/AAB: **BLOCKED / NOT VERIFIED**. No production keystore was available and no debug-signing fallback was permitted.

## 212 MB root cause and cleanup

The stale 224,457,420-byte AAB embedded:

- `base/assets/public/branding/CampusOS-Android.apk` — 129,648,213 bytes.
- `base/assets/public/downloads/campusos-release.apk` — 82,917,544 bytes.

Another root-level 130,978,964-byte file named as a v1.0.5 release embedded 82,917,544-byte and 36,204,983-byte APKs. These were not valid current release candidates. The misleading generated AAB, root candidate, and stale v1.0.1/v1.0.2 distribution AABs were removed. The web UI's dead direct-APK download link was replaced with an institution-managed distribution message. The existing build prune step prevents `.apk`, `.aab`, `.zip`, and `.map` files entering the mobile web bundle.

Before/after evidence:

| Artifact | Bytes | Result |
|---|---:|---|
| Stale release AAB | 224,457,420 | Removed; contained two nested APKs |
| Stale root v1.0.5 AAB | 130,978,964 | Removed; contained two nested APKs |
| Pre-dedup debug APK | 21,744,185 | No nested installers, duplicated branding remained |
| Final debug APK | 22,814,973 | Zero nested installers/maps; canonical branding only |

The debug APK is larger than the immediately preceding debug build because debug ZIP/dex packaging is not a release-size comparison. The critical 200+ MB inflation source is absent. A signed release-size number cannot be claimed until a real keystore build succeeds.

## Final debug APK top 50 largest entries

| # | Bytes | Entry |
|---:|---:|---|
| 1 | 10,402,320 | `classes.dex` |
| 2 | 8,092,236 | `classes16.dex` |
| 3 | 4,737,736 | `assets/public/assets/index-BVIG79Ja.js` |
| 4 | 4,575,544 | `classes17.dex` |
| 5 | 1,395,512 | `resources.arsc` |
| 6 | 872,506 | `res/drawable-port-xxxhdpi-v4/splash.png` |
| 7 | 670,187 | `res/drawable-land-xxxhdpi-v4/splash.png` |
| 8 | 640,382 | `res/drawable-port-xxhdpi-v4/splash.png` |
| 9 | 569,376 | `classes13.dex` |
| 10 | 394,951 | `res/drawable-land-xxhdpi-v4/splash.png` |
| 11 | 393,748 | `assets/public/assets/pdfExportService-DFvnw43-.js` |
| 12 | 339,345 | `assets/public/app-icon.png` |
| 13 | 306,133 | `res/drawable-port-xhdpi-v4/splash.png` |
| 14 | 300,456 | `res/drawable/splash.png` |
| 15 | 279,853 | `assets/public/branding/official-logo.png` |
| 16 | 233,529 | `res/drawable-land-xhdpi-v4/splash.png` |
| 17 | 226,067 | `assets/public/assets/index-CVAobLlc.css` |
| 18 | 161,046 | `assets/public/branding/vv.png` |
| 19 | 153,056 | `classes9.dex` |
| 20 | 150,777 | `assets/public/assets/index.es-DiRFpKBj.js` |
| 21 | 144,962 | `res/drawable-port-hdpi-v4/splash.png` |
| 22 | 139,083 | `res/mipmap-xxxhdpi-v4/ic_launcher_foreground.png` |
| 23 | 136,709 | `META-INF/CERT.SF` |
| 24 | 136,632 | `META-INF/MANIFEST.MF` |
| 25 | 113,000 | `classes5.dex` |
| 26 | 109,066 | `res/drawable-land-hdpi-v4/splash.png` |
| 27 | 80,931 | `res/mipmap-xxhdpi-v4/ic_launcher_foreground.png` |
| 28 | 73,764 | `classes2.dex` |
| 29 | 67,634 | `res/drawable-port-mdpi-v4/splash.png` |
| 30 | 60,900 | `classes11.dex` |
| 31 | 56,988 | `classes10.dex` |
| 32 | 54,950 | `assets/public/pwa-192x192.png` |
| 33 | 54,950 | `res/mipmap-xxxhdpi-v4/ic_launcher.png` |
| 34 | 53,467 | `assets/native-bridge.js` |
| 35 | 52,571 | `res/mipmap-xxxhdpi-v4/ic_launcher_round.png` |
| 36 | 51,265 | `res/drawable-land-mdpi-v4/splash.png` |
| 37 | 50,784 | `classes3.dex` |
| 38 | 48,865 | `assets/public/apple-touch-icon.png` |
| 39 | 48,104 | `lib/x86_64/libimage_processing_util_jni.so` |
| 40 | 38,747 | `res/mipmap-xhdpi-v4/ic_launcher_foreground.png` |
| 41 | 38,292 | `lib/x86/libimage_processing_util_jni.so` |
| 42 | 32,474 | `res/mipmap-xxhdpi-v4/ic_launcher.png` |
| 43 | 31,592 | `res/mipmap-xxhdpi-v4/ic_launcher_round.png` |
| 44 | 30,953 | `assets/public/assets/FinanceWorkspace-CnWeuALd.js` |
| 45 | 29,399 | `kotlin/kotlin.kotlin_builtins` |
| 46 | 29,008 | `lib/arm64-v8a/libimage_processing_util_jni.so` |
| 47 | 28,911 | `assets/public/assets/purify.es-Jn2rvFN8.js` |
| 48 | 24,840 | `classes6.dex` |
| 49 | 24,406 | `assets/public/assets/StudentPlacements-CxRqKnEb.js` |
| 50 | 23,058 | `assets/public/assets/StudentLeaveOd-x7pwElfC.js` |

Primary remaining size opportunities are release minification/dex analysis, main-bundle code splitting, and splash raster optimization. No plugin or document capability was removed blindly.

## Verification executed

Passed:

- Client TypeScript
- Server TypeScript
- Production Vite build
- Android debug Gradle build
- Post-security functional contract
- Mobile role header and true badge suite
- Profile media validation
- Workspace/notification profile picture suite
- Workspace access and governed lifecycle suites
- File/document lifecycle and PDF integrity suite
- Global download/trash/retention/gender suite
- Payment security, gateway, and ten-case idempotency suite
- HOD department scope and 14-scenario timetable E2E suite
- Authenticated HOD live API reads
- Faculty allocation create, reload, cross-department denial, and cleanup
- Personal settings change, reload, and restoration
- Visual PDF render review for Student ID, attendance, and fee receipt

## Platform and subsystem verdict

| Area | Verdict | Reason |
|---|---|---|
| SERVER SECURITY | TEST VERIFIED | Previous security baseline retained; targeted regressions and TypeScript passed |
| WEB | BUILD VERIFIED / FUNCTIONAL TEST VERIFIED | Production build, local login surface, authenticated APIs, settings persistence, routes, and file renders passed; full authenticated browser matrix remains blocked |
| ANDROID | BUILD VERIFIED; RUNTIME BLOCKED / NOT VERIFIED | Fresh debug APK built from matching assets; no physical install, gesture/nav, theme, or download execution |
| iOS | BLOCKED / NOT VERIFIED | No macOS/Xcode archive, Podfile.lock generation, signing, APNs, or physical test |
| CAMPUS WORKSPACE | TEST VERIFIED; DEVICE BLOCKED | Separation/lifecycle/editor contracts pass; seven-app physical interaction matrix remains |
| NOTIFICATIONS | TEST VERIFIED; PHYSICAL PUSH BLOCKED | Routing/badge/in-app contracts pass; FCM foreground/background/closed/locked/tap requires device/network |
| PAYMENTS | SECURITY TEST VERIFIED; DEMO E2E BLOCKED | Provider trust and idempotency pass; current deployment is not explicitly demo-enabled |
| SSE | STATICALLY VERIFIED; PRODUCTION RUNTIME BLOCKED | Server and both Nginx configurations are SSE-aware; deployed proxy/two-session test unavailable |
| OVERALL RELEASE | NOT YET A FUNCTIONALLY STABLE RELEASE CANDIDATE | Android/iOS physical runtime, signed release, full authenticated screen sweep, demo-payment E2E, certificate/hall-ticket artifacts, and physical push remain open |

The product is materially closer to the milestone, but this report does **not** declare `PRODUCTION READY` or `FUNCTIONALLY STABLE RELEASE CANDIDATE` without the remaining runtime gates.
