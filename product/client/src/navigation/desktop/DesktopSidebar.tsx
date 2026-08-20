import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { resolveAssetUrl } from '../../utils/assets';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  HelpCircle,
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  ChartNoAxesColumnIncreasing,
  NotebookTabs,
  Megaphone,
  ListChecks,
  MessageSquare,
  Bell,
  CalendarOff,
  IndianRupee,
  CreditCard,
  Bus,
  Building,
  LibraryBig,
  BriefcaseBusiness,
  Building2,
  ChartSpline,
  BarChart3,
  MessageCircleWarning,
  Award,
  Calendar,
  FolderArchive,
  Settings,
  ShieldCheck,
  User,
  ShieldAlert,
  Crown,
  UserPlus,
  FileCheck,
  UserCheck,
  HeartHandshake,
  Receipt,
  PhoneCall,
  Home,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../design-system/primitives/Avatar/Avatar';
import { roleIcons } from '../../design-system/icons/roleIcons';

/* ═══════════════════════════════════════════════════════════════════
   DESKTOP SIDEBAR — CampusOS Enterprise ERP
   
   Inspired by Microsoft 365, Linear, Atlassian, Notion & Vercel:
   - Dark background (#0f172a / bg-slate-950)
   - Crisp white icons & text
   - Rich purple active state (bg-purple-600)
   - Collapsible with quick toggle
   - Categorized enterprise navigation headers:
     * Overview
     * Academics
     * Communication
     * Monitoring
     * Analytics
     * Settings
     * Account
   ═══════════════════════════════════════════════════════════════════ */

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  ChartNoAxesColumnIncreasing,
  NotebookTabs,
  Megaphone,
  ListChecks,
  MessageSquare,
  Bell,
  CalendarOff,
  IndianRupee,
  CreditCard,
  Bus,
  Building,
  LibraryBig,
  BriefcaseBusiness,
  Building2,
  ChartSpline,
  BarChart3,
  MessageCircleWarning,
  Award,
  Calendar,
  FolderArchive,
  Settings,
  ShieldCheck,
  HelpCircle,
  User,
  ShieldAlert,
  Crown,
  UserPlus,
  FileCheck,
  UserCheck,
  HeartHandshake,
  Receipt,
  PhoneCall,
  Home,
  Sparkles,
};

function getIcon(iconName: string): React.FC<{ className?: string }> {
  return ICON_MAP[iconName] || LayoutDashboard;
}

export interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: string;
  badge?: number;
  group?: string;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  menuGroups: MenuGroup[];
  workspaceName?: string;
  roleName?: string;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  menuGroups,
  workspaceName = 'CampusOS',
  roleName,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Get Role Icon
  const roleKey = (user?.role || 'student') as keyof typeof roleIcons;
  const RoleIconComp = roleIcons[roleKey] || User;

  return (
    <aside
      className={clsx(
        'h-[100dvh] flex flex-col bg-slate-950 text-slate-100 border-r border-slate-800/80',
        'transition-[width] duration-200 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        'sticky top-0 shrink-0 z-30 select-none overflow-hidden'
      )}
    >
      {/* ─── Header ──────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-3 px-1">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-md border border-white/10 overflow-hidden p-0.5">
            <img src="/branding/official-logo.png" alt="AEC" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white tracking-wide truncate">
                  {workspaceName}
                </p>
                <span className="text-[10px] font-medium bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50 uppercase tracking-wider">
                  ERP
                </span>
              </div>
              {roleName && (
                <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 truncate">
                  <RoleIconComp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">{roleName}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Categorized Navigation Menu ─────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.label || groupIdx} className="space-y-1">
            {!isCollapsed && group.label && (
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {isCollapsed && groupIdx > 0 && (
              <div className="mx-2 my-2 h-px bg-slate-800/80" />
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = getIcon(item.icon);
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path + '/'));

                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className={clsx(
                        'flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-all duration-150',
                        'focus-visible:outline-2 focus-visible:outline-purple-500',
                        isCollapsed ? 'h-10 justify-center' : 'h-9',
                        isActive
                          ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950/50'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/90'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate tracking-tight">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-950" />
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ─── Footer Controls ─────────────────────────────── */}
      <div className="border-t border-slate-800/80 px-2 py-2.5 space-y-1 bg-slate-950/80">
        {/* Help Desk */}
        <NavLink
          to="/help"
          className={clsx(
            'flex items-center gap-3 px-3 h-9 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <HelpCircle className="w-4 h-4 shrink-0 text-slate-400" />
          {!isCollapsed && <span>Help Desk</span>}
        </NavLink>

        {/* Profile Card & Logout */}
        <div
          className={clsx(
            'flex items-center gap-2.5 px-2 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50',
            isCollapsed ? 'justify-center' : 'pr-1'
          )}
        >
          <Avatar
            src={resolveAssetUrl(user?.profilePhoto)}
            name={user ? `${user.firstName} ${user.lastName}` : 'User'}
            size="sm"
            className="ring-1 ring-purple-500/40 shrink-0"
          />
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Collapse Toggle Floating Trigger ────────────── */}
      <button
        onClick={onToggleCollapse}
        className={clsx(
          'absolute top-5 -right-3 w-6 h-6 rounded-full',
          'bg-slate-900 border border-slate-700 shadow-md',
          'flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800',
          'transition-all duration-150 z-40 hidden lg:flex'
        )}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
};

DesktopSidebar.displayName = 'DesktopSidebar';
export default DesktopSidebar;
