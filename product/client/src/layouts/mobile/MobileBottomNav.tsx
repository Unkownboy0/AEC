import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardState } from '../../context/KeyboardContext';
import { getMobileTabsForRole } from '../../navigation/navigation.utils';
import { AppIcon } from '../../design-system/icons/AppIcon';
import { clsx } from 'clsx';
import { useNotifications } from '../../notifications/NotificationProvider';
import { useLanguage } from '../../context/LanguageContext';

/*
  CAMPUSOS MOBILE BOTTOM NAV
  
  Displays the 5 primary tabs for the user's role:
  - 4 module tabs + 1 "More" tab
  - Full touch targets (44px min height per WCAG)
  - Clear active indicator with primary theme color
  - Icon + non-truncated label
  - Real state-driven red badges (hidden when count is 0)
  - Safe-area aware for iOS / Android bottom gesture bar
  - Auto-hides immediately whenever software keyboard opens to prevent layout collision
*/

interface MobileBottomNavProps {
  onOpenMore?: () => void;
  isMoreActive?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenMore,
  isMoreActive = false,
}) => {
  const { user } = useAuth();
  const { getBadgeCount } = useNotifications();
  const { isKeyboardOpen } = useKeyboardState();
  const { t } = useLanguage();

  if (!user) return null;

  const activeRole = user.activeWorkspace || user.role || 'STUDENT';
  const tabs = getMobileTabsForRole(activeRole);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <nav
      aria-hidden={isKeyboardOpen}
      className={clsx(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'mobile-bottom-nav bg-surface border-t border-border',
        'px-1.5 min-[360px]:px-2 pt-1.5 pb-safe',
        'transition-all duration-150 ease-out transform',
        isKeyboardOpen
          ? 'translate-y-full opacity-0 pointer-events-none invisible'
          : 'translate-y-0 opacity-100 visible'
      )}
    >
      <div className="flex min-h-14 items-stretch justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const badgeCount = tab.badgeKey ? getBadgeCount(tab.badgeKey) : 0;
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              onClick={triggerHaptic}
              tabIndex={isKeyboardOpen ? -1 : 0}
              className={({ isActive }) =>
                clsx(
                  'relative min-w-0 flex flex-1 flex-col items-center justify-center py-1 px-0.5 min-[360px]:px-1 rounded-xl transition-colors duration-150 touch-target',
                  isActive
                    ? 'text-primary font-semibold bg-primary/8'
                    : 'text-text-secondary hover:text-text-primary font-medium'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute -top-1.5 w-6 h-1 bg-primary rounded-full shadow-xs" />
                  )}
                  <div className="relative">
                    <AppIcon
                      name={tab.icon}
                      size="nav"
                      strokeWidth={isActive ? 2.2 : 1.75}
                      className={clsx(
                        'transition-transform duration-150',
                        isActive ? 'text-primary' : 'text-text-secondary'
                      )}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-surface shadow-xs animate-in zoom-in-75 duration-150">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className="w-full px-0.5 text-[10px] min-[360px]:text-[11px] leading-tight tracking-tight mt-1 truncate text-center">
                    {t(tab.shortLabel || tab.label)}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Tab Trigger */}
        {onOpenMore && (
          <button
            onClick={() => {
              triggerHaptic();
              onOpenMore();
            }}
            tabIndex={isKeyboardOpen ? -1 : 0}
            type="button"
            className={clsx(
              'relative min-w-0 flex flex-1 flex-col items-center justify-center py-1 px-0.5 min-[360px]:px-1 rounded-xl transition-colors duration-150 touch-target',
              isMoreActive
                ? 'text-primary font-semibold bg-primary/8'
                : 'text-text-secondary hover:text-text-primary font-medium'
            )}
          >
            {isMoreActive && (
              <span className="absolute -top-1.5 w-6 h-1 bg-primary rounded-full shadow-xs" />
            )}
            <AppIcon
              name="Grid3x3"
              size="nav"
              strokeWidth={isMoreActive ? 2.2 : 1.75}
              className={clsx(
                'transition-transform duration-150',
                isMoreActive ? 'text-primary' : 'text-text-secondary'
              )}
            />
            <span className="w-full px-0.5 text-[10px] min-[360px]:text-[11px] leading-tight tracking-tight mt-1 truncate text-center">
              {t('More')}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
