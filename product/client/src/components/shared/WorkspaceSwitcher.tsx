import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  UserCheck,
  Layers,
  Crown,
  Award,
  GraduationCap,
  Users,
  ShieldAlert,
} from 'lucide-react';

const WORKSPACE_ICON_MAP: Record<string, any> = {
  'Super Admin': ShieldAlert,
  'Principal': Crown,
  'Vice Principal': Award,
  'Academic Dean': GraduationCap,
  'Admission Dean': Briefcase,
  'Administration & Admission Dean': Briefcase,
  'IQAC Dean': Award,
  'HOD': Users,
  'Faculty': Briefcase,
  'Mentor': UserCheck,
};

export const WorkspaceSwitcher: React.FC = () => {
  const { user, switchWorkspace } = useAuth();

  if (!user) return null;

  const currentRole = typeof user.role === 'object' ? (user.role as any)?.name || '' : user.role || '';

  const EXCLUDED_MENTOR_ROLES = [
    'HOD', 'Academic Dean', 'Admission Dean', 'Admission & Administration Dean',
    'IQAC Dean', 'IQAC Executive Officer', 'IQAC Executive', 'IQAC Documentation Officer',
    'IQAC Documentation', 'Vice Principal', 'Principal', 'College Admin', 'Super Admin',
    'Exam Cell', 'Sports Officer', 'Hostel Warden', 'Transport Manager', 'Librarian',
    'Office Staff', 'Non Teaching Staff', 'IQAC Employee'
  ];

  const isMentorDisabled = EXCLUDED_MENTOR_ROLES.includes(currentRole);

  let workspacesList = user.workspaces && user.workspaces.length > 1
    ? user.workspaces
    : (currentRole === 'Faculty' ? ['Faculty', 'Mentor'] : [currentRole]);

  if (isMentorDisabled) {
    workspacesList = workspacesList.filter((r: string) => r !== 'Mentor');
  }

  if (workspacesList.length <= 1) return null;

  return (
    <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
      <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1">
        <Layers className="w-3.5 h-3.5 text-indigo-400" /> Workspace:
      </span>
      {workspacesList.map((roleName: string) => {
        const Icon = WORKSPACE_ICON_MAP[roleName] || Briefcase;
        const isActive = currentRole === roleName;

        return (
          <button
            key={roleName}
            onClick={() => !isActive && switchWorkspace(roleName)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {roleName} Workspace
          </button>
        );
      })}
    </div>
  );
};

export default WorkspaceSwitcher;
