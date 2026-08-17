import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileMorePage } from './mobile/MobileMorePage';
import { QuickActionFAB } from '../components/shared/QuickActionFAB';
import { FirstTimeOnboardingModal } from '../components/shared/FirstTimeOnboardingModal';
import { InstitutionalWatermark } from '../components/shared/InstitutionalWatermark';
import { useKeyboardState } from '../context/KeyboardContext';
import { clsx } from 'clsx';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { isKeyboardOpen } = useKeyboardState();

  return (
    <div className="relative isolate h-dvh overflow-hidden bg-app-bg text-foreground flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/*
        h-dvh + overflow-hidden (not min-h-screen) is intentional: it guarantees this
        shell never grows taller than the viewport and never lets the page/body scroll.
        <main> below is the single scroll container. Without this, a sticky TopHeader
        could ride up under the status bar once the body itself scrolled past it — the
        "feels like a website, not an app" + header-jumps-while-scrolling defect.
      */}
      {/* Institutional Watermark Layer */}
      <InstitutionalWatermark isSidebarCollapsed={isSidebarCollapsed} />

      {/* Top Navigation Bar */}
      <TopHeader />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Main Content Area */}
        <main
          className={clsx(
            'flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-[padding] duration-150',
            isKeyboardOpen ? 'pb-safe pb-4 lg:pb-12' : 'pb-24 lg:pb-12'
          )}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Floating Quick Action Button */}
      <QuickActionFAB />

      {/* Role-Aware Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenMore={() => setIsMoreOpen(true)}
        isMoreActive={isMoreOpen}
      />

      {/* Categorized Mobile More Drawer */}
      <MobileMorePage
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />

      {/* First-Time User Onboarding Guide */}
      <FirstTimeOnboardingModal />
    </div>
  );
};
