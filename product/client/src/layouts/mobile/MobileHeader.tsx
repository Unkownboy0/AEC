import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../notifications/NotificationProvider';
import { AppIcon } from '../../design-system/icons/AppIcon';

interface MobileHeaderProps {
  onOpenNotifications?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenNotifications }) => {
  const { user } = useAuth();
  const { resolved: theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const roleLabel = (user.role || 'STUDENT').replace(/_/g, ' ');

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Brand mark & Role */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
            C
          </div>
          <div>
            <div className="text-sm font-extrabold text-text-primary tracking-tight leading-none">
              CampusOS
            </div>
            <div className="text-[10px] font-semibold text-primary uppercase tracking-wider mt-0.5">
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Right: Actions (Theme + Notifications) */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-soft transition-colors flex items-center justify-center"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <AppIcon name={theme === 'dark' ? 'Sun' : 'Moon'} size="sm" />
          </button>

          {/* Notification bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-soft transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <AppIcon name="Bell" size="sm" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-surface">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
