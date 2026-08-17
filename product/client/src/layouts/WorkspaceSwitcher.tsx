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
        className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-all touch-target"
        aria-label="Switch workspace"
        title={getWorkspaceTitle(activeWorkspace)}
      >
        <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        {/* Full title on larger screens only; mobile keeps this trigger icon-only so it
            never crowds the header. Full labels are always shown inside the panel below. */}
        <span className="hidden sm:inline truncate max-w-[10rem]">{getWorkspaceTitle(activeWorkspace)}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Mobile-only backdrop so the panel reads as a bottom sheet, not a stray dropdown */}
          <div
            className="sm:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={[
              'z-50 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl py-2',
              // Mobile: full-width bottom sheet, safe-area aware
              'fixed inset-x-0 bottom-0 pb-safe rounded-t-3xl border-t animate-in slide-in-from-bottom duration-200',
              // Desktop/tablet: compact anchored dropdown
              'sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:mt-2 sm:w-56 sm:rounded-2xl sm:border sm:pb-2 sm:animate-in sm:fade-in sm:slide-in-from-top-2 sm:duration-150',
            ].join(' ')}
          >
            <div className="sm:hidden w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-2 mt-1" />
            <div className="px-3.5 sm:px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
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
                    className={`w-full flex items-center justify-between px-3.5 py-3 sm:py-2 text-xs font-medium transition-colors touch-target ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 opacity-70 shrink-0" />
                      <span>{getWorkspaceTitle(ws)}</span>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
