import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isNativePlatform } from '../platform/platform';
import { MobileBottomNav } from './mobile/MobileBottomNav';
import { MobileMorePage } from './mobile/MobileMorePage';
import { AppIcon } from '../design-system/icons/AppIcon';
import { getNavEntryByPath } from '../navigation/role-navigation';
import { useAuth } from '../context/AuthContext';
import { registerBackButtonHandler } from '../platform/back-button';

export const CapacitorMobileShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentEntry = getNavEntryByPath(location.pathname);
  const isDashboard = location.pathname.includes('/dashboard');

  // Register the "close More drawer" handler at high priority in the centralized back button
  // priority queue. This runs BEFORE the global navigation handler in AppBootstrap, ensuring
  // the drawer closes on back press instead of navigating. We do NOT register a second
  // App.addListener('backButton') here — that would create a triple-listener race condition.
  useEffect(() => {
    if (!isNativePlatform()) return;

    const unregister = registerBackButtonHandler(() => {
      if (isMoreOpen) {
        setIsMoreOpen(false);
        return true; // handled — stop propagation
      }
      return false; // not handled — let global handler navigate/minimize
    });

    return unregister;
  }, [isMoreOpen]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col pt-safe pb-safe">
      {/* Rule 19: Mobile Header Standard */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        {!isDashboard ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <AppIcon name="ChevronLeft" size={20} />
            </button>
            <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {currentEntry?.label || 'CampusOS'}
            </h1>
          </div>
        ) : (
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Hi, {user?.firstName || 'User'} 👋</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">CampusOS Overview</div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/${user?.role?.toLowerCase() || 'student'}/notifications`)}
            type="button"
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <AppIcon name="Bell" size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {children || <Outlet />}
      </main>

      {/* Rule 20: Mobile Bottom Navigation */}
      <MobileBottomNav
        onOpenMore={() => setIsMoreOpen(true)}
        isMoreActive={isMoreOpen}
      />

      {/* Rule 21: Mobile More Page Drawer */}
      <MobileMorePage
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </div>
  );
};
