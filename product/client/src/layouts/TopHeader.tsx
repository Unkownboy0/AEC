import React, { useState, useEffect } from 'react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSelector } from '../theme/ThemeSelector';
import { PrincipalStatusControl } from '../modules/principal-availability/components/PrincipalStatusControl';
import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import { PrincipalDelegationBanner } from '../modules/principal-availability/components/PrincipalDelegationBanner';
import { VpActingPrincipalBanner } from '../modules/principal-availability/components/VpActingPrincipalBanner';
import { OfflineBanner } from '../components/shared/OfflineBanner';
import { BreadcrumbNav } from '../components/shared/BreadcrumbNav';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getEntryForLocation } from '../navigation/navigation.utils';

export const TopHeader: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const currentRoute = getEntryForLocation(location.pathname);
  const isWorkspaceHome = currentRoute?.group === 'overview' && currentRoute?.path === location.pathname;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hrs = time.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="pt-safe sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border transition-all">
      <OfflineBanner />
      <PrincipalDelegationBanner />
      <VpActingPrincipalBanner />

      <div className="flex items-center justify-between px-4 sm:px-6 h-16 gap-3">
        {/* Left: Mobile Menu Trigger & Branding & Greeting & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!isWorkspaceHome && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow-xs">
              C
            </span>
            <span className="font-extrabold text-base tracking-tight text-text-primary hidden sm:inline-block">
              CampusOS
            </span>
          </div>

          <h1 className="sm:hidden text-sm font-bold text-text-primary truncate min-w-0">
            {currentRoute?.label || 'CampusOS'}
          </h1>

          {/* Visible on all breakpoints — WorkspaceSwitcher renders a compact icon-only
              trigger + bottom sheet on mobile so multi-workspace users (Faculty/Mentor/
              Class Adviser, HOD/Faculty, etc.) can switch workspace from a phone. */}
          <WorkspaceSwitcher />

          {/* Breadcrumbs Navigation */}
          <div className="hidden lg:block pl-2 border-l border-border/60">
            <BreadcrumbNav />
          </div>

          {/* Greeting & Time (Desktop wide) */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-border/80">
            <div className="flex flex-col text-xs leading-tight">
              <span className="font-bold text-text-primary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {getGreeting()}, {user?.firstName || 'User'}
              </span>
              <span className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-text-muted" />
                {formattedTime} IST
              </span>
            </div>
          </div>
        </div>

        {/* Right: Search / Command Palette, Status Badge, Theme, Notifications, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <PrincipalStatusControl />

          <SearchBar />

          <ThemeSelector variant="icon" />
          <NotificationBell />
          <div className="h-5 w-px bg-border hidden sm:block" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};
