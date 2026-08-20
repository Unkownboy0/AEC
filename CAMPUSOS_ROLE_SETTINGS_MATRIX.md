# CAMPUSOS ROLE SETTINGS MATRIX

**Target Architecture:** Role-Based Access Control (RBAC) & Persona Boundary  
**System:** GEETORUS CampusOS  
**Scope:** Personal Settings vs Super Admin System Configuration, Profile Menu Items, and Route Protection.

---

## 1. Persona Boundary: Personal Settings vs System Configuration

### 1.1 Personal Settings (`/settings`) — Available to ALL Roles
Every user, regardless of role (Student, Faculty, Mentor, Class Adviser, HOD, Dean, VP, Principal, Finance Officer, Super Admin), has access to their personal preferences:
- **Theme & Appearance:** System Default (Auto), Light Mode, Dark Mode.
- **Font & Display Presets:** Compact (0.92x), Default (1.0x), Comfortable (1.08x), Large (1.16x).
- **Notification Preferences:** Push notifications, Email circular alerts, academic deadline reminders.
- **Biometric App Lock:** Opt-in Fingerprint/Face unlock on native mobile devices.
- **App Product Tour:** Instant replay of introductory feature tours and role-specific walkthroughs.
- **Language & Localization:** English, Tamil, Hindi, French.
- **Privacy Controls:** Directory visibility and placement resume search toggles.
- **Help & Support:** Documentation, FAQs, and system information (`CampusOS • Developed by Geetorus`).

### 1.2 Administrative System Settings (`/admin/settings`) — SUPER ADMIN ONLY
System configuration catalog and governance settings are strictly restricted to Super Admin:
- Institution Name, Official Logo & Branding configuration.
- Academic Policy & Passing Rules.
- Document and File Storage limits.
- Module feature flags and tenant capabilities.
- Direct non-Super Admin API or route access returns `403 Forbidden`.

---

## 2. Profile Menu Navigation by Role

| Role | Profile Menu Option 1 | Profile Menu Option 2 | Profile Menu Option 3 | Profile Menu Option 4 | Profile Menu Option 5 |
|---|---|---|---|---|---|
| **Student** | My Profile (`/student/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Faculty** | My Profile (`/faculty/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Mentor** | My Profile (`/faculty/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Class Adviser** | My Profile (`/faculty/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **HOD** | My Profile (`/hod/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Dean / VP** | My Profile (`/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Principal** | My Profile (`/profile`) | Settings (`/settings`) | Help & About (`/settings?tab=help`) | — | Sign Out |
| **Super Admin** | My Profile (`/profile`) | Settings (`/settings`) | Admin System Settings (`/admin/settings`) | Help & About (`/settings?tab=help`) | Sign Out |

---

## 3. Settings Security & Enforcement Matrix

| Setting Category | Storage / Target | Permitted Roles | Unauthorized Action Response |
|---|---|---|---|
| **Personal Theme & Display** | `localStorage['campusos_theme']`, `localStorage['campusos_font_scale']` | All Authenticated Users | Allowed |
| **Biometric Lock** | Native Keystore / Capacitor Preferences | All Native Users | Allowed |
| **Password Change** | `POST /api/auth/change-password` | All Authenticated Users | Allowed (Requires current pwd) |
| **Profile Photo Upload** | `PUT /api/users/profile/avatar` | All Authenticated Users | Allowed (Updates own avatar) |
| **Institution Settings** | `PUT /api/settings/catalog` | Super Admin Only | `403 Forbidden` |
| **RBAC & Module Gates** | `PUT /api/iam/roles/*` | Super Admin Only | `403 Forbidden` |
