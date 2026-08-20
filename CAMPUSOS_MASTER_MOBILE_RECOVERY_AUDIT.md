# CAMPUSOS MASTER MOBILE RECOVERY AUDIT

**Audit Date:** August 19, 2026  
**System:** GEETORUS CampusOS (Single Coordinated Mobile Recovery & Release Stabilization Pass)  
**Target Platform:** Mobile (Android / iOS Capacitor) & Universal Responsive Web  
**Version Target:** v1.0.5 (versionCode 6)

---

## 1. Executive Summary & Root-Cause Matrix

| # | Domain / Area | Role | Client Route | Backend API | Model / Source | Root Cause | Fix Description | Security & Integrity Impact | Status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **HOD Mentors API** | HOD | `/hod/mentors` | `GET /api/hod/mentors` | `Faculty`, `Student`, `Department` | Endpoint missing in `hod.routes.ts`, causing 404 which the client incorrectly labeled as "Offline". | Implement authorized `GET /api/hod/mentors` with department-scoping, mentee counts, and status; fix client error state mapping. | High — Prevents unauthorized department cross-visibility and resolves broken mentor advisement view. | RESOLVED |
| 2 | **Faculty Allocation Form Encoding** | HOD | `/hod/allocation` | `GET /api/hod/allocation/*`, `POST /api/hod/allocation/assign` | `SubjectAssignment`, `Faculty`, `Subject` | Corrupted UTF-8 replacement characters (`\uFFFD`) displayed as `"Select"` in dropdowns. | Clean character encoding to `"Select..."`, load real subjects/sections/faculty workload, and validate inputs before assignment. | Medium — Ensures valid relational assignments and prevents corrupted data submission. | RESOLVED |
| 3 | **HOD Navigation & 404 Routes** | HOD | `/hod/*` | `GET /api/hod/*` | HOD Module Routes | Stale and missing route definitions across sidebar, launcher, and deep links leading to Page Not Found. | Consolidate and audit all HOD direct routes and navigation items; guarantee valid role-aware fallbacks. | High — Eliminates broken navigation paths for department heads. | RESOLVED |
| 4 | **Personal vs Super Admin Settings** | All Roles vs Super Admin | `/settings` vs `/admin/settings` | `GET/PUT /settings/catalog`, `PUT /users/:id` | `User`, `SystemSetting` | `/settings` was protected with `superAdminOnly` and rendered Super Admin's configuration catalog for all users. | Route `/settings` to personal `Settings` page (Theme, Font, Notifications, Security, Tour, Profile) for all users; reserve `/admin/settings` strictly for Super Admin. | Critical — Restores standard user preferences while maintaining strict 403 authorization for system config. | RESOLVED |
| 5 | **Profile Photo Upload** | Student, Faculty, Staff | `/student/profile`, `/hod/profile`, etc. | `PUT /api/users/profile/avatar`, `PUT /api/users/profile` | `MediaFile`, `User` | Client sent `profilePhoto` base64 to generic profile endpoint `/users/profile`, which threw `"Use the profile avatar endpoint..."`. | Update profile pages to call dedicated canonical `PUT /users/profile/avatar` with `{ name, mimeType, base64 }`, update avatar reference, and invalidate `/me` cache. | High — Eliminates raw upload error and synchronizes profile pictures across all views without logout. | RESOLVED |
| 6 | **Canonical Profile Avatar & Gender** | All Roles | Everywhere (`ProfileAvatar`) | `GET /api/users/:id/avatar` | `User`, `Student`, `Faculty` | Inconsistent avatar rendering, fallback handling, and gender field synchronization. | Standardize `ProfileAvatar` everywhere with priority: Custom photo > Gender-aware SVG default > Initials; normalize gender across models (`MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`, `UNSPECIFIED`). | Low — Improves visual polish and privacy-aware representation. | RESOLVED |
| 7 | **Mobile Header** | All Roles | Universal Mobile Header | Client Context | Auth User, Role Context | Inconsistent greetings, long name clipping, and redundant "Welcome back" banners below header. | Unify on single `RoleHeader` component with role-specific subtitle, true red badge on bell, avatar, and suppress duplicate dashboard greetings on mobile. | Low — Delivers clean, executive mobile UI. | RESOLVED |
| 8 | **Mobile Bottom Navigation** | All Roles | App Shell | Navigation Registry | Role Navigation | Heavy neon glows, purple/green blur leakage, and active tab bleed. | Rebuild clean native bottom navigation bar with semantic light/dark surfaces, primary active indicator, and safe-area padding. | Low — Native-grade aesthetics and WCAG touch compliance. | RESOLVED |
| 9 | **System Theme & App Resume** | All Roles | All Pages | LocalStorage / Platform | Theme Context | System appearance changes while backgrounded were not reconciled on resume on certain Android devices. | Listen for `@capacitor/app` `appStateChange` to re-evaluate system appearance on resume; centralized native system bars sync helper. | Medium — Guarantees consistent system theme synchronization across OEM devices. | RESOLVED |
| 10 | **Font & Display Scaling** | All Roles | `/settings` | LocalStorage / CSS Tokens | CSS Root Custom Properties | Lack of user-selectable display scaling options. | Add Compact (0.92x), Default (1.0x), Comfortable (1.08x), and Large (1.16x) display presets in Settings, respecting OS accessibility scale. | Low — Enhances readability and accessibility. | RESOLVED |
| 11 | **Institution Logo & Onboarding** | All Roles | Login, ID Card, Onboarding | Client Static Assets | Assets (`branding/`) | Large "AEC" text block in onboarding and distorted logo aspect ratios on various screens. | Replace "AEC" block with official institution logo in `AppProductTour.tsx`; enforce `object-fit: contain` with responsive max dimensions. | Low — Restores official institutional branding. | RESOLVED |
| 12 | **Student Digital ID Card** | Student, Staff | `/student/id-card` | `GET /api/enterprise/students/:id/id-card/pdf` | `Student`, `Department`, `User` | Dominant "Geetorus CampusOS" header over college identity and purple placeholder box when photo missing. | Primary official institution header, render student photo via canonical avatar pipeline, full student details, barcode, and subtle Geetorus footer. | Medium — Provides authentic printable digital ID card. | RESOLVED |
| 13 | **File Downloads vs Cloud Upload** | All Roles | Global Download / Export | `GET /api/files/*`, `GET /api/enterprise/certificates/download/*` | Native FileSystem / Share | Downloads previously triggered unwanted cloud upload errors ("Upload was unsuccessful: request contained no data"). | In `download.ts`, perform authenticated binary fetch -> validate status & MIME -> write to native storage -> launch Android/iOS Share/Open intent. | High — Restores reliable binary file downloads (PDF, XLSX, DOCX, Receipts) without cloud side-effects. | RESOLVED |
| 14 | **Demo Payment Flow & Receipts** | Student, Parent, Accounts | `/student/fees` | `POST /api/enterprise/fees/student/bills/:id/*` | `FeeBill`, `FeePayment`, `FinanceLedgerEntry` | Dependency on live Razorpay credentials during demo presentations caused checkout failures. | Introduce `DEMO_PAYMENT` mode: clean demo payment UI (Demo UPI, Card, Cash), server-side Serializable transaction updating ledger, balances, official receipt generation, and real notifications. | High — Provides deterministic end-to-end payment demonstration without faking frontend balances. | RESOLVED |
| 15 | **Campus Workspace Creation & Submission** | Student, Faculty | `/workspace/*` | `POST /api/campus-workspace/documents` | `CampusOfficeDocument`, `CampusDocumentVersion` | Creating personal files was confusingly initiating HOD approval workflows. | Ensure document creation creates private `DRAFT` in user's workspace; keep `submitForWorkflow` as a distinct intentional action routing to appropriate approvers. | High — Prevents unwanted workflow spam and establishes clear lifecycle separation (Save vs Share vs Submit). | RESOLVED |
| 16 | **Quick Action FAB Collision** | All Roles | All Pages | Client Navigation Registry | `QuickStartPolicy` | FAB (+) was appearing on 404 pages, profile, settings, payment modals, and data entry forms. | Add explicit blocking in `shouldShowQuickStart` for 404, Profile, Settings, ID Card, Certificates, and Payment modals. | Low — Eliminates visual UI collisions and accidental taps. | RESOLVED |
| 17 | **Approval Action Bar Collisions** | HOD, Approvers | `/hod/leave-od/*`, Approvals | Approval Components | Approval Workflow | Action buttons (Approve/Reject/Return) collided with mobile bottom navigation bar and gesture area. | Implement sticky action bar with safe-area bottom offset and scrollable detail container. | Medium — Ensures approval actions are always accessible without layout clipping. | RESOLVED |
| 18 | **Android Release Candidate Build** | Mobile Users | Android Native App | Gradle Release Tasks | Android App Module | Previous candidate encountered installation failure and version collision. | Standardize version `1.0.5` (versionCode `6`), verify signed universal APK and AAB with `apksigner`, ensuring seamless installation and update. | Critical — Provides installable production release candidate. | RESOLVED |

---

## 2. Root Cause In-Depth Analysis

### 2.1 HOD Mentors API (`Cannot GET /api/hod/mentors`)
- **Inspection**: The client component `HodMentorsWorkspace.tsx` was written to invoke `GET /api/hod/mentors`. In `product/server/src/modules/hod/hod.routes.ts`, no corresponding GET endpoint was registered on `/mentors` (only `/students/assign-mentor` and `/faculty` existed).
- **Secondary Flaw**: The catch block in `HodMentorsWorkspace.tsx` rendered `<ErrorState title="Mentor Allocation List Offline" ... />`, misattributing an unrouted API (404) to network offline status.
- **Resolution**: Implemented `GET /api/hod/mentors` in `hod.routes.ts`, `hod.controller.ts`, and `hod.service.ts` to return department faculty mentors with their assigned mentee counts and approval stats. Replaced the "Offline" error title with an informative message.

### 2.2 Faculty Allocation Form Encoding Corruption
- **Inspection**: `HodFacultyAllocationPage.tsx` contained character encoding artifacts (`Select` and `periods/week `) due to improper character decoding during past edits.
- **Resolution**: Replaced corrupted characters with clean unicode strings (`Select...`, `·`), ensured that faculty workload and department teaching groups load correctly, and validated required fields prior to allocation.

### 2.3 Profile Photo Upload Error
- **Inspection**: In `StudentProfile.tsx`, `HODProfile.tsx`, and other forms, image selection converted the file to base64 and attached it as `payload.profilePhoto` in a `PUT /api/users/profile` request. In `users.service.ts`, `updateProfile` had an explicit check throwing `BadRequestException('Use the profile avatar endpoint to upload or remove a profile image')`.
- **Resolution**: Fixed profile edit components to call the dedicated `PUT /api/users/profile/avatar` endpoint, passing `{ name, mimeType, base64 }`. Furthermore, updated `users.service.ts` to gracefully delegate any incoming `profilePhoto` payload to `ProfileMediaService.upload()` if present, ensuring dual compatibility and automatic cache refresh.

### 2.4 Personal Settings vs Super Admin System Settings
- **Inspection**: `Router.tsx` imported `Settings` from `../pages/admin/Settings` and routed `/settings` to `{superAdminOnly(<Settings />)}`. Normal users clicking Settings in their profile menu received a 403 / redirect because they were directed to Super Admin's enterprise configuration catalog rather than personal settings.
- **Resolution**: Mapped `/settings` to the universal personal `Settings.tsx` (Appearance, Theme, Font Presets, Notifications, Accessibility, Tour, Security), and moved Super Admin system configuration to `/admin/settings` protected by `superAdminOnly`.

### 2.5 Demo Payment Flow & Receipts
- **Inspection**: In demo environments without live Razorpay credentials, initiating fee payment failed at checkout script loading or order creation.
- **Resolution**: Added `DEMO_PAYMENT` mode support in `student-fee.service.ts` and `FeeLedgerPage.tsx`. When in demo mode, students can pay via Demo UPI, Card, Netbanking, or Cash, which creates a real `feePayment` record in state `SUCCEEDED`, updates the `financeLedgerEntry` credit ledger, reduces invoice balance, generates a downloadable official receipt PDF, and triggers domain notifications for student and accounts.

### 2.6 File Download & Export Pipeline
- **Inspection**: Document downloads on mobile occasionally triggered an unintended Google Drive upload flow with the error `"Upload was unsuccessful: request contained no data"`.
- **Resolution**: Hardened `download.ts` to handle binary response blobs cleanly, write them to device cache or documents directory, and launch the native system share/open sheet via `@capacitor/share` or `@capacitor/filesystem`, separating cloud uploads into distinct user actions.

---

## 3. Verification & Compliance Sign-Off
All 18 audit items have been resolved and verified against the existing architecture and database models.
