import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Bell,
  User,
  Users,
  CheckSquare,
  Building2,
  BarChart3,
  Activity,
  Menu,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MobileMoreDrawer } from './MobileMoreDrawer';

export const RoleMobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const rawRole = (
    typeof user?.role === 'object' ? (user?.role as any)?.name : String(user?.role || '')
  ).toUpperCase();

  // Role-specific Navigation Items (Max 4 items + "More")
  const getNavItems = () => {
    if (rawRole.includes('STUDENT')) {
      return [
        { label: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Academics', path: '/student/syllabus', icon: BookOpen },
        { label: 'Requests', path: '/student/leave-od', icon: FileCheck },
        { label: 'Notifications', path: '/student/notifications', icon: Bell },
        { label: 'Profile', path: '/student/profile', icon: User },
      ];
    } else if (rawRole.includes('FACULTY') && !rawRole.includes('HOD')) {
      return [
        { label: 'Home', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Attendance', path: '/attendance', icon: CheckCircle2 },
        { label: 'Students', path: '/students', icon: Users },
        { label: 'Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else if (rawRole.includes('HOD')) {
      return [
        { label: 'Dashboard', path: '/hod/dashboard', icon: LayoutDashboard },
        { label: 'Approvals', path: '/hod/approvals', icon: FileCheck },
        { label: 'Department', path: '/hod/overview', icon: Building2 },
        { label: 'Tasks', path: '/hod/tasks', icon: CheckSquare },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else if (rawRole.includes('VICE') || rawRole.includes('VP')) {
      return [
        { label: 'Dashboard', path: '/vp/dashboard', icon: LayoutDashboard },
        { label: 'Operations', path: '/vp/operations', icon: Activity },
        { label: 'Approvals', path: '/approval-center', icon: FileCheck },
        { label: 'Alerts', path: '/notifications', icon: Bell },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else if (rawRole.includes('PRINCIPAL')) {
      return [
        { label: 'Dashboard', path: '/principal/dashboard', icon: LayoutDashboard },
        { label: 'Approvals', path: '/approval-center', icon: FileCheck },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    } else {
      // Default / Super Admin / Dean / Parent
      return [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Approvals', path: '/approval-center', icon: FileCheck },
        { label: 'Notifications', path: '/notifications', icon: Bell },
        { label: 'Profile', path: '/profile', icon: User },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-3 py-1.5 flex justify-around items-center shadow-2xl safe-area-bottom">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-black transition-all ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 scale-105 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="h-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-black transition-all ${
            isMoreOpen
              ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="h-4 w-4 mb-0.5" />
          <span>More</span>
        </button>
      </div>

      {/* Mobile More Sheet / Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        role={rawRole}
      />
    </>
  );
};
