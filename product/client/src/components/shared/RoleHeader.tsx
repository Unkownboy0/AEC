import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProfileAvatar } from '../common/ProfileAvatar';
import { NotificationBell } from '../../layouts/NotificationBell';
import { SearchBar } from '../../layouts/SearchBar';
import { ProfileMenu } from '../../layouts/ProfileMenu';
import { ThemeSelector } from '../../theme/ThemeSelector';
import { CampusAppLauncher } from '../workspace/CampusAppLauncher';
import { WorkspaceSwitcher } from '../../layouts/WorkspaceSwitcher';
import { PrincipalStatusControl } from '../../modules/principal-availability/components/PrincipalStatusControl';
import { ArrowLeft, Sparkles, Shield, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getEntryForLocation } from '../../navigation/navigation.utils';
import { clsx } from 'clsx';

export interface RoleHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
  showThemeToggle?: boolean;
  rightActions?: React.ReactNode;
  className?: string;
}

/**
 * Resolves context subtitle, badges, and executive styling for any CampusOS role
 */
export function resolveRoleContext(user: any): {
  roleTitle: string;
  contextSubtitle: string;
  isVp: boolean;
  isPrincipal: boolean;
  executiveBadge?: string;
  accentClass: string;
} {
  if (!user) {
    return {
      roleTitle: 'Campus User',
      contextSubtitle: 'CampusOS by Geetorus',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  const rawRole = (typeof user.role === 'object' && user.role !== null ? user.role.name : user.role) || '';
  const r = rawRole.toString().toUpperCase().replace(/[\s_-]+/g, '');

  const student = user.student || {};
  const faculty = user.faculty || {};
  const employee = user.employee || {};

  const deptName = user.departmentName || user.departmentCode || user.department || faculty.department?.name || student.department?.name || '';
  const programName = student.program?.name || student.programName || deptName;
  const semesterNumber = student.semester?.number || student.semesterNumber || student.currentSemester || '';
  const explicitYear = student.currentYear || student.year || student.academicYearNumber || '';
  const academicYearNumber = explicitYear || (semesterNumber ? Math.ceil(Number(semesterNumber) / 2) : '');
  const sectionValue = student.section?.name || student.sectionName || student.section || '';

  // 1. STUDENT
  if (r.includes('STUDENT')) {
    const deptCode = student.department?.code || student.departmentCode || deptName || '';
    const rawProgram = student.program?.shortName || student.program?.code || student.program?.name || student.programName || '';
    const program = rawProgram.replace(/Bachelor of Technology/gi, 'B.Tech').replace(/Bachelor of Engineering/gi, 'B.E.');
    const context = [
      program,
      deptCode && !program.toUpperCase().includes(String(deptCode).toUpperCase()) ? deptCode : '',
      academicYearNumber ? `Year ${String(academicYearNumber).replace(/\D/g, '') || academicYearNumber}` : '',
      semesterNumber ? `Sem ${semesterNumber}` : '',
      sectionValue ? `Section ${sectionValue}` : '',
    ].filter(Boolean);
    return {
      roleTitle: 'Student',
      contextSubtitle: context.join(' • ') || 'Student workspace',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 2. VICE PRINCIPAL (VP)
  if (r === 'VP' || r.includes('VICEPRINCIPAL')) {
    return {
      roleTitle: 'Vice Principal',
      contextSubtitle: 'Vice Principal',
      isVp: true,
      isPrincipal: false,
      executiveBadge: 'Vice Principal',
      accentClass: 'border-indigo-500/30 bg-indigo-500/5',
    };
  }

  // 3. PRINCIPAL
  if (r === 'PRINCIPAL' || r.includes('HEADOFINSTITUTION')) {
    return {
      roleTitle: 'Principal',
      contextSubtitle: 'Principal',
      isVp: false,
      isPrincipal: true,
      executiveBadge: 'Governance Authority',
      accentClass: 'border-amber-500/30 bg-amber-500/5',
    };
  }

  // 4. HEAD OF DEPARTMENT (HOD)
  if (r.includes('HOD') || r.includes('HEADOFDEPARTMENT')) {
    const deptFull = faculty.department?.name || user.departmentName || deptName || 'Information Technology';
    return {
      roleTitle: 'Head of Department',
      contextSubtitle: `HOD • ${deptFull}`,
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 5. CLASS ADVISER
  if (r.includes('CLASSADVISER') || r.includes('CLASSADVISOR') || r.includes('CLASSINCHARGE')) {
    const deptFull = faculty.department?.name || user.departmentName || deptName || 'IT';
    return {
      roleTitle: 'Class Adviser',
      contextSubtitle: `Class Adviser • ${deptFull}`,
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 6. MENTOR
  if (r.includes('MENTOR')) {
    const menteesCount = user.menteesCount || (faculty as any).menteesCount || 24;
    return {
      roleTitle: 'Faculty Mentor',
      contextSubtitle: `Mentor • ${menteesCount} Mentees`,
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 7. ACADEMIC DEAN
  if (r.includes('ACADEMICDEAN') || r === 'DEANACADEMICS' || r === 'DEANACADEMIC') {
    return {
      roleTitle: 'Dean of Academic Affairs',
      contextSubtitle: 'Academic Dean',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 8. ADMISSION & ADMINISTRATION DEAN
  if (r.includes('ADMINISTRATIONDEAN') || r.includes('ADMISSIONDEAN') || r === 'DEANAA' || r === 'DEANADMIN') {
    return {
      roleTitle: 'Dean of Administration & Admissions',
      contextSubtitle: 'Admission & Administration Dean',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 9. IQAC DEAN
  if (r.includes('IQAC')) {
    return {
      roleTitle: 'Director / Dean, IQAC',
      contextSubtitle: 'IQAC Dean',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 10. COE
  if (r === 'COE' || r.includes('CONTROLLEROFEXAMINATION')) {
    return {
      roleTitle: 'Controller of Examinations',
      contextSubtitle: 'COE',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 11. FACULTY / PROFESSOR
  if (r.includes('FACULTY') || r.includes('TEACHER') || r.includes('PROFESSOR')) {
    const desig = user.designation || faculty.designation || employee.designation || 'Assistant Professor';
    const dept = user.departmentCode || faculty.department?.code || deptName || 'IT';
    return {
      roleTitle: desig,
      contextSubtitle: `${desig} • ${dept}`,
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 12. PARENT
  if (r.includes('PARENT') || r.includes('GUARDIAN')) {
    return {
      roleTitle: 'Parent / Guardian',
      contextSubtitle: user.studentName ? `Ward: ${user.studentName}` : 'Student Ward Monitoring Portal',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 13. ACCOUNTANT / FINANCE
  if (r.includes('ACCOUNTANT') || r.includes('FINANCE') || r.includes('ACCOUNTS')) {
    return {
      roleTitle: 'Accountant',
      contextSubtitle: 'Accounts & Financial Operations Desk',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 14. AO
  if (r === 'AO' || r.includes('ADMINISTRATIVEOFFICER')) {
    return {
      roleTitle: 'Administrative Officer',
      contextSubtitle: 'Administrative Office & Campus Services',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 15. LIBRARY
  if (r.includes('LIBRARIAN') || r.includes('LIBRARY')) {
    return {
      roleTitle: 'Librarian',
      contextSubtitle: 'Central Library Management & Circulation',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 16. HOSTEL
  if (r.includes('HOSTEL') || r.includes('WARDEN')) {
    return {
      roleTitle: 'Hostel Warden',
      contextSubtitle: 'Hostel Residential Life & Student Welfare',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 17. TRANSPORT
  if (r.includes('TRANSPORT')) {
    return {
      roleTitle: 'Transport Manager',
      contextSubtitle: 'Fleet Management & Route Operations',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 18. PLACEMENT
  if (r.includes('PLACEMENT')) {
    return {
      roleTitle: 'Placement Officer',
      contextSubtitle: 'Training, Career Guidance & Placement Cell',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 19. OFFICE
  if (r.includes('OFFICE')) {
    return {
      roleTitle: 'Office Administration',
      contextSubtitle: 'Central Office & Student Records Division',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 20. HR
  if (r.includes('HR')) {
    return {
      roleTitle: 'HR Administrator',
      contextSubtitle: 'Human Resources & Faculty Development',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  // 21. SUPER ADMIN / ADMIN
  if (r.includes('SUPERADMIN')) {
    return {
      roleTitle: 'Super Administrator',
      contextSubtitle: 'Enterprise Master Control & IAM Console',
      isVp: false,
      isPrincipal: false,
      executiveBadge: 'Master Authority',
      accentClass: '',
    };
  }

  if (r.includes('ADMIN')) {
    return {
      roleTitle: 'College Administrator',
      contextSubtitle: 'Campus Administration & Institutional Services',
      isVp: false,
      isPrincipal: false,
      accentClass: '',
    };
  }

  return {
    roleTitle: rawRole || 'Campus User',
    contextSubtitle: `${deptName ? `${deptName} • ` : ''}CampusOS by Geetorus`,
    isVp: false,
    isPrincipal: false,
    accentClass: '',
  };
}

/**
 * Shared Role-Aware Header Component for all CampusOS Roles
 */
export const RoleHeader: React.FC<RoleHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  showSearch = true,
  showNotifications = true,
  showAvatar = true,
  showThemeToggle = true,
  rightActions,
  className = '',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hrs = time.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userDisplayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User'
    : 'User';

  const roleInfo = resolveRoleContext(user);
  const currentRoute = getEntryForLocation(location.pathname);
  const isWorkspaceHome = currentRoute?.group === 'overview' && currentRoute?.path === location.pathname;

  // Resolve sub-page title vs workspace greeting
  const isSubPage = showBack || !isWorkspaceHome;
  const computedTitle = title || (isSubPage && currentRoute?.label ? currentRoute.label : `${getGreeting()}, ${userDisplayName}`);
  const computedSubtitle = subtitle || roleInfo.contextSubtitle;

  const handleBackAction = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={clsx(
        'w-full flex items-center justify-between gap-2.5 px-3 min-[360px]:px-4 sm:px-6 py-2 min-[480px]:py-2.5 transition-all',
        roleInfo.accentClass,
        className
      )}
    >
      {/* ─── LEFT: GREETING & ROLE / CONTEXT ───────────────────────────── */}
      <div className="flex items-center gap-2 min-[360px]:gap-2.5 sm:gap-3 min-w-0 flex-1">
        {/* Back Button for Sub-pages */}
        {isSubPage && (
          <button
            type="button"
            onClick={handleBackAction}
            className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-text-secondary hover:text-text-primary hover:bg-surface-soft rounded-xl transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Text Container with controlled wrapping */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          {/* Greeting / Page Title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-sm min-[360px]:text-[15px] sm:text-lg font-bold text-text-primary tracking-tight leading-snug line-clamp-2">
              {computedTitle}
            </h1>

            {/* Executive Badge for VP / Principal / Super Admin */}
            {roleInfo.isVp && (
              <span className="hidden min-[480px]:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Shield className="w-3 h-3 text-indigo-400" /> VP
              </span>
            )}
            {roleInfo.isPrincipal && (
              <span className="hidden min-[480px]:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                <Crown className="w-3 h-3 text-amber-400" /> Governance
              </span>
            )}
          </div>

          {/* Subtitle / Role Context */}
          <div className="flex items-center gap-2 mt-0.5 min-w-0">
            <p className="text-[11px] min-[360px]:text-xs text-text-muted font-medium truncate leading-tight">
              {computedSubtitle}
            </p>
            <div className="hidden min-[640px]:block shrink-0">
              <WorkspaceSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: SEARCH, NOTIFICATIONS, AVATAR ───────────────────── */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Search Bar / Command Palette (on tablet/desktop or icon on mobile) */}
        {showSearch && <SearchBar />}

        {/* Notification Bell with real state-driven badge */}
        {showNotifications && <NotificationBell />}

        {/* Extra Action Slot */}
        {rightActions}

        {/* Canonical Profile Avatar (38–42px, min 44px tap target) */}
        {showAvatar && <ProfileMenu />}
      </div>
    </div>
  );
};

export default RoleHeader;
