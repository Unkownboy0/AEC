import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Inbox, CheckSquare, Briefcase, BarChart3,
  FileText, FolderGit2, Calendar as CalendarIcon, Bell, Settings,
  Shield, Search, Activity, User, Power, ChevronDown, Sparkles, CheckCircle2,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../../lib/axios';
import { toast } from '../ui/Toast';

export interface ExecutivePortalLayoutProps {
  user: any;
  roleName: string;
  roleBadgeColor?: string;
  children?: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const ExecutivePortalLayout: React.FC<ExecutivePortalLayoutProps> = ({
  user,
  roleName,
  roleBadgeColor = 'from-indigo-600 to-purple-600',
  children,
  activeTab = 'dashboard',
  onTabChange
}) => {
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [presenceStatus, setPresenceStatus] = useState(user?.loginStatus || 'ONLINE');
  const [showPresenceDropdown, setShowPresenceDropdown] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [actingPrincipalMode, setActingPrincipalMode] = useState(false);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Executive Inbox', icon: Inbox },
    { id: 'approvals', label: 'Approval Center', icon: CheckSquare },
    { id: 'workspace', label: 'Workspace', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderGit2 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const updatePresence = async (status: string) => {
    setPresenceStatus(status);
    setShowPresenceDropdown(false);
    try {
      const res = await api.post('/enterprise/executive/presence', { status });
      if (res.data?.actingPrincipalActivated) {
        setActingPrincipalMode(true);
        toast.warn('Offline Mode enabled. Vice Principal activated as Acting Principal.', 'Delegation Active');
      } else {
        setActingPrincipalMode(false);
        toast.success(`Online status set to ${status}.`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update presence status.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE': return { bg: 'bg-emerald-500', text: 'Online' };
      case 'OFFLINE': return { bg: 'bg-slate-400', text: 'Offline' };
      case 'BUSY': return { bg: 'bg-rose-500', text: 'Busy' };
      case 'MEETING': return { bg: 'bg-amber-500', text: 'In Meeting' };
      case 'TEACHING': return { bg: 'bg-blue-500', text: 'Teaching' };
      case 'ON_LEAVE': return { bg: 'bg-purple-500', text: 'On Leave' };
      default: return { bg: 'bg-emerald-500', text: 'Online' };
    }
  };

  const badge = getStatusBadge(presenceStatus);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Bar Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${roleBadgeColor} text-white font-semibold text-sm shadow-md flex items-center gap-2`}>
            <Shield className="w-4 h-4" />
            <span>{roleName} Portal</span>
          </div>

          {actingPrincipalMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Acting Principal Delegation Active</span>
            </div>
          )}
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, students, tasks..."
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresenceDropdown(!showPresenceDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 transition-all"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${badge.bg}`} />
              <span>{badge.text}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPresenceDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Status
                </div>
                {['ONLINE', 'OFFLINE', 'BUSY', 'MEETING', 'TEACHING', 'ON_LEAVE'].map((st) => (
                  <button
                    key={st}
                    onClick={() => updatePresence(st)}
                    className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusBadge(st).bg}`} />
                      {getStatusBadge(st).text}
                    </span>
                    {presenceStatus === st && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
              {user?.firstName?.[0] || 'E'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-200">{user?.firstName} {user?.lastName}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col gap-1 shrink-0">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Executive Portal Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};
