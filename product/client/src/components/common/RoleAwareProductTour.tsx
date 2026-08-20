import React, { useState, useEffect, useCallback } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2,
  LayoutDashboard, CalendarDays, ClipboardList, Bell, Users,
  BookOpen, Settings2, Shield, FileText, GraduationCap,
  Building2, Award, BarChart3, Clock, Layers, UserCog,
  ClipboardCheck, Megaphone
} from 'lucide-react';

/*
  CAMPUSOS ROLE-AWARE PRODUCT TOUR v2

  Storage key: campusos_tour_v2_{userId}_{normalizedRole}
  Shows once per user/role after initial onboarding.
  Restartable from Settings > Help > Product Tour.
  Version: "v2" — bump to re-trigger for all users on next login.
*/

export const TOUR_VERSION = 'v2';
const TOUR_STORAGE_PREFIX = 'campusos_tour_';

export function getTourStorageKey(userId: string, role: string): string {
  return `${TOUR_STORAGE_PREFIX}${TOUR_VERSION}_${userId}_${role.toLowerCase().replace(/[\s-]+/g, '_')}`;
}

export function isTourCompleted(userId: string, role: string): boolean {
  try {
    const stored = localStorage.getItem(getTourStorageKey(userId, role));
    if (!stored) return false;
    const data = JSON.parse(stored);
    return data?.completed === true;
  } catch {
    return false;
  }
}

export function markTourCompleted(userId: string, role: string, skipped = false): void {
  try {
    localStorage.setItem(getTourStorageKey(userId, role), JSON.stringify({
      completed: true,
      skipped,
      completedAt: new Date().toISOString(),
      role,
      tourVersion: TOUR_VERSION,
    }));
  } catch {}
}

export function resetTour(userId: string, role: string): void {
  try {
    localStorage.removeItem(getTourStorageKey(userId, role));
  } catch {}
}

// ─── Tour Step Definition ─────────────────────────────────────────────────────

interface TourStep {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: string;
  accentColor?: string;
}

// ─── Role-Specific Tours ──────────────────────────────────────────────────────

const ROLE_TOURS: Record<string, TourStep[]> = {
  STUDENT: [
    { id: 'dashboard', icon: LayoutDashboard, title: 'Your Dashboard', description: 'Your personal command center shows today\'s classes, attendance status, pending fees, and recent notifications at a glance.', tag: 'Overview', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'timetable', icon: CalendarDays, title: "Today's Classes", description: 'See your live class schedule for the day — room, faculty, and timings. Tap any class to get details.', tag: 'Timetable', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'assignments', icon: ClipboardList, title: 'Assignments & Tasks', description: 'Submit assignments, track deadlines, and check your marks — all in one place. Due-soon items are highlighted.', tag: 'Academics', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'requests', icon: FileText, title: 'Leave & OD Requests', description: 'Apply for leave or on-duty, track approval status in real-time, and download approved certificates.', tag: 'Requests', accentColor: 'bg-emerald-500/15 text-emerald-600' },
    { id: 'notifications', icon: Bell, title: 'Smart Notifications', description: 'Get notified instantly for approvals, circulars, fee dues, exam schedules, and results. Tap the bell icon anytime.', tag: 'Notifications', accentColor: 'bg-rose-500/15 text-rose-500' },
  ],
  FACULTY: [
    { id: 'dashboard', icon: LayoutDashboard, title: 'Faculty Dashboard', description: "See today's class schedule, pending tasks, leave requests awaiting your action, and departmental notifications.", tag: 'Overview', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'classes', icon: CalendarDays, title: "Today's Classes", description: 'View your live timetable for the day. Mark attendance directly from the class card — just tap the class.', tag: 'Timetable', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'attendance', icon: ClipboardCheck, title: 'Attendance Entry', description: 'Take roll call for each class period. Attendance is submitted immediately and synced with student records.', tag: 'Attendance', accentColor: 'bg-emerald-500/15 text-emerald-600' },
    { id: 'tasks', icon: ClipboardList, title: 'Tasks & Assignments', description: 'Manage assignments for your classes. Review student submissions and provide marks.', tag: 'Tasks', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Receive instant alerts for leave approvals, circulars, HOD approvals, timetable changes, and exam duties.', tag: 'Notifications', accentColor: 'bg-rose-500/15 text-rose-500' },
  ],
  MENTOR: [
    { id: 'mentees', icon: Users, title: 'Your Mentees', description: 'View your assigned mentee list with attendance summaries, academic performance, and pending leave requests.', tag: 'Mentees', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'risk', icon: BarChart3, title: 'At-Risk Students', description: 'Identify mentees with attendance below threshold or declining marks. Use the risk panel for early intervention.', tag: 'Risk Monitor', accentColor: 'bg-rose-500/15 text-rose-500' },
    { id: 'requests', icon: FileText, title: 'Approvals Queue', description: 'Mentee leave and OD requests land in your queue first. Approve, return with remarks, or escalate to HOD.', tag: 'Approvals', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'meetings', icon: CalendarDays, title: 'Mentoring Meetings', description: 'Schedule and log mentoring sessions. Meeting notes are accessible to you and the relevant HOD.', tag: 'Meetings', accentColor: 'bg-emerald-500/15 text-emerald-600' },
  ],
  HOD: [
    { id: 'department', icon: Building2, title: 'Department Overview', description: 'See real-time department health — faculty attendance, student metrics, timetable coverage, and pending items.', tag: 'Department', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'approvals', icon: ClipboardCheck, title: 'Approvals Desk', description: 'Faculty and student leave/OD requests arrive here after mentor approval. Review, decide, and track history.', tag: 'Approvals', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'timetable', icon: CalendarDays, title: 'Timetable Management', description: 'Edit your department timetable, allocate faculty to periods, check live workload, and detect conflicts before publishing.', tag: 'Timetable', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'workload', icon: BarChart3, title: 'Faculty Workload', description: "Monitor each faculty member's allocated periods vs. target, free slots, and current availability status.", tag: 'Workload', accentColor: 'bg-emerald-500/15 text-emerald-600' },
    { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Stay updated on timetable changes, approval escalations, department circulars, and institutional events.', tag: 'Notifications', accentColor: 'bg-rose-500/15 text-rose-500' },
  ],
  DEAN: [
    { id: 'overview', icon: LayoutDashboard, title: 'Dean Overview', description: 'Cross-department summary dashboard showing attendance, academic performance, pending approvals, and escalations.', tag: 'Overview', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'approvals', icon: ClipboardCheck, title: 'Approval Center', description: 'Escalated leave, OD, and special requests from department HODs arrive here for your review and final action.', tag: 'Approvals', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'reports', icon: BarChart3, title: 'Department Reports', description: 'Generate attendance, performance, and workload reports across authorized departments in PDF or Excel.', tag: 'Reports', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'circulars', icon: Megaphone, title: 'Circulars', description: 'Issue and manage departmental or institution-wide circulars. Track acknowledgments from faculty and students.', tag: 'Circulars', accentColor: 'bg-emerald-500/15 text-emerald-600' },
  ],
  VP: [
    { id: 'operations', icon: LayoutDashboard, title: 'Operations Center', description: 'Your institution-wide operational overview — daily attendance, department health, pending escalations, and live feed.', tag: 'Operations', accentColor: 'bg-indigo-500/15 text-indigo-500' },
    { id: 'escalations', icon: ClipboardCheck, title: 'Escalated Approvals', description: 'Requests escalated beyond Dean level arrive here. Review with full audit trail and take final operational action.', tag: 'Escalations', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'delegation', icon: Shield, title: 'Acting Authority', description: 'When designated as Acting Principal, a clear banner shows your delegated scope and expiry. All actions are audit-logged.', tag: 'Delegation', accentColor: 'bg-rose-500/15 text-rose-500' },
    { id: 'reports', icon: BarChart3, title: 'Institution Reports', description: 'Access institution-wide reports: faculty, student, attendance, and departmental performance data.', tag: 'Reports', accentColor: 'bg-blue-500/15 text-blue-500' },
  ],
  PRINCIPAL: [
    { id: 'overview', icon: LayoutDashboard, title: 'Principal Command', description: 'Institution-wide governance view: critical alerts, final approvals queue, department performance, and strategic metrics.', tag: 'Governance', accentColor: 'bg-amber-500/15 text-amber-700' },
    { id: 'approvals', icon: ClipboardCheck, title: 'Final Approvals', description: 'Requests that reach the Principal level are shown here. Your decisions are final — all actions are audit-recorded.', tag: 'Final Authority', accentColor: 'bg-rose-500/15 text-rose-600' },
    { id: 'delegation', icon: UserCog, title: 'Delegation', description: 'Delegate authority to the VP for a specific period and scope. Delegation is visible institution-wide and expires automatically.', tag: 'Delegation', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'reports', icon: BarChart3, title: 'Strategic Reports', description: 'Access accreditation-ready, semester, and annual institutional reports. Export as PDF for governance review.', tag: 'Reports', accentColor: 'bg-emerald-500/15 text-emerald-600' },
  ],
  SUPER_ADMIN: [
    { id: 'people', icon: Users, title: 'People Management', description: 'Create, edit, and manage all students, faculty, staff, and operational users. Control the full user lifecycle.', tag: 'People', accentColor: 'bg-violet-500/15 text-violet-500' },
    { id: 'roles', icon: Shield, title: 'Roles & Workspaces', description: 'Assign and remove roles, set workspace access, and manage effective dates for every user.', tag: 'RBAC', accentColor: 'bg-blue-500/15 text-blue-500' },
    { id: 'modules', icon: Layers, title: 'Feature Modules', description: 'Enable or disable platform modules (Hostel, Transport, Placement, etc.) through the Settings control panel.', tag: 'Modules', accentColor: 'bg-amber-500/15 text-amber-600' },
    { id: 'audit', icon: FileText, title: 'Audit Logs', description: 'Every administrative action, credential change, profile edit, and permission grant is recorded in the Audit Log.', tag: 'Audit', accentColor: 'bg-emerald-500/15 text-emerald-600' },
    { id: 'settings', icon: Settings2, title: 'System Settings', description: 'Configure institution policy, academic settings, security rules, file handling, and branding from Settings.', tag: 'Settings', accentColor: 'bg-rose-500/15 text-rose-500' },
  ],
};

const GENERIC_TOUR: TourStep[] = [
  { id: 'dashboard', icon: LayoutDashboard, title: 'Your Dashboard', description: 'Welcome to CampusOS. Your dashboard gives you an overview of what matters to your role right now.', tag: 'Overview', accentColor: 'bg-violet-500/15 text-violet-500' },
  { id: 'notifications', icon: Bell, title: 'Notifications', description: 'Stay updated with real-time notifications for approvals, messages, and campus events.', tag: 'Notifications', accentColor: 'bg-rose-500/15 text-rose-500' },
  { id: 'profile', icon: GraduationCap, title: 'Your Profile', description: 'Access your profile, change preferences, set your theme, and update notification settings from Settings.', tag: 'Profile', accentColor: 'bg-emerald-500/15 text-emerald-600' },
];

function getTourForRole(role: string): TourStep[] {
  const key = role.toUpperCase().replace(/[\s-]+/g, '_');
  return ROLE_TOURS[key] || GENERIC_TOUR;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RoleAwareProductTourProps {
  isOpen: boolean;
  userRole: string;
  userId: string;
  onComplete: () => void;
}

export const RoleAwareProductTour: React.FC<RoleAwareProductTourProps> = ({
  isOpen,
  userRole,
  userId,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = getTourForRole(userRole);
  const totalSteps = steps.length;

  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  const handleComplete = useCallback((skipped = false) => {
    markTourCompleted(userId, userRole, skipped);
    onComplete();
  }, [userId, userRole, onComplete]);

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete(false);
    }
  }, [currentStep, totalSteps, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
      else if (e.key === 'Escape') { e.preventDefault(); handleComplete(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleNext, handlePrev, handleComplete]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="CampusOS Product Tour"
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-muted w-full">
          <div
            className="h-1 bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Step {currentStep + 1} of {totalSteps}
            </span>
            {step.tag && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                {step.tag}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleComplete(true)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-soft transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-xl shrink-0 ${step.accentColor || 'bg-primary/10 text-primary'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="space-y-1 pt-0.5">
              <h3 className="font-bold text-foreground text-base leading-tight">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center gap-1.5 justify-center pt-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-5 bg-primary' : idx < currentStep ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => handleComplete(true)}
            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-surface-soft transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
            >
              {currentStep === totalSteps - 1 ? (
                <>Finish <CheckCircle2 className="w-3.5 h-3.5" /></>
              ) : (
                <>Next <ChevronRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleAwareProductTour;
