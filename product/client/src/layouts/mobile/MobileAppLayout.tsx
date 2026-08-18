import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileMorePage } from './MobileMorePage';
import { PrincipalDelegationBanner } from '../../modules/principal-availability/components/PrincipalDelegationBanner';
import { VpActingPrincipalBanner } from '../../modules/principal-availability/components/VpActingPrincipalBanner';
import { OfflineBanner } from '../../components/shared/OfflineBanner';
import { InstitutionalWatermark } from '../../components/shared/InstitutionalWatermark';

/*
  CAMPUSOS MOBILE APP LAYOUT
  
  Dedicated mobile viewport shell:
  - Top header with notifications & theme toggle
  - Status banners (Offline, Principal Delegation)
  - Scrollable main content view
  - Role-driven 5-tab bottom navigation
  - Full More page drawer for all secondary routes
*/

export const MobileAppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Resolve notification path from active workspace (preferred) or base role.
  // Covers all 15+ workspace roles so tapping the bell always reaches the right inbox.
  const activeWs = ((user?.activeWorkspace || user?.role || '') as string).toUpperCase();
  const notifPath = (() => {
    if (activeWs.includes('PRINCIPAL')) return '/principal/notifications';
    if (activeWs.includes('VICE_PRINCIPAL') || activeWs === 'VP') return '/vp/notifications';
    if (activeWs.includes('ACADEMIC_DEAN')) return '/academic-dean/notifications';
    if (
      activeWs.includes('ADMISSION_DEAN') ||
      activeWs.includes('A_AND_A_DEAN') ||
      activeWs.includes('ADMINISTRATION_DEAN')
    ) return '/admission-dean/notifications';
    if (activeWs.includes('IQAC')) return '/iqac/notifications';
    if (activeWs.includes('COE') || activeWs.includes('CONTROLLER_OF_EXAM') || activeWs.includes('EXAMINATION_CELL')) return '/notifications';
    if (activeWs.includes('HEAD_OF_DEPARTMENT') || activeWs === 'HOD') return '/hod/notifications';
    if (activeWs.includes('CLASS_ADVIS')) return '/class-adviser/notifications';
    if (activeWs === 'MENTOR') return '/faculty/notifications';
    if (activeWs.includes('FACULTY') || activeWs.includes('FACULTY_MEMBER')) return '/faculty/notifications';
    if (activeWs === 'PARENT') return '/parent/notifications';
    if (activeWs.includes('ACCOUNTANT') || activeWs.includes('ACCOUNTS')) return '/notifications';
    if (activeWs === 'AO' || activeWs.includes('ACCOUNTS_OFFICER')) return '/notifications';
    if (activeWs === 'STUDENT') return '/student/notifications';
    // Operational roles: library, hostel, transport, placement, HR, placement, college admin etc.
    return '/notifications';
  })();

  return (
    <div className="relative isolate lg:hidden min-h-dvh bg-app-bg text-foreground flex flex-col font-sans antialiased">
      {/* Institutional Watermark Layer */}
      <InstitutionalWatermark sidebarOffset={false} />

      {/* Mobile Top Header */}
      <MobileHeader onOpenNotifications={() => navigate(notifPath)} />

      {/* Global Status Banners */}
      <OfflineBanner />
      <PrincipalDelegationBanner />
      <VpActingPrincipalBanner />

      {/* Main Mobile Page Viewport */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        {children || <Outlet />}
      </main>

      {/* Role Bottom Navigation */}
      <MobileBottomNav
        onOpenMore={() => setIsMoreOpen(true)}
        isMoreActive={isMoreOpen}
      />

      {/* Full More Page Drawer */}
      <MobileMorePage
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </div>
  );
};
