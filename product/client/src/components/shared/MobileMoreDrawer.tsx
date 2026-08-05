import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Shield,
  FileText,
  BookOpen,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  Home,
  QrCode,
  Download,
  Calendar,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

export const MobileMoreDrawer: React.FC<MobileMoreDrawerProps> = ({ isOpen, onClose, role }) => {
  const { logout, user } = useAuth();

  if (!isOpen) return null;

  const isStudent = role.includes('STUDENT');
  const isFaculty = role.includes('FACULTY') && !role.includes('HOD');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex flex-col justify-end animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 space-y-6 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-black text-amber-400">
              {user?.firstName?.[0] || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{user?.firstName} {user?.lastName}</h3>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-3 gap-3">
          {isStudent && (
            <>
              <NavLink
                to="/student/timetable"
                onClick={onClose}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Timetable</span>
              </NavLink>
              <NavLink
                to="/student/id-card"
                onClick={onClose}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
              >
                <QrCode className="w-5 h-5 text-amber-400" />
                <span>Digital ID</span>
              </NavLink>
              <NavLink
                to="/student/examinations"
                onClick={onClose}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
              >
                <Award className="w-5 h-5 text-amber-400" />
                <span>Exams</span>
              </NavLink>
            </>
          )}

          <NavLink
            to="/settings"
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
          >
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Settings</span>
          </NavLink>

          <NavLink
            to="/notifications"
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-amber-400" />
            <span>Alerts</span>
          </NavLink>

          <NavLink
            to="/support"
            onClick={onClose}
            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-1.5 text-[11px] font-extrabold text-slate-300 hover:border-amber-500/50 transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <span>Help</span>
          </NavLink>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of CampusOS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
