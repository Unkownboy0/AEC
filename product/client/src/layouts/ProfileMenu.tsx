import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, ShieldCheck, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';

export const ProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
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

  if (!user) return null;

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
  const rawRole = (typeof user.role === 'object' && user.role !== null) ? (user.role as any).name : user.role;
  const roleLabel = (rawRole || 'User').toString().toLowerCase().replace('_', ' ');

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  const getProfileRoute = () => {
    const r = (rawRole || '').toString().toUpperCase();
    if (r.includes('ADMIN') || r.includes('SUPER')) return '/admin/profile';
    if (r.includes('FACULTY') || r.includes('PROFESSOR')) return '/faculty/profile';
    if (r.includes('STUDENT')) return '/student/profile';
    if (r.includes('HOD')) return '/hod/profile';
    if (r.includes('PARENT')) return '/parent/profile';
    return '/profile';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
      >
        <Avatar src={user.profilePhoto} name={fullName} size="sm" alt={fullName} />
        <div className="hidden md:block text-left">
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[120px]">
            {fullName}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize mt-0.5 leading-none">
            {roleLabel}
          </p>
        </div>
        <ChevronDown className="hidden md:block w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {fullName}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
              {roleLabel}
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(getProfileRoute());
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Account Settings</span>
            </button>
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
