import React, { useState, useEffect } from 'react';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SearchBar } from './SearchBar';
import { NotificationBell } from './NotificationBell';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSelector } from '../theme/ThemeSelector';
import { PrincipalStatusControl } from '../modules/principal-availability/components/PrincipalStatusControl';
import { Menu, Command, Clock, Sparkles } from 'lucide-react';
import { PrincipalDelegationBanner } from '../modules/principal-availability/components/PrincipalDelegationBanner';
import { VpActingPrincipalBanner } from '../modules/principal-availability/components/VpActingPrincipalBanner';
import { OfflineBanner } from '../components/shared/OfflineBanner';
import { BreadcrumbNav } from '../components/shared/BreadcrumbNav';
import { useAuth } from '../context/AuthContext';
import { useCommandPalette } from '../hooks/useCommandPalette';

export interface TopHeaderProps {
  onToggleMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  const { open: openCommand } = useCommandPalette();
  const [time, setTime] = useState(new Date());

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
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border transition-all">
      <OfflineBanner />
      <PrincipalDelegationBanner />
      <VpActingPrincipalBanner />

      <div className="flex items-center justify-between px-4 sm:px-6 h-16 gap-3">
        {/* Left: Mobile Menu Trigger & Branding & Greeting & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-xl transition-colors"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow-xs">
              C
            </span>
            <span className="font-extrabold text-base tracking-tight text-text-primary hidden sm:inline-block">
              CampusOS
            </span>
          </div>

          <div className="hidden sm:flex items-center">
            <WorkspaceSwitcher />
          </div>

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

          {/* Global Search / Command Palette Trigger Button */}
          <button
            onClick={openCommand}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-soft border border-border/80 text-text-muted hover:text-text-primary hover:border-border transition-all text-xs font-medium"
            title="Global Search & Commands (Ctrl+K)"
          >
            <Command className="w-4 h-4 text-primary shrink-0" />
            <span className="hidden sm:inline-block truncate max-w-[140px]">Search or Command...</span>
            <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-[9px] font-bold bg-surface border border-border rounded-md text-text-muted shadow-2xs">
              Ctrl+K
            </kbd>
          </button>

          <ThemeSelector variant="icon" />
          <NotificationBell />
          <div className="h-5 w-px bg-border hidden sm:block" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

