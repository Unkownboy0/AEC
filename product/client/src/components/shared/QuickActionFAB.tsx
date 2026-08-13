import React, { useState } from 'react';
import { Plus, X, FileText, CheckSquare, Calendar, ShieldCheck, UserCheck, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getEntryById } from '../../navigation/navigation.utils';


export const QuickActionFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleUpper = (user.role || '').toUpperCase();

  // Define actions based on role
  let actions: { label: string; icon: any; routeId: string; color: string }[] = [];

  if (roleUpper.includes('STUDENT')) {
    actions = [
      { label: 'Apply Leave / OD', icon: FileText, routeId: 'student-leave-od', color: 'bg-indigo-600' },
      { label: 'View Timetable', icon: Calendar, routeId: 'student-timetable', color: 'bg-emerald-600' },
      { label: 'Check Results', icon: Award, routeId: 'student-marks', color: 'bg-amber-600' },
    ];
  } else if (roleUpper.includes('HOD')) {
    actions = [
      { label: 'Review Approvals', icon: ShieldCheck, routeId: 'hod-approvals', color: 'bg-indigo-600' },
      { label: 'Faculty Workload', icon: UserCheck, routeId: 'hod-faculty', color: 'bg-purple-600' },
      { label: 'Create Task', icon: CheckSquare, routeId: 'hod-tasks', color: 'bg-blue-600' },
    ];
  } else if (roleUpper.includes('PRINCIPAL') || roleUpper.includes('VP')) {
    actions = [
      { label: 'Approval Center', icon: ShieldCheck, routeId: 'principal-approvals', color: 'bg-rose-600' },
      { label: 'Dept Availability', icon: Calendar, routeId: 'principal-availability', color: 'bg-indigo-600' },
    ];
  } else {
    // Faculty / Mentor / Default
    actions = [
      { label: 'Mark Attendance', icon: CheckSquare, routeId: 'faculty-attendance', color: 'bg-emerald-600' },
      { label: 'Apply Leave', icon: FileText, routeId: 'faculty-leave-od', color: 'bg-indigo-600' },
    ];
  }

  return (
    <div className="fixed bottom-24 sm:bottom-24 lg:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Action menu backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Items List */}
      {isOpen && (
        <div className="z-50 mb-3 space-y-2 animate-in slide-in-from-bottom-3 fade-in duration-150 flex flex-col items-end">
          {actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsOpen(false);
                  const route = getEntryById(act.routeId);
                  if (route) navigate(route.path);
                }}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface border border-border shadow-modal text-text-primary hover:bg-surface-soft transition-all text-xs font-bold group shrink-0"
              >
                <span>{act.label}</span>
                <div className={`p-2 rounded-xl text-white ${act.color} shadow-xs group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`z-50 p-4 rounded-2xl bg-primary text-primary-foreground shadow-2xl hover:bg-primary-hover active:scale-95 transition-all duration-200 flex items-center justify-center ${
          isOpen ? 'rotate-45 bg-rose-600 hover:bg-rose-700' : ''
        }`}
        title="Quick Actions"
        aria-label="Quick Actions"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
};
