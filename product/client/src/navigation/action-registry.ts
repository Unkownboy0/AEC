import { 
  Plus, FileText, CheckSquare, Calendar, ShieldCheck, UserCheck, 
  Award, CreditCard, Users, Briefcase, BookOpen, Clock, Settings,
  AlertCircle, DollarSign, RefreshCw, Send, Sparkles
} from 'lucide-react';

export interface ContextualAction {
  id: string;
  label: string;
  description?: string;
  icon: any;
  color: string;
  path: string;
  roles?: string[]; // Empty means all permitted
  requiredPermission?: string;
  routeMatch?: RegExp | string; // Matches specific pages or routes
  priority?: number;
}

export const CONTEXTUAL_ACTION_REGISTRY: ContextualAction[] = [
  // ── Student Actions ──────────────────────────────────────────
  {
    id: 'student-apply-leave',
    label: 'Apply Leave / OD',
    icon: FileText,
    color: 'bg-indigo-600',
    path: '/student/leave-od',
    roles: ['STUDENT'],
    priority: 100,
  },
  {
    id: 'student-pay-fees',
    label: 'Pay College Fees',
    icon: CreditCard,
    color: 'bg-emerald-600',
    path: '/student/fees',
    roles: ['STUDENT'],
    priority: 90,
  },
  {
    id: 'student-view-timetable',
    label: 'View Timetable',
    icon: Calendar,
    color: 'bg-cyan-600',
    path: '/student/timetable',
    roles: ['STUDENT'],
    priority: 80,
  },
  {
    id: 'student-view-results',
    label: 'View Exam Results',
    icon: Award,
    color: 'bg-amber-600',
    path: '/student/results',
    roles: ['STUDENT'],
    priority: 70,
  },
  {
    id: 'student-certificates',
    label: 'Request Certificate',
    icon: Award,
    color: 'bg-purple-600',
    path: '/student/certificates',
    roles: ['STUDENT'],
    priority: 60,
  },

  // ── Faculty / Mentor Actions ─────────────────────────────────
  {
    id: 'faculty-mark-attendance',
    label: 'Mark Class Attendance',
    icon: Clock,
    color: 'bg-emerald-600',
    path: '/faculty/attendance',
    roles: ['FACULTY', 'MENTOR'],
    requiredPermission: 'attendance:write',
    priority: 100,
  },
  {
    id: 'faculty-add-assignment',
    label: 'Create Assignment',
    icon: BookOpen,
    color: 'bg-indigo-600',
    path: '/faculty/assignments',
    roles: ['FACULTY', 'MENTOR'],
    priority: 90,
  },
  {
    id: 'faculty-apply-leave',
    label: 'Apply Faculty Leave / OD',
    icon: FileText,
    color: 'bg-violet-600',
    path: '/faculty/leave-od',
    roles: ['FACULTY', 'MENTOR'],
    priority: 80,
  },
  {
    id: 'faculty-timetable',
    label: 'Weekly Class Schedule',
    icon: Calendar,
    color: 'bg-blue-600',
    path: '/faculty/timetable',
    roles: ['FACULTY', 'MENTOR'],
    priority: 70,
  },

  // ── HOD Actions ──────────────────────────────────────────────
  {
    id: 'hod-review-approvals',
    label: 'Department Approvals',
    icon: ShieldCheck,
    color: 'bg-rose-600',
    path: '/hod/approvals',
    roles: ['HOD'],
    priority: 100,
  },
  {
    id: 'hod-workload',
    label: 'Assign Faculty Subject',
    icon: UserCheck,
    color: 'bg-purple-600',
    path: '/hod/faculty-workload',
    roles: ['HOD'],
    priority: 90,
  },
  {
    id: 'hod-substitutes',
    label: 'Assign Class Substitute',
    icon: RefreshCw,
    color: 'bg-amber-600',
    path: '/hod/timetable',
    roles: ['HOD'],
    priority: 80,
  },
  {
    id: 'hod-create-task',
    label: 'Dispatch Dept Task',
    icon: CheckSquare,
    color: 'bg-blue-600',
    path: '/hod/tasks',
    roles: ['HOD'],
    priority: 70,
  },

  // ── Principal & VP Actions ───────────────────────────────────
  {
    id: 'principal-approval-center',
    label: 'Executive Approval Desk',
    icon: ShieldCheck,
    color: 'bg-rose-600',
    path: '/principal/approval-center',
    roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'VP'],
    priority: 100,
  },
  {
    id: 'principal-delegation',
    label: 'Delegation & Handover',
    icon: Briefcase,
    color: 'bg-indigo-600',
    path: '/principal/delegation',
    roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'VP'],
    priority: 90,
  },
  {
    id: 'principal-circulars',
    label: 'Publish Campus Notice',
    icon: Send,
    color: 'bg-purple-600',
    path: '/circulars',
    roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'VP', 'SUPER_ADMIN'],
    priority: 80,
  },

  // ── Accounts & Finance Actions ───────────────────────────────
  {
    id: 'accounts-fee-collection',
    label: 'Fee Ledger & Receipts',
    icon: DollarSign,
    color: 'bg-emerald-600',
    path: '/accounts/fees',
    roles: ['ACCOUNTANT', 'FINANCE_MANAGER'],
    priority: 100,
  },
  {
    id: 'accounts-reports',
    label: 'Financial Statements',
    icon: CreditCard,
    color: 'bg-indigo-600',
    path: '/accounts/reports',
    roles: ['ACCOUNTANT', 'FINANCE_MANAGER'],
    priority: 90,
  },

  // ── Super Admin Actions ──────────────────────────────────────
  {
    id: 'admin-users',
    label: 'Manage Users & Credentials',
    icon: Users,
    color: 'bg-indigo-600',
    path: '/admin/users',
    roles: ['SUPER_ADMIN', 'SUPER ADMIN'],
    priority: 100,
  },
  {
    id: 'admin-settings',
    label: 'Institutional Config',
    icon: Settings,
    color: 'bg-slate-700',
    path: '/admin/settings',
    roles: ['SUPER_ADMIN', 'SUPER ADMIN'],
    priority: 90,
  },
];

/**
 * Filter contextual actions according to user role, current path, and permissions.
 */
export function getContextualActions(
  userRole: string,
  currentPath: string,
  hasPermission?: (p: string) => boolean
): ContextualAction[] {
  const normalizedRole = userRole.toUpperCase().replace(/\s+/g, '_');

  return CONTEXTUAL_ACTION_REGISTRY.filter((action) => {
    // 1. Check role match
    if (action.roles && action.roles.length > 0) {
      const matchRole = action.roles.some((r) => {
        const nr = r.toUpperCase().replace(/\s+/g, '_');
        return normalizedRole === nr || normalizedRole.includes(nr) || nr.includes(normalizedRole);
      });
      if (!matchRole) return false;
    }

    // 2. Check permission if specified
    if (action.requiredPermission && hasPermission) {
      if (!hasPermission(action.requiredPermission)) return false;
    }

    // 3. Exclude current path to prevent redundant reload
    if (action.path === currentPath) return false;

    return true;
  }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
