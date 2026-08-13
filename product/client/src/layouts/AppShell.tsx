import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileMorePage } from './mobile/MobileMorePage';
import { QuickActionFAB } from '../components/shared/QuickActionFAB';
import { FirstTimeOnboardingModal } from '../components/shared/FirstTimeOnboardingModal';
import { InstitutionalWatermark } from '../components/shared/InstitutionalWatermark';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="relative isolate min-h-screen bg-app-bg text-foreground flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
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
