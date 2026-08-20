import React from 'react';
import { RoleHeader } from '../components/shared/RoleHeader';
import { OfflineBanner } from '../components/shared/OfflineBanner';
import { PrincipalDelegationBanner } from '../modules/principal-availability/components/PrincipalDelegationBanner';
import { VpActingPrincipalBanner } from '../modules/principal-availability/components/VpActingPrincipalBanner';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { BreadcrumbNav } from '../components/shared/BreadcrumbNav';
import { SearchBar } from './SearchBar';
import { PrincipalStatusControl } from '../modules/principal-availability/components/PrincipalStatusControl';
import { CampusAppLauncher } from '../components/workspace/CampusAppLauncher';
import { ThemeSelector } from '../theme/ThemeSelector';
import { NotificationBell } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';

/*
  CAMPUSOS TOP HEADER
  
  - MOBILE (Android / iOS / Mobile Viewports):
    Displays the role-aware mobile greeting header (Good Morning, [Name] / [Role Subtitle] / Search / Bell / Profile Avatar).
    
  - DESKTOP (Web / Desktop Viewports):
    Displays the clean, professional desktop top navigation bar (Workspace Switcher / BreadcrumbNav / Search / Launcher / Theme / Bell / Profile).
    DOES NOT render the large mobile greeting block on desktop.
*/

export const TopHeader: React.FC = () => {
  return (
    <header className="campus-app-header pt-safe sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border transition-all">
      <OfflineBanner />
      <PrincipalDelegationBanner />
      <VpActingPrincipalBanner />

      {/* ─── MOBILE APP ONLY: Large Role-Aware Greeting Header ───── */}
      <div className="lg:hidden">
        <RoleHeader />
      </div>

      {/* ─── DESKTOP WEB: Clean Professional Top Navigation Bar ──── */}
      <div className="hidden lg:flex items-center justify-between gap-4 px-6 py-2.5">
        {/* Left: Workspace Selector + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <WorkspaceSwitcher />
          <div className="h-4 w-px bg-border shrink-0" />
          <BreadcrumbNav />
        </div>

        {/* Right: Search, Executive Status, Launcher, Theme, Notifications, Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <SearchBar />
          <PrincipalStatusControl />
          <CampusAppLauncher />
          <ThemeSelector variant="icon" />
          <NotificationBell />
          <div className="h-5 w-px bg-border shrink-0" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
