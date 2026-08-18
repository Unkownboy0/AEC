import React, { useState, useCallback, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { DesktopSidebar } from '../../navigation/desktop/DesktopSidebar';
import { TopHeader } from '../../navigation/desktop/TopHeader';
import { MobileBottomNav } from '../../layouts/mobile/MobileBottomNav';
import { MobileMorePage } from '../../layouts/mobile/MobileMorePage';
import { useAuth } from '../../context/AuthContext';
import { useDevice } from '../../context/DeviceContext';
import { getMenuGroupsForRole } from '../../navigation/route-config/menuConfig';
import { InstitutionalWatermark } from '../../components/shared/InstitutionalWatermark';

/* ═══════════════════════════════════════════════════════════════════
   DESKTOP APP LAYOUT — CampusOS
   
   Premium app shell:
   - Desktop: Sidebar + Top Header + Content
   - Tablet: Collapsible sidebar + Content
   - Mobile: No sidebar, Bottom Nav, Full-screen pages
   ═══════════════════════════════════════════════════════════════════ */

export interface DesktopAppLayoutProps {
  children?: React.ReactNode;
}

export const DesktopAppLayout: React.FC<DesktopAppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { isMobile } = useDevice();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuGroups = useMemo(
    () => getMenuGroupsForRole(user?.role),
    [user?.role]
  );

  const roleName = useMemo(() => {
    if (!user?.role) return undefined;
    return user.role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  }, [user?.role]);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="relative isolate min-h-[100dvh] bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Institutional Watermark Layer */}
      <InstitutionalWatermark isSidebarCollapsed={isSidebarCollapsed} />
      {/* ─── Main Workspace ────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DesktopSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            menuGroups={menuGroups}
            workspaceName="CampusOS"
            roleName={roleName}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-drawer lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
              onClick={handleCloseMobileMenu}
              aria-hidden="true"
            />
            {/* Drawer */}
            <div className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-surface shadow-drawer animate-slide-in-right z-10 flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    C
                  </div>
                  <span className="font-bold text-card-title text-foreground">CampusOS</span>
                </div>
                <button
                  onClick={handleCloseMobileMenu}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DesktopSidebar
                isCollapsed={false}
                onToggleCollapse={() => {}}
                menuGroups={menuGroups}
                workspaceName="CampusOS"
                roleName={roleName}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Header */}
          <TopHeader
            onToggleMobileMenu={handleToggleMobileMenu}
          />

          {/* Main Content */}
          <main
            className={clsx(
              'flex-1 overflow-y-auto',
              'px-4 sm:px-6 lg:px-8',
              'py-6 lg:py-8',
              // Bottom padding for mobile nav
              'pb-24 lg:pb-8',
              'max-w-page mx-auto w-full'
            )}
          >
            {children || <Outlet />}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation — uses correct layout/mobile version */}
      <MobileBottomNav
        onOpenMore={() => {}}
        isMoreActive={false}
      />
    </div>
  );
};

DesktopAppLayout.displayName = 'DesktopAppLayout';
export default DesktopAppLayout;
