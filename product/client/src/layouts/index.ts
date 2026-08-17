/*
  CAMPUSOS LAYOUTS — Barrel Export

  Note: this barrel currently has no external consumers (AppShell and its
  children are imported directly by file path). Kept for convenience /
  future use. Dead re-exports (BottomNav, MobileAppLayout, MobileHeader,
  and the navigation/desktop + navigation/mobile duplicate shell) were
  removed during the mobile header/safe-area cleanup — see
  CAMPUSOS_MOBILE_RELEASE_REPORT.md.
*/

export { AppShell } from './AppShell';
export { TopHeader } from './TopHeader';
export { Sidebar } from './Sidebar';

// Mobile Layouts (the only live mobile shell — wired into AppShell.tsx)
export { MobileBottomNav } from './mobile/MobileBottomNav';
export { MobileMorePage } from './mobile/MobileMorePage';
