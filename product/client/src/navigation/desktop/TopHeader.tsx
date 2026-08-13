import React from 'react';
import { clsx } from 'clsx';
import { Search, Bell, Sun, Moon, Menu, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../../design-system/primitives/Avatar/Avatar';
import { IconButton } from '../../design-system/primitives/IconButton/IconButton';

/* ═══════════════════════════════════════════════════════════════════
   TOP HEADER — CampusOS Navigation
   
   Minimal, functional top bar:
   - Mobile menu toggle (mobile only)
   - Page context / breadcrumbs
   - Global search trigger (Ctrl+K / Cmd+K)
   - Notification bell
   - Theme toggle
   - Profile menu
   ═══════════════════════════════════════════════════════════════════ */

export interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  pageTitle?: string;
  breadcrumbs?: React.ReactNode;
  notificationCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  onOpenSearch,
  onOpenNotifications,
  pageTitle,
  breadcrumbs,
  notificationCount = 0,
}) => {
  const { user } = useAuth();
  const { resolved: theme, toggleTheme } = useTheme();

  return (
    <header
      className={clsx(
        'h-14 px-4 lg:px-6 flex items-center gap-3',
        'bg-surface/80 backdrop-blur-md border-b border-border',
        'sticky top-0 z-header'
      )}
    >
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden">
        <IconButton
          label="Open menu"
          variant="ghost"
          size="md"
          onClick={onToggleMobileMenu}
        >
          <Menu />
        </IconButton>
      </div>

      {/* Page Context */}
      <div className="flex-1 min-w-0">
        {breadcrumbs || (
          pageTitle && (
            <h2 className="text-card-title font-semibold text-foreground truncate">
              {pageTitle}
            </h2>
          )
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search Trigger */}
        <button
          onClick={onOpenSearch}
          className={clsx(
            'hidden sm:flex items-center gap-2 h-8 pl-3 pr-2 rounded',
            'bg-muted border border-border text-muted-foreground',
            'hover:border-border-strong hover:text-foreground',
            'transition-colors duration-fast text-caption'
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-px bg-surface border border-border rounded text-[10px] font-mono text-muted-foreground ml-4">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Mobile Search */}
        <div className="sm:hidden">
          <IconButton label="Search" variant="ghost" size="md" onClick={onOpenSearch}>
            <Search />
          </IconButton>
        </div>

        {/* Notifications */}
        <div className="relative">
          <IconButton
            label="Notifications"
            variant="ghost"
            size="md"
            onClick={onOpenNotifications}
          >
            <Bell />
          </IconButton>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-danger text-danger-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <IconButton
          label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          variant="ghost"
          size="md"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </IconButton>

        {/* Profile Avatar */}
        <div className="ml-1">
          <Avatar
            src={user?.profilePhoto}
            name={user ? `${user.firstName} ${user.lastName}` : undefined}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
};

TopHeader.displayName = 'TopHeader';
export default TopHeader;
