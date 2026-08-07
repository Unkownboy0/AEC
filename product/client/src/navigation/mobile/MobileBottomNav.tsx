import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Home, BookOpen, FileText, MessageSquare, User,
  CreditCard, CheckSquare, Users, Activity,
  ShieldCheck, Search, Bell, MoreHorizontal,
  Clock, Building2, BarChart3, Heart, Briefcase,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV — CampusOS Navigation
   
   Role-specific 5-tab bottom navigation per master spec:
   
   Student:   Home | Academics | Requests | Messages | Profile
   Parent:    Home | Academics | Fees     | Messages | Profile
   Faculty:   Home | Attendance| Students | Tasks    | Profile
   HOD:       Home | Approvals | Department| Tasks   | Profile
   Principal: Home | Approvals | Search   | Alerts   | Profile
   VP:        Home | Operations| Approvals | Alerts  | Profile
   Dean:      Home | Work      | Approvals | Reports | Profile
   ═══════════════════════════════════════════════════════════════════ */

interface BottomNavItem {
  label: string;
  path: string;
  icon: React.FC<{ className?: string }>;
}

const ROLE_NAV_CONFIGS: Record<string, BottomNavItem[]> = {
  student: [
    { label: 'Home', path: '/student/dashboard', icon: Home },
    { label: 'Academics', path: '/student/academics', icon: BookOpen },
    { label: 'Requests', path: '/student/requests', icon: FileText },
    { label: 'Messages', path: '/student/messages', icon: MessageSquare },
    { label: 'Profile', path: '/student/profile', icon: User },
  ],
  parent: [
    { label: 'Home', path: '/parent/dashboard', icon: Home },
    { label: 'Academics', path: '/parent/academics', icon: BookOpen },
    { label: 'Fees', path: '/parent/fees', icon: CreditCard },
    { label: 'Messages', path: '/parent/messages', icon: MessageSquare },
    { label: 'Profile', path: '/parent/profile', icon: User },
  ],
  faculty: [
    { label: 'Home', path: '/faculty/dashboard', icon: Home },
    { label: 'Attendance', path: '/faculty/attendance', icon: Clock },
    { label: 'Students', path: '/faculty/students', icon: Users },
    { label: 'Tasks', path: '/faculty/tasks', icon: CheckSquare },
    { label: 'Profile', path: '/faculty/profile', icon: User },
  ],
  mentor: [
    { label: 'Home', path: '/faculty/mentor/dashboard', icon: Home },
    { label: 'Students', path: '/faculty/mentor/students', icon: Heart },
    { label: 'Approvals', path: '/faculty/mentor/leave-od', icon: FileText },
    { label: 'Tasks', path: '/faculty/mentor/tasks', icon: CheckSquare },
    { label: 'Profile', path: '/faculty/profile', icon: User },
  ],
  hod: [
    { label: 'Home', path: '/hod/dashboard', icon: Home },
    { label: 'Approvals', path: '/hod/approvals', icon: ShieldCheck },
    { label: 'Available', path: '/hod/department-availability', icon: Building2 },
    { label: 'Tasks', path: '/hod/tasks', icon: CheckSquare },
    { label: 'Profile', path: '/hod/profile', icon: User },
  ],
  principal: [
    { label: 'Home', path: '/principal/dashboard', icon: Home },
    { label: 'Approvals', path: '/principal/approval-center', icon: ShieldCheck },
    { label: 'Search', path: '/principal/search', icon: Search },
    { label: 'Alerts', path: '/principal/notifications', icon: Bell },
    { label: 'Profile', path: '/principal/profile', icon: User },
  ],
  vp: [
    { label: 'Home', path: '/vp/dashboard', icon: Home },
    { label: 'Operations', path: '/vp/operations', icon: Activity },
    { label: 'Approvals', path: '/vp/leave-approvals', icon: ShieldCheck },
    { label: 'Alerts', path: '/vp/notifications', icon: Bell },
    { label: 'Profile', path: '/vp/profile', icon: User },
  ],
  academic_dean: [
    { label: 'Home', path: '/academic-dean/dashboard', icon: Home },
    { label: 'Work', path: '/academic-dean/tasks', icon: Briefcase },
    { label: 'Approvals', path: '/academic-dean/approvals', icon: ShieldCheck },
    { label: 'Reports', path: '/academic-dean/reports', icon: BarChart3 },
    { label: 'Profile', path: '/academic-dean/profile', icon: User },
  ],
  admission_dean: [
    { label: 'Home', path: '/admission-dean/dashboard', icon: Home },
    { label: 'Work', path: '/admission-dean/admissions', icon: Briefcase },
    { label: 'Approvals', path: '/admission-dean/approvals', icon: ShieldCheck },
    { label: 'Reports', path: '/admission-dean/reports', icon: BarChart3 },
    { label: 'Profile', path: '/admission-dean/profile', icon: User },
  ],
  iqac: [
    { label: 'Home', path: '/iqac/dashboard', icon: Home },
    { label: 'Work', path: '/iqac/accreditation', icon: Briefcase },
    { label: 'Approvals', path: '/iqac/approvals', icon: ShieldCheck },
    { label: 'Reports', path: '/iqac/reports', icon: BarChart3 },
    { label: 'Profile', path: '/iqac/profile', icon: User },
  ],
  // Super admin / default
  admin: [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Users', path: '/users', icon: Users },
    { label: 'Settings', path: '/settings', icon: Activity },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ],
};

function resolveRole(role?: string): string {
  if (!role) return 'admin';
  const r = role.toLowerCase();
  if (r.includes('student')) return 'student';
  if (r.includes('parent')) return 'parent';
  if (r.includes('mentor')) return 'mentor';
  if (r.includes('hod') || r.includes('head_of_department')) return 'hod';
  if (r.includes('vice') || r.includes('vp')) return 'vp';
  if (r.includes('principal')) return 'principal';
  if (r.includes('academic_dean') || r.includes('academic dean')) return 'academic_dean';
  if (r.includes('admission_dean') || r.includes('admission dean')) return 'admission_dean';
  if (r.includes('iqac')) return 'iqac';
  if (r.includes('faculty')) return 'faculty';
  return 'admin';
}

export interface MobileBottomNavProps {
  role?: string;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role }) => {
  const resolvedRole = resolveRole(role);
  const items = ROLE_NAV_CONFIGS[resolvedRole] || ROLE_NAV_CONFIGS.admin;
  const location = useLocation();

  return (
    <nav
      className={clsx(
        'fixed bottom-0 inset-x-0 z-header lg:hidden',
        'bg-surface/95 backdrop-blur-md border-t border-border',
        'pb-safe'
      )}
      aria-label="Bottom navigation"
    >
      <div className="flex items-stretch justify-around h-14 px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center gap-0.5 flex-1',
                'text-[10px] font-medium transition-colors duration-fast',
                'touch-target',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon
                className={clsx(
                  'w-5 h-5',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <span className={clsx(isActive && 'font-semibold')}>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

MobileBottomNav.displayName = 'MobileBottomNav';
export default MobileBottomNav;
