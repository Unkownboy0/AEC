import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMorePageSectionsForRole } from '../../navigation/navigation.utils';
import { ModuleIcon } from '../../design-system/icons/ModuleIcon';
import { AppIcon } from '../../design-system/icons/AppIcon';
import { clsx } from 'clsx';

/*
  CAMPUSOS MOBILE MORE PAGE / DRAWER
  
  Full categorized list of modules for the logged-in user's role.
  Features:
  - Clear section headers (ACADEMICS, REQUESTS, COMMUNICATION, etc.)
  - Large touch targets (44px min)
  - Module icon with category-consistent pastel background
  - Full, non-truncated labels + short descriptions
  - Chevron indicator for navigation clarity
  - Zero 404 errors (all paths match route registry)
*/

interface MobileMorePageProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMorePage: React.FC<MobileMorePageProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isOpen || !user) return null;

  const activeRole = user.activeWorkspace || user.role || 'STUDENT';
  const sections = getMorePageSectionsForRole(activeRole);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Card */}
      <div
        className={clsx(
          'fixed bottom-0 inset-x-0 z-50',
          'bg-surface dark:bg-surface rounded-t-3xl border-t border-border',
          'max-h-[85vh] flex flex-col',
          'shadow-modal animate-in slide-in-from-bottom duration-250'
        )}
      >
        {/* Drag Handle & Header */}
        <div className="sticky top-0 bg-surface z-10 px-5 pt-3 pb-4 border-b border-border/80 rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-border-strong mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                All Modules & Services
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Quick access to all features for {user.firstName || (user as any).name || activeRole}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-text-muted hover:text-text-primary rounded-xl bg-surface-soft hover:bg-secondary transition-colors"
            >
              <AppIcon name="X" size="sm" />
            </button>
          </div>
        </div>

        {/* Categorized List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-safe">
          {sections.map((section) => (
            <div key={section.group} className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted px-2">
                {section.label}
              </h3>

              <div className="bg-surface-soft rounded-2xl border border-border/60 divide-y divide-border/40 overflow-hidden">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.path)}
                    type="button"
                    className={clsx(
                      'w-full flex items-center justify-between p-3.5 text-left',
                      'hover:bg-surface active:bg-secondary/80 transition-colors',
                      'touch-target'
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <ModuleIcon module={item.id.split('-')[1] || item.icon} containerSize="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-text-primary truncate">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-text-muted truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badgeKey && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary-soft text-primary">
                          New
                        </span>
                      )}
                      <AppIcon name="ChevronRight" size="xs" className="text-text-muted" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
