import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSidebarGroupsForRole } from '../navigation/navigation.utils';
import { AppIcon } from '../design-system/icons/AppIcon';
import * as LucideIcons from 'lucide-react';
import { LogOut, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

import { useNotifications } from '../notifications/NotificationProvider';
import { useLanguage } from '../context/LanguageContext';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileDrawer,
  onCloseMobileDrawer,
}) => {
  const { user, logout } = useAuth();
  const { getBadgeCount } = useNotifications();
  const { t } = useLanguage();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  if (!user) return null;

  const toRoleName = (value: unknown) => typeof value === 'object'
    ? String((value as any)?.roleCode || (value as any)?.name || '')
    : String(value || '');
  const workspaceGroups = getSidebarGroupsForRole(toRoleName(user.activeWorkspace));
  const roleGroups = workspaceGroups.length
    ? workspaceGroups
    : getSidebarGroupsForRole(toRoleName(user.role));
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  return (
    <aside
      className={`h-full bg-surface dark:bg-surface border-r border-border flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header Branding (Desktop) */}
      {!isMobileDrawer && (
        <div className="px-5 h-16 border-b border-border flex items-center justify-between shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-border flex items-center justify-center overflow-hidden p-0.5 shadow-xs">
                <img src="/branding/official-logo.png" alt="AEC" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-sm text-text-primary tracking-tight block">
                  CampusOS
                </span>
                <span className="text-[10px] text-text-muted font-bold tracking-wider uppercase block">
                  Enterprise ERP
                </span>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-soft rounded-xl transition-colors mx-auto"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <LucideIcons.ChevronRight className="w-4 h-4" />
            ) : (
              <LucideIcons.ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {/* Navigation items by Group */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {roleGroups.map((grp) => {
          const isGroupCollapsed = collapsedGroups[grp.group];
          return (
            <div key={grp.group} className="space-y-1">
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(grp.group)}
                  className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors text-left"
                >
                  <span>{grp.label}</span>
                  {isGroupCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              )}

              {!isGroupCollapsed &&
                grp.items.map((item) => {
                  const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={onCloseMobileDrawer}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                          isActive
                            ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20 dark:bg-primary/20'
                            : 'text-text-secondary hover:bg-surface-soft hover:text-text-primary border border-transparent'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`
                      }
                      title={item.label}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                          )}
                          <AppIcon
                            name={item.icon}
                            size="md"
                            className={isActive ? 'text-primary font-bold' : 'text-text-secondary'}
                          />
                          {!isCollapsed && (
                            <span className="truncate flex-1">{t(item.label)}</span>
                          )}
                          {!isCollapsed && badgeCount > 0 && (
                            <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-150">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                          {isCollapsed && badgeCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-border bg-surface-soft shrink-0">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-danger hover:bg-danger-light/40 rounded-xl transition-colors"
          title={t('Sign Out')}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('Sign Out')}</span>}
        </button>
      </div>
    </aside>
  );
};
