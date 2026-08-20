# GEETORUS CAMPUSOS — THEME AND TOUR SPECIFICATION REPORT
**Module Focus**: Centralized System Theme & Role-Aware Onboarding Product Tour  
**Date**: August 19, 2026  
**Status**: BUILD VERIFIED  

---

## 1. System-Aware Theme Architecture

CampusOS implements a single centralized theme engine in `ThemeContext.tsx` following the OS system appearance by default.

### 1.1 Resolution Logic
```
userPreference = SYSTEM | LIGHT | DARK (Default: SYSTEM)

resolvedTheme =
  if userPreference === 'SYSTEM':
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  else:
    userPreference
```

### 1.2 Native Device Synchronization
- **Android Status Bar**: Dynamically styled via `@capacitor/status-bar` and `@capacitor/core` `SystemBars`.
  - **Light Mode**: White surface background (`#FFFFFF`), dark icons.
  - **Dark Mode**: Dark navy surface (`#020617`), light icons.
- **Theme Transition**: Tokenized transition (`150ms–250ms`) across background, surfaces, borders, text, and icons without full-screen blur performance penalties.
- **Persistence**: Stored in `localStorage` under `campusos_theme`. Read by an inline bootstrap script in `index.html` to eliminate theme flash on cold start.

---

## 2. Institutional Watermark Architecture

### 2.1 Shared App Watermark
- **Component**: `InstitutionalWatermark.tsx`
- **Asset**: Canonical institution logo (`AEC / Geetorus`). No duplicate logos created.
- **Light Theme**: 3% to 5% opacity.
- **Dark Theme**: 2% to 4% opacity.
- **Placement**: Fixed background layer (`z-0`), `pointer-events: none`, responsive sizing (`w-[54vw]` mobile to `w-[34vw]` desktop).

### 2.2 Print & Export Watermark
- Dedicated CSS classes `.print-watermark-*` in `index.css` apply official high-contrast emblems during `@media print` and PDF export pipelines (bonafide certificates, fee receipts, conduct certificates, hall tickets).

---

## 3. Role-Aware Product Tour Specification

### 3.1 Architecture & Persistence
- **Component**: `RoleAwareProductTour.tsx`
- **Key Strategy**: `campusos_tour_v2_{userId}_{role}`
- **Trigger**: Shown once upon post-login bootstrap if not previously completed or skipped.
- **Restartability**: Available anytime from **Settings > Help & Support > Product Tour**.

### 3.2 Role-Specific Tour Step Breakdown

| Role | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 |
|---|---|---|---|---|---|
| **STUDENT** | Your Dashboard | Today's Classes | Assignments & Tasks | Leave & OD Requests | Smart Notifications |
| **FACULTY** | Faculty Dashboard | Today's Classes & Roll Call | Attendance Entry | Tasks & Assignments | Notifications |
| **MENTOR** | Your Mentees | At-Risk Students Monitor | Approvals Desk | Mentoring Meetings Log | — |
| **HOD** | Department Overview | Approvals Desk | Timetable Management | Faculty Workload Roster | Notifications |
| **DEAN** | Dean Overview | Approval Center | Department Reports | Circulars | — |
| **VP** | Operations Center | Escalated Approvals | Acting Principal Authority | Institution Reports | — |
| **PRINCIPAL** | Principal Command | Final Approvals Desk | Delegation Management | Strategic Reports | — |
| **SUPER ADMIN** | People Management | Roles & Workspaces | Feature Modules | Audit Logs | System Settings |

---

## 4. Verification Status
- **Theme Switching**: TEST VERIFIED (Light, Dark, System preference switching verified across Web and Mobile).
- **Tour Versioning**: TEST VERIFIED (Persistent across page reloads; restarts correctly on user request).
