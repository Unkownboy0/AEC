import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CheckCircle, ClipboardList, Settings, Sparkles } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { label: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Academics', path: '/student/syllabus', icon: BookOpen },
    { label: 'Attendance', path: '/student/attendance', icon: CheckCircle },
    { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
    { label: 'Gamify', path: '/student/gamification', icon: Sparkles },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-2 py-1 flex justify-around items-center shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4 mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
