import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building2, ChevronDown, Check, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRoleHome } from '../navigation/role-home';

export const WorkspaceSwitcher: React.FC = () => {
  const { user, switchWorkspace } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user || !user.workspaces || user.workspaces.length <= 1) {
    const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Workspace';
    return (
      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
        <span className="capitalize">{roleLabel}</span>
      </div>
    );
  }

  const activeWorkspace = user.activeWorkspace || user.role;

  const handleSelectWorkspace = async (ws: string) => {
    setIsOpen(false);
    if (ws === activeWorkspace) return;

    try {
      await switchWorkspace(ws);
      navigate(getRoleHome({ role: ws, activeWorkspace: ws, menus: [] }), { replace: true });
    } catch (err) {
      console.error('Failed to switch workspace', err);
    }
  };

  const getWorkspaceTitle = (ws: string) => {
    const norm = ws.toUpperCase();
    if (norm === 'HOD') return 'HOD Workspace';
    if (norm === 'FACULTY') return 'Faculty Workspace';
    if (norm === 'STUDENT') return 'Student Workspace';
    if (norm === 'PRINCIPAL') return 'Principal Workspace';
    if (norm === 'VP') return 'Vice Principal Workspace';
    if (norm === 'ACADEMIC DEAN' || norm === 'ACADEMIC_DEAN') return 'Academic Dean Workspace';
    if (norm === 'EXAMINATION CELL' || norm === 'EXAMINATION_CELL' || norm === 'COE') return 'Examination Cell Workspace';
    if (norm.includes('DEAN')) return 'Dean Workspace';
    if (norm.includes('ADMIN')) return 'Super Admin Workspace';
    return `${ws.replace(/_/g, ' ')} Workspace`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all"
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>{getWorkspaceTitle(activeWorkspace)}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
              Switch Workspace
            </p>
          </div>
          <div className="py-1">
            {user.workspaces.map((ws) => {
              const isActive = ws.toUpperCase() === activeWorkspace.toUpperCase();
              return (
                <button
                  key={ws}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 opacity-70" />
                    <span>{getWorkspaceTitle(ws)}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
