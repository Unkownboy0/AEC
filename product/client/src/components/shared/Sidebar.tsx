import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as LucideIcons from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/axios';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [pendingWfCount, setPendingWfCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '/student/academics': true,
    '/student/career': true
  });

  // Poll workflows to get pending approvals count if role is Faculty, Mentor, or HOD
  useEffect(() => {
    if (user?.role === 'Faculty' || user?.role === 'Mentor' || user?.role === 'HOD') {
      const fetchPendingCount = async () => {
        try {
          const res = await api.get('/workflows/requests');
          if (res.data?.status === 'success') {
            let pending = 0;
            if (user.role === 'Faculty' || user.role === 'Mentor') {
              pending = res.data.data.filter((r: any) => r.currentStep === 'MENTOR' && ['PENDING', 'PENDING_MENTOR'].includes(r.status)).length;
            } else if (user.role === 'HOD') {
              pending = res.data.data.filter((r: any) => r.currentStep === 'HOD' && r.status === 'MENTOR_APPROVED').length;
            }
            setPendingWfCount(pending);
          }
        } catch (err) {
          console.error('[Sidebar workflow count fetch] error:', err);
        }
      };
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

  // Permitted menus from DB
  const menus = user?.menus || [];

  // Helper to determine active state including search parameters
  const checkIsActive = (path: string) => {
    const currentSearch = location.search || '?tab=overview';
    if (path.includes('?')) {
      const targetSearch = path.substring(path.indexOf('?'));
      return location.pathname === '/' && currentSearch === targetSearch;
    }
    return location.pathname === path;
  };

  return (
    <aside
      className={cn(
        'relative z-20 flex flex-col border-r bg-card h-screen text-card-foreground transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LucideIcons.GraduationCap className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="font-extrabold tracking-tight truncate text-sm">
              CAMPUSOS
            </span>
          )}
        </div>
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-md text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <LucideIcons.ChevronRight className="h-3 w-3" /> : <LucideIcons.ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {(() => {
          if (user?.role === 'Student') {
            const rootItems = menus.filter((m: any) => !m.parentPath);
            const renderedList: React.ReactNode[] = [];

            rootItems.forEach((item: any) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Layers;
              const isActive = checkIsActive(item.path);

              renderedList.push(
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold border-l-[3px] border-primary pl-[9px] rounded-r-lg rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                  </div>
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );

              if (item.componentKey === 'student_dashboard') {
                const academicsChildren = menus.filter((m: any) => m.parentPath === '/student/academics');
                const isAcademicsExpanded = expandedGroups['/student/academics'];
                const AcademicsIcon = LucideIcons.GraduationCap;

                renderedList.push(
                  <div key="academics-group" className="space-y-0.5">
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, '/student/academics': !prev['/student/academics'] }))}
                      className="w-full flex items-center gap-3 py-2 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg pl-3"
                    >
                      <AcademicsIcon className="h-4.5 w-4.5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">Academics</span>}
                      {!isCollapsed && (
                        <span className="ml-auto">
                          {isAcademicsExpanded ? <LucideIcons.ChevronDown className="h-3.5 w-3.5" /> : <LucideIcons.ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                      )}
                    </button>

                    {!isCollapsed && isAcademicsExpanded && academicsChildren.map((child: any) => {
                      const ChildIcon = (LucideIcons as any)[child.icon] || LucideIcons.Layers;
                      const isChildActive = checkIsActive(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center gap-3 py-1.5 pl-8 pr-3 text-xs font-semibold transition-all duration-200',
                            isChildActive
                              ? 'text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                );
              }

              if (item.componentKey === 'student_id_card') {
                const careerChildren = menus.filter((m: any) => m.parentPath === '/student/career');
                const isCareerExpanded = expandedGroups['/student/career'];
                const CareerIcon = LucideIcons.Briefcase;

                renderedList.push(
                  <div key="career-group" className="space-y-0.5">
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, '/student/career': !prev['/student/career'] }))}
                      className="w-full flex items-center gap-3 py-2 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-lg pl-3"
                    >
                      <CareerIcon className="h-4.5 w-4.5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">Career</span>}
                      {!isCollapsed && (
                        <span className="ml-auto">
                          {isCareerExpanded ? <LucideIcons.ChevronDown className="h-3.5 w-3.5" /> : <LucideIcons.ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                      )}
                    </button>

                    {!isCollapsed && isCareerExpanded && careerChildren.map((child: any) => {
                      const ChildIcon = (LucideIcons as any)[child.icon] || LucideIcons.Layers;
                      const isChildActive = checkIsActive(child.path);
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            'flex items-center gap-3 py-1.5 pl-8 pr-3 text-xs font-semibold transition-all duration-200',
                            isChildActive
                              ? 'text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <ChildIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                );
              }
            });

            return renderedList;
          }

          return (
            <>
              {(user?.role === 'Principal' || user?.role === 'Vice Principal') && (
                <NavLink
                  to="/approval-center"
                  className={cn(
                    'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out mb-1',
                    location.pathname === '/approval-center'
                      ? 'bg-violet-600/15 text-violet-500 font-bold border-l-[3px] border-violet-500 pl-[9px] rounded-r-lg rounded-l-none'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
                  )}
                >
                  <div className="relative">
                    <LucideIcons.ShieldCheck className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', location.pathname === '/approval-center' ? 'text-violet-500' : 'text-muted-foreground')} />
                  </div>
                  {!isCollapsed && <span className="truncate font-bold">Approval Center</span>}
                </NavLink>
              )}
              {user?.role === 'HOD' && (
                <div className="space-y-0.5 my-1 border-b border-border/50 pb-2">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">HOD Workspace</div>
                  {[
                    { name: 'HOD Dashboard', path: '/hod/dashboard', icon: LucideIcons.LayoutDashboard },
                    { name: 'Leave & OD Approvals', path: '/hod/leave-approvals', icon: LucideIcons.FileCheck, badge: pendingWfCount },
                    { name: 'Department Students', path: '/hod/students', icon: LucideIcons.Users },
                    { name: 'Faculty Workload', path: '/hod/faculty', icon: LucideIcons.UserCheck },
                    { name: 'Attendance Monitor', path: '/hod/attendance', icon: LucideIcons.AlertTriangle },
                    { name: 'Task Desk', path: '/hod/tasks', icon: LucideIcons.Layers },
                    { name: 'Reports & Exports', path: '/hod/reports', icon: LucideIcons.Download },
                  ].map((hodItem) => {
                    const HodIcon = hodItem.icon || LucideIcons.Layers;
                    const isHodActive = checkIsActive(hodItem.path);
                    return (
                      <NavLink
                        key={hodItem.path}
                        to={hodItem.path}
                        className={cn(
                          'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
                          isHodActive
                            ? 'bg-indigo-600/15 text-indigo-500 font-bold border-l-[3px] border-indigo-500 pl-[9px] rounded-r-lg rounded-l-none'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
                        )}
                      >
                        <div className="relative">
                          {HodIcon && <HodIcon className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', isHodActive ? 'text-indigo-500' : 'text-muted-foreground')} />}
                        </div>
                        {!isCollapsed && <span className="truncate">{hodItem.name}</span>}
                        {!isCollapsed && hodItem.badge && hodItem.badge > 0 ? (
                          <span className="ml-auto bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                            {hodItem.badge}
                          </span>
                        ) : null}
                      </NavLink>
                    );
                  })}
                </div>
              )}
              {menus.map((item: any) => {
                const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Layers;
                const isActive = checkIsActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
                      isActive
                        ? 'bg-primary/10 text-primary font-bold border-l-[3px] border-primary pl-[9px] rounded-r-lg rounded-l-none'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                      {isCollapsed && (item.path === '/?tab=leave_requests' || item.path === '/?tab=workflows') && pendingWfCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse border border-card" />
                      )}
                    </div>
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                );
              })}
            </>
          );
        })()}
      </nav>

      {/* Footer Profile & Logout Section */}
      <div className="border-t p-2 space-y-1 bg-muted/10">

        {(user?.role === 'Super Admin' || user?.role === 'College Admin' || user?.role === 'Principal') && (
          <NavLink
            to="/iam"
            className={cn(
              'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
              location.pathname === '/iam' || location.pathname === '/admin/iam'
                ? 'bg-primary/10 text-primary font-bold border-l-[3px] border-primary pl-[9px] rounded-r-lg rounded-l-none'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
            )}
          >
            <LucideIcons.Shield className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', location.pathname.includes('/iam') ? 'text-primary' : 'text-muted-foreground')} />
            {!isCollapsed && <span className="truncate">Enterprise IAM</span>}
          </NavLink>
        )}

        {(user?.role === 'Super Admin' || user?.role === 'College Admin') && (
          <NavLink
            to="/settings"
            className={cn(
              'relative flex items-center gap-3 py-2 px-3 text-xs font-semibold transition-all duration-200 ease-in-out',
              location.pathname === '/settings'
                ? 'bg-primary/10 text-primary font-bold border-l-[3px] border-primary pl-[9px] rounded-r-lg rounded-l-none'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground pl-3 rounded-lg'
            )}
          >
            <LucideIcons.Settings className={cn('h-4.5 w-4.5 flex-shrink-0 transition-colors duration-200', location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground')} />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </NavLink>
        )}
        
        {/* ALWAYS LAST ITEM: Logout */}
        <button
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200"
        >
          <LucideIcons.LogOut className="h-4.5 w-4.5 flex-shrink-0 text-rose-600" />
          {!isCollapsed && <span className="truncate">Logout</span>}
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-full text-rose-600">
                <LucideIcons.LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Confirm Logout</h3>
                <p className="text-xs text-muted-foreground">Are you sure you want to logout?</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">
              Logging out will end your current session. You will need to log back in to access your dashboard.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsLogoutConfirmOpen(false);
                  await logout();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
