import React, { useState } from 'react';
import { Shield, Briefcase, Building } from 'lucide-react';
import { FacultyWorkspace } from './hod/FacultyWorkspace';
import { ExecutiveWorkspace } from './hod/ExecutiveWorkspace';

interface HODPortalProps {
  user: any;
}

export const HODPortal: React.FC<HODPortalProps> = ({ user }) => {
  const [workspaceMode, setWorkspaceMode] = useState<'FACULTY' | 'EXECUTIVE'>('FACULTY');

  return (
    <div className="p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen">
      {/* Top Workspace Isolation Switcher Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 p-3.5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GEETORUS CAMPUSOS</span>
            <h1 className="text-lg font-extrabold text-white leading-none">HOD Command Center</h1>
          </div>
        </div>

        {/* Workspace Switcher Pills */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/70 text-xs font-bold">
          <button
            onClick={() => setWorkspaceMode('FACULTY')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all ${
              workspaceMode === 'FACULTY'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Faculty Workspace (Default)</span>
          </button>
          <button
            onClick={() => setWorkspaceMode('EXECUTIVE')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg transition-all ${
              workspaceMode === 'EXECUTIVE'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Executive Workspace</span>
          </button>
        </div>
      </div>

      {/* Render Independent Workspaces */}
      {workspaceMode === 'FACULTY' ? (
        <FacultyWorkspace user={user} />
      ) : (
        <ExecutiveWorkspace user={user} />
      )}
    </div>
  );
};
