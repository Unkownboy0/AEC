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
      {/* Institutional Watermark Layer */}
      <InstitutionalWatermark isSidebarCollapsed={isSidebarCollapsed} />

      {/* Top Navigation Bar with RoleHeader */}
      <TopHeader />

      {/* Main Workspace Body */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
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
            'campus-page flex-1 overflow-y-auto max-w-7xl mx-auto w-full transition-[padding] duration-150 flex flex-col justify-between',
            isKeyboardOpen && 'campus-page-keyboard-open'
          )}
        >
          <div className="flex-1">
            {children || <Outlet />}
          </div>

          {/* Muted Page Footer */}
          <footer className="mt-auto py-4 text-center text-[10px] text-text-muted/60 select-none">
            CampusOS • Developed by Geetorus
          </footer>
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

export default AppShell;
