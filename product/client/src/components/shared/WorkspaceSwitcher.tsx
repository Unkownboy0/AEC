import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  Users,
  ChevronDown,
  CheckCircle2,
  Crown,
  GraduationCap,
  Award,
  Layers
} from 'lucide-react';

interface WorkspaceMeta {
  title: string;
  sub: string;
  icon: any;
  route: string;
}

const WORKSPACE_DETAILS: Record<string, WorkspaceMeta> = {
  'HOD': {
    title: 'HOD Workspace',
    sub: 'Department administration, approvals and monitoring',
    icon: Users,
    route: '/hod/dashboard',
  },
  'Faculty': {
    title: 'Faculty Workspace',
    sub: 'Subjects, attendance, assignments and teaching activities',
    icon: Briefcase,
    route: '/faculty/dashboard',
  },
  'Academic Dean': {
    title: 'Academic Dean Workspace',
    sub: 'Curriculum, timetables and academic oversight',
    icon: GraduationCap,
    route: '/academic-dean',
  },
  'Admission Dean': {
    title: 'Admission Dean Workspace',
    sub: 'Student leads, applications and seat intake',
    icon: Briefcase,
    route: '/admission-dean',
  },
  'IQAC Dean': {
    title: 'IQAC Dean Workspace',
    sub: 'Quality assurance, NAAC/NBA and AQAR audits',
    icon: Award,
    route: '/iqac-dean',
  },
};

export const WorkspaceSwitcher: React.FC = () => {
  const { user, switchWorkspace } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Determine current active workspace
  const currentWorkspace = user.activeWorkspace || user.role || 'Faculty';

  // Derive allowed workspaces list
  let workspacesList: string[] = user.workspaces && user.workspaces.length > 0
    ? user.workspaces
    : [];

  if (workspacesList.length === 0) {
    if (user.role === 'HOD') workspacesList = ['HOD', 'Faculty'];
    else if (user.role === 'Faculty') workspacesList = ['Faculty'];
    else if (user.role === 'Academic Dean') workspacesList = ['Academic Dean', 'Faculty'];
    else if (user.role === 'Admission Dean') workspacesList = ['Admission Dean', 'Faculty'];
    else if (user.role === 'IQAC Dean') workspacesList = ['IQAC Dean', 'Faculty'];
    else workspacesList = [user.role];
  }

  const userRole = typeof user.role === 'object' ? (user.role as any)?.name : String(user.role || '');
  const isVp = userRole === 'Vice Principal' || userRole === 'VP';

  // EXPLICIT DIRECTIVE: Filter out Mentor, and filter out Faculty for VP role alone
  const filteredWorkspaces = Array.from(
    new Set(workspacesList.filter((ws) => {
      if (ws === 'Mentor') return false;
      if (isVp && ws === 'Faculty') return false;
      return true;
    }))
  );

  if (filteredWorkspaces.length <= 1) return null;

  const currentMeta = WORKSPACE_DETAILS[currentWorkspace] || {
    title: `${currentWorkspace} Workspace`,
    sub: 'Authorized Workspace',
    icon: Layers,
    route: '/faculty/dashboard',
  };

  const CurrentIcon = currentMeta.icon;

  const handleSelectWorkspace = async (wsName: string) => {
    setIsOpen(false);
    if (wsName === currentWorkspace) return;

    try {
      await switchWorkspace(wsName);
      const targetRoute = WORKSPACE_DETAILS[wsName]?.route || (wsName === 'HOD' ? '/hod/dashboard' : '/faculty/dashboard');
      navigate(targetRoute);
    } catch (err) {
      console.error('Failed to switch workspace:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Centralized Header Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/15 transition-all text-left group focus:outline-none"
      >
        <div className="p-1 rounded-lg bg-primary/20 text-primary">
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="hidden sm:block leading-tight">
          <span className="text-xs font-black tracking-tight text-foreground block">{currentMeta.title}</span>
          <span className="text-[9px] text-muted-foreground font-semibold block truncate max-w-[140px]">
            {user.role === 'HOD' ? 'Computer Science Dept' : 'Active Workspace'}
          </span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Switcher Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-card border border-border/80 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-2">
          <div className="px-2 py-1 border-b pb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Switch Workspace</span>
          </div>

          <div className="space-y-1.5">
            {filteredWorkspaces.map((wsName) => {
              const meta = WORKSPACE_DETAILS[wsName] || {
                title: `${wsName} Workspace`,
                sub: 'Authorized Workspace',
                icon: Layers,
                route: '/faculty/dashboard',
              };
              const Icon = meta.icon;
              const isCurrent = wsName === currentWorkspace;

              return (
                <button
                  key={wsName}
                  onClick={() => handleSelectWorkspace(wsName)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                    isCurrent
                      ? 'bg-primary/15 border-primary shadow-xs'
                      : 'border-transparent hover:bg-muted/60'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-foreground">{meta.title}</span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-snug mt-0.5">{meta.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
