import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoutesForRole, RouteDefinition } from '../routes/registry';
import * as LucideIcons from 'lucide-react';
import { MoreHorizontal, X } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role || 'STUDENT';
  const allRoutes = getRoutesForRole(role);

  // Filter routes flagged for bottom nav (max 4 primary + More button)
  const bottomNavRoutes = allRoutes.filter((r) => r.inBottomNav).slice(0, 4);
  const remainingRoutes = allRoutes.filter((r) => !bottomNavRoutes.some((b) => b.id === r.id));

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Circle;
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 py-1.5 shadow-lg">
        <div className="flex items-center justify-around">
          {bottomNavRoutes.map((route: RouteDefinition) => (
            <NavLink
              key={route.id}
              to={route.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800'
                }`
              }
            >
              {renderIcon(route.icon)}
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[64px]">
                {route.label}
              </span>
            </NavLink>
          ))}

          {remainingRoutes.length > 0 && (
            <button
              onClick={() => setIsMoreOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More Sheet Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMoreOpen(false)}
          />

          <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[80vh] overflow-y-auto z-50 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                More Modules
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {remainingRoutes.map((route: RouteDefinition) => (
                <button
                  key={route.id}
                  onClick={() => {
                    setIsMoreOpen(false);
                    navigate(route.path);
                  }}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-left border border-slate-100 dark:border-slate-800 hover:border-indigo-300 transition-all"
                >
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {renderIcon(route.icon)}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {route.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
