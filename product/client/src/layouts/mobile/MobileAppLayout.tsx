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

  const roleUpper = (user?.role || '').toUpperCase();
  const notifPath = roleUpper.includes('PRINCIPAL') ? '/principal/notifications'
    : roleUpper.includes('VP') ? '/vp/notifications'
    : roleUpper.includes('HOD') ? '/hod/notifications'
    : roleUpper.includes('FACULTY') ? '/faculty/notifications'
    : '/student/notifications';

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
