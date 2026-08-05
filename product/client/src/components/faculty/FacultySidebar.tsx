import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Clock, BookOpen, UserCheck, FileText, Award, Calendar,
  Megaphone, CheckSquare, MessageSquare, Bell, User, Settings, HelpCircle,
  LogOut, Heart, Shield, Users, Layers, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  color?: string;
}

interface FacultySidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  workspaceType?: 'FACULTY' | 'MENTOR';
  onSwitchWorkspace?: (type: 'FACULTY' | 'MENTOR') => void;
}

export const FacultySidebar: React.FC<FacultySidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen = false,
  onMobileClose,
  workspaceType = 'FACULTY',
  onSwitchWorkspace,
}) => {
  const { user, logout } = useAuth();

  const facultyNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Command Center', icon: Sparkles, badge: 'Live' },
    { id: 'timetable', label: 'My Schedule', icon: Clock },
    { id: 'subjects', label: 'Assigned Subjects', icon: BookOpen },
    { id: 'attendance', label: 'Attendance Desk', icon: UserCheck },
    { id: 'assignments', label: 'Assignments & Work', icon: FileText },
    { id: 'marks', label: 'Internal Assessment', icon: Award },
    { id: 'leave', label: 'Leave & OD', icon: Calendar },
    { id: 'circulars', label: 'Circulars Inbox', icon: Megaphone },
    { id: 'tasks', label: 'Assigned Tasks', icon: CheckSquare },
    { id: 'messaging', label: 'Messaging & Chat', icon: MessageSquare },
    { id: 'mentor', label: 'Mentorship Ward', icon: Heart, badge: 'Active' },
    { id: 'availability', label: 'Faculty Availability', icon: Users },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const mentorNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Mentor Command', icon: Sparkles, badge: 'Live' },
    { id: 'students', label: 'Assigned Wards', icon: Users },
    { id: 'approvals', label: 'Ward Approvals', icon: CheckSquare, badge: 'Pending' },
    { id: 'monitoring', label: 'Academic Risk Engine', icon: Shield },
    { id: 'counseling', label: 'Counselling Logs', icon: FileText },
    { id: 'parent_comm', label: 'Parent Connect', icon: MessageSquare },
    { id: 'availability', label: 'Faculty Board', icon: Users },
  ];

  const currentItems = workspaceType === 'FACULTY' ? facultyNavItems : mentorNavItems;

  const content = (
    <div className="flex flex-col h-full bg-card border-r border-border w-64 select-none">
      {/* Header Profile Summary */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
              {user?.firstName?.[0] || 'F'}
            </div>
            <div className="space-y-0.5">
              <span className="font-extrabold text-foreground text-xs block truncate max-w-[130px]">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold block">
                {(user as any)?.designation || (user as any)?.role || 'Faculty Member'}
              </span>

            </div>
          </div>
          {onMobileClose && (
            <button onClick={onMobileClose} className="md:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Workspace Switcher Pills */}
        {onSwitchWorkspace && (
          <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => onSwitchWorkspace('FACULTY')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                workspaceType === 'FACULTY' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => onSwitchWorkspace('MENTOR')}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                workspaceType === 'MENTOR' ? 'bg-background text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mentor
            </button>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
        <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {workspaceType === 'FACULTY' ? 'Faculty Navigation' : 'Mentorship Navigation'}
        </div>
        {currentItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onMobileClose) onMobileClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="p-3 border-t border-border space-y-1">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 h-full">{content}</aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xs" onClick={onMobileClose} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 h-full"
          >
            {content}
          </motion.div>
        </div>
      )}
    </>
  );
};
