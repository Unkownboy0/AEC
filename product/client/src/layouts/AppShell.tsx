import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileMorePage } from './mobile/MobileMorePage';
import { CommandPaletteModal } from '../components/shared/CommandPaletteModal';
import { QuickActionFAB } from '../components/shared/QuickActionFAB';
import { FirstTimeOnboardingModal } from '../components/shared/FirstTimeOnboardingModal';
import { InstitutionalWatermark } from '../components/shared/InstitutionalWatermark';
import { useCommandPalette } from '../hooks/useCommandPalette';
import { X } from 'lucide-react';

export const AppShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { isOpen: isCommandOpen, close: closeCommand } = useCommandPalette();

  return (
    <div className="relative isolate min-h-screen bg-app-bg text-foreground flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/* Institutional Watermark Layer */}
      <InstitutionalWatermark isSidebarCollapsed={isSidebarCollapsed} />

      {/* Top Navigation Bar */}
      <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen(true)} />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-surface shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <span className="font-extrabold text-sm text-text-primary">
                    CampusOS
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar
                isCollapsed={false}
                onToggleCollapse={() => {}}
                isMobileDrawer={true}
                onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
          {children || <Outlet />}
        </main>
      </div>

      {/* Global Command Palette Overlay (Ctrl+K) */}
      <CommandPaletteModal isOpen={isCommandOpen} onClose={closeCommand} />

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


