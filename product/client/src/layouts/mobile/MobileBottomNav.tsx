import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKeyboardState } from '../../context/KeyboardContext';
import { getMobileTabsForRole } from '../../navigation/navigation.utils';
import { AppIcon } from '../../design-system/icons/AppIcon';
import { clsx } from 'clsx';

/*
  CAMPUSOS MOBILE BOTTOM NAV
  
  Displays the 5 primary tabs for the user's role:
  - 4 module tabs + 1 "More" tab
  - Full touch targets (44px min height per WCAG)
  - Clear active indicator with primary theme color
  - Icon + non-truncated label
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
  const { isKeyboardOpen } = useKeyboardState();

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
        'bg-surface border-t border-border shadow-2xl',
        'px-2 pt-1.5 pb-safe',
        'transition-all duration-150 ease-out transform',
        isKeyboardOpen
          ? 'translate-y-full opacity-0 pointer-events-none invisible'
          : 'translate-y-0 opacity-100 visible'
      )}
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            onClick={triggerHaptic}
            tabIndex={isKeyboardOpen ? -1 : 0}
            className={({ isActive }) =>
              clsx(
                'relative flex flex-1 flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 touch-target',
                isActive
                  ? 'text-primary font-bold scale-105'
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
                  {tab.badgeKey && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" />
                  )}
                </div>
                <span className="text-[11px] leading-tight tracking-tight mt-1 truncate max-w-[72px] text-center">
                  {tab.shortLabel || tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

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
              'relative flex flex-1 flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-150 touch-target',
              isMoreActive
                ? 'text-primary font-bold scale-105'
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
            <span className="text-[11px] leading-tight tracking-tight mt-1 truncate max-w-[68px] text-center">
              More
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
