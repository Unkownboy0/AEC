import { FeatureFlags } from '../../core/feature-flags';
import { checkPermission } from '../../core/middlewares/auth.middleware';

export type CampusSuiteCategory =
  | 'Productivity'
  | 'Communication'
  | 'Calendar'
  | 'Academic'
  | 'Operations'
  | 'Intelligence'
  | 'Administration';

export interface CampusSuiteApp {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: CampusSuiteCategory;
  icon: string;
  path: string;
  keywords: string[];
}

interface CampusSuiteAppDefinition extends Omit<CampusSuiteApp, 'path'> {
  path?: string;
  rolePaths?: Record<string, string>;
  roles?: string[];
  featureFlag?: string;
  permissionAny?: string[];
}

export interface CampusSuiteAccessContext {
  role: string;
  permissions: string[];
}

const normalizeRole = (role: string) => role.trim().toUpperCase().replace(/[\s-]+/g, '_');

const ACADEMIC_STAFF_ROLES = [
  'FACULTY',
  'MENTOR',
  'CLASS_ADVISER',
  'HOD',
  'ACADEMIC_DEAN',
  'ADMISSION_DEAN',
  'IQAC_DEAN',
  'COE',
  'VICE_PRINCIPAL',
  'VP',
  'PRINCIPAL',
  'SUPER_ADMIN',
  'COLLEGE_ADMIN',
];

const OPERATIONAL_ROLES = [
  'ACCOUNTANT',
  'ACCOUNTS_STAFF',
  'ACCOUNTS_OFFICER',
  'AO',
  'HR',
  'OFFICE',
  'ADMINISTRATION',
  'LIBRARIAN',
  'LIBRARY',
  'HOSTEL_WARDEN',
  'HOSTEL',
  'TRANSPORT_MANAGER',
  'TRANSPORT',
  'PLACEMENT_OFFICER',
  'PLACEMENT',
  'COLLEGE_OPERATIONS',
  'COLLEGE_ADMIN',
  'SUPER_ADMIN',
];

const STAFF_SUITE_ROLES = Array.from(new Set([...ACADEMIC_STAFF_ROLES, ...OPERATIONAL_ROLES]));

const ALL_ROLES = [
  'STUDENT',
  'PARENT',
  ...STAFF_SUITE_ROLES,
];

const APP_DEFINITIONS: CampusSuiteAppDefinition[] = [
  // ── Productivity ──────────────────────────────────────────────────────────
  {
    id: 'drive',
    name: 'Campus Drive',
    shortName: 'Drive',
    description: 'Institutional files, folders, shared records, and department storage.',
    category: 'Productivity',
    icon: 'HardDrive',
    path: '/workspace/drive',
    keywords: ['files', 'folders', 'storage', 'shared'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: ALL_ROLES,
  },
  {
    id: 'docs',
    name: 'Campus Docs',
    shortName: 'Docs',
    description: 'Create, review, share, version, and export institutional documents.',
    category: 'Productivity',
    icon: 'FileText',
    path: '/workspace?type=DOC',
    keywords: ['document', 'word', 'report', 'minutes'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: STAFF_SUITE_ROLES,
  },
  {
    id: 'sheets',
    name: 'Campus Sheets',
    shortName: 'Sheets',
    description: 'Work with academic datasets, tables, formulas, charts, and exports.',
    category: 'Productivity',
    icon: 'Table2',
    path: '/workspace?type=SHEET',
    keywords: ['spreadsheet', 'xlsx', 'csv', 'marks', 'attendance'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: STAFF_SUITE_ROLES,
  },
  {
    id: 'slides',
    name: 'Campus Slides',
    shortName: 'Slides',
    description: 'Build and export presentations for teaching, reviews, and events.',
    category: 'Productivity',
    icon: 'Presentation',
    path: '/workspace?type=SLIDE',
    keywords: ['presentation', 'pptx', 'seminar'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: ACADEMIC_STAFF_ROLES,
  },
  {
    id: 'forms',
    name: 'Campus Forms',
    shortName: 'Forms',
    description: 'Create forms and quizzes, publish them, and review responses.',
    category: 'Productivity',
    icon: 'ClipboardList',
    path: '/workspace?type=FORM',
    keywords: ['survey', 'feedback', 'quiz', 'responses'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: STAFF_SUITE_ROLES,
  },
  {
    id: 'notes',
    name: 'Campus Notes',
    shortName: 'Notes',
    description: 'Keep structured personal and shared academic notes.',
    category: 'Productivity',
    icon: 'NotebookPen',
    path: '/workspace?type=NOTE',
    keywords: ['notebook', 'study', 'meeting notes'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: ACADEMIC_STAFF_ROLES,
  },
  {
    id: 'workspace-reports',
    name: 'Campus Reports',
    shortName: 'Reports',
    description: 'Create governed reports from institutional data.',
    category: 'Productivity',
    icon: 'FileBarChart',
    path: '/workspace?type=REPORT',
    keywords: ['analytics', 'export', 'institution report'],
    featureFlag: 'MODULE_CAMPUS_WORKSPACE_ENABLED',
    roles: STAFF_SUITE_ROLES,
  },

  // ── Communication ─────────────────────────────────────────────────────────
  {
    id: 'announcements',
    name: 'Campus Announcements',
    shortName: 'Announcements',
    description: 'Read institutional circulars and role-scoped announcements.',
    category: 'Communication',
    icon: 'Megaphone',
    path: '/circulars',
    rolePaths: {
      STUDENT: '/student/circulars',
      PARENT: '/parent/circulars',
    },
    keywords: ['circular', 'notice', 'news'],
    featureFlag: 'MODULE_CIRCULARS_ENABLED',
    roles: ALL_ROLES,
  },
  {
    id: 'notifications',
    name: 'Notification Center',
    shortName: 'Notifications',
    description: 'Review workflow, academic, communication, and system alerts.',
    category: 'Communication',
    icon: 'Bell',
    path: '/notifications',
    rolePaths: {
      STUDENT: '/student/notifications',
    },
    keywords: ['alerts', 'updates', 'inbox'],
    roles: ALL_ROLES,
  },
  {
    id: 'chat',
    name: 'Campus Chat',
    shortName: 'Chat',
    description: 'Role-authorized WhatsApp-like 1:1 and section group communication.',
    category: 'Communication',
    icon: 'MessagesSquare',
    path: '/chat',
    rolePaths: {
      STUDENT: '/student/messages',
      PARENT: '/parent/messages',
      MENTOR: '/mentor/messages',
    },
    roles: ALL_ROLES,
    keywords: ['message', 'conversation', 'groups', 'chat'],
  },
  {
    id: 'calendar',
    name: 'Campus Calendar',
    shortName: 'Calendar',
    description: 'Academic schedule, timetables, events, and deadlines.',
    category: 'Calendar',
    icon: 'CalendarDays',
    path: '/calendar',
    rolePaths: {
      STUDENT: '/student/calendar',
    },
    roles: ALL_ROLES,
    keywords: ['schedule', 'events', 'deadline', 'timetable'],
  },

  // ── Operational Modules ───────────────────────────────────────────────────
  {
    id: 'transport',
    name: 'Transport Management',
    shortName: 'Transport',
    description: 'Fleet routes, live vehicle GPS tracking, and student bus passes.',
    category: 'Operations',
    icon: 'Bus',
    path: '/transport',
    rolePaths: {
      STUDENT: '/student/transport',
      PARENT: '/parent/transport',
      TRANSPORT_MANAGER: '/transport',
      TRANSPORT_ADMIN: '/transport',
    },
    roles: ['STUDENT', 'PARENT', 'TRANSPORT_MANAGER', 'TRANSPORT_ADMIN', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['bus', 'route', 'tracking', 'gps', 'driver', 'pickup'],
  },
  {
    id: 'hostel',
    name: 'Hostel Management',
    shortName: 'Hostel',
    description: 'Residential blocks, room allocations, mess, and outing passes.',
    category: 'Operations',
    icon: 'Building',
    path: '/hostel',
    rolePaths: {
      STUDENT: '/student/hostel',
      HOSTEL_WARDEN: '/hostel',
    },
    roles: ['STUDENT', 'HOSTEL_WARDEN', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['hostel', 'room', 'bed', 'mess', 'outing', 'warden'],
  },
  {
    id: 'library',
    name: 'Library Management',
    shortName: 'Library',
    description: 'Book catalog, digital resources, reservations, and circulation.',
    category: 'Operations',
    icon: 'BookOpen',
    path: '/library',
    rolePaths: {
      STUDENT: '/student/library',
      LIBRARIAN: '/library',
    },
    roles: ['STUDENT', 'FACULTY', 'LIBRARIAN', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['books', 'library', 'catalog', 'issue', 'return'],
  },
  {
    id: 'placement',
    name: 'Placement Engine',
    shortName: 'Placement',
    description: 'Campus recruitment drives, student eligibility, and job offers.',
    category: 'Operations',
    icon: 'Briefcase',
    path: '/placements',
    rolePaths: {
      STUDENT: '/student/placements',
      PLACEMENT_OFFICER: '/placements',
    },
    roles: ['STUDENT', 'PLACEMENT_OFFICER', 'SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'],
    keywords: ['jobs', 'careers', 'interview', 'recruitment', 'offers'],
  },
  {
    id: 'finance-accountant',
    name: 'Finance Collections',
    shortName: 'Accounts',
    description: 'Daily student fee collections, receipts, and offline payment recording.',
    category: 'Operations',
    icon: 'IndianRupee',
    path: '/accountant/dashboard',
    roles: ['ACCOUNTANT', 'ACCOUNTS_STAFF', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['finance', 'fees', 'receipts', 'collection', 'ledger'],
  },
  {
    id: 'finance-ao',
    name: 'Finance Control & Approvals',
    shortName: 'AO Control',
    description: 'Administrative financial control, refunds, waivers, and closing approvals.',
    category: 'Operations',
    icon: 'ShieldCheck',
    path: '/ao/dashboard',
    roles: ['ACCOUNTS_OFFICER', 'AO', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['approvals', 'closings', 'waivers', 'refunds', 'budget'],
  },
  {
    id: 'office',
    name: 'Campus Office',
    shortName: 'Office',
    description: 'Bonafide, Conduct certificates, TC, and student documentation.',
    category: 'Operations',
    icon: 'Building2',
    path: '/office',
    roles: ['OFFICE', 'ADMINISTRATION', 'SUPER_ADMIN', 'COLLEGE_ADMIN', 'ADMINISTRATION_DEAN'],
    keywords: ['certificate', 'bonafide', 'tc', 'records'],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    shortName: 'HR',
    description: 'Faculty and staff master directory, service history, and profiles.',
    category: 'Operations',
    icon: 'Users',
    path: '/hr',
    roles: ['HR', 'SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL'],
    keywords: ['employees', 'staff', 'faculty', 'service history'],
  },
  {
    id: 'purchase',
    name: 'Purchase & Procurement',
    shortName: 'Purchase',
    description: 'Purchase requests, quotations, orders, and vendor invoices.',
    category: 'Operations',
    icon: 'ShoppingCart',
    path: '/purchase',
    roles: ['PURCHASE_OFFICER', 'SUPER_ADMIN', 'COLLEGE_ADMIN', 'AO', 'ACCOUNTS_OFFICER'],
    keywords: ['purchase', 'vendor', 'quotation', 'procurement'],
  },
  {
    id: 'inventory',
    name: 'Asset & Inventory',
    shortName: 'Inventory',
    description: 'Institutional asset tracking, department stock, and equipment logs.',
    category: 'Operations',
    icon: 'Package',
    path: '/inventory',
    roles: ['INVENTORY_MANAGER', 'SUPER_ADMIN', 'COLLEGE_ADMIN', 'AO'],
    keywords: ['assets', 'equipment', 'stock', 'items'],
  },
  {
    id: 'maintenance',
    name: 'Facility Maintenance',
    shortName: 'Maintenance',
    description: 'Campus maintenance work orders, breakdown tickets, and repairs.',
    category: 'Operations',
    icon: 'Wrench',
    path: '/maintenance',
    roles: ['MAINTENANCE_MANAGER', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['repair', 'breakdown', 'service', 'facility'],
  },
  {
    id: 'research',
    name: 'Research & Publications',
    shortName: 'Research',
    description: 'Faculty journal publications, patents, funded grants, and citations.',
    category: 'Academic',
    icon: 'BookMarked',
    path: '/research',
    roles: ['FACULTY', 'HOD', 'ACADEMIC_DEAN', 'IQAC_DEAN', 'SUPER_ADMIN'],
    keywords: ['journals', 'patents', 'grants', 'publications'],
  },
  {
    id: 'scholarships',
    name: 'Scholarship Portal',
    shortName: 'Scholarships',
    description: 'Government and institutional merit scholarship applications.',
    category: 'Academic',
    icon: 'Award',
    path: '/scholarships',
    rolePaths: {
      STUDENT: '/student/scholarships',
    },
    roles: ['STUDENT', 'ACCOUNTANT', 'AO', 'SUPER_ADMIN', 'COLLEGE_ADMIN'],
    keywords: ['scholarship', 'merit', 'concession', 'grant'],
  },

  // ── Administration & Intelligence ─────────────────────────────────────────
  {
    id: 'ai',
    name: 'GEETORUS AI',
    shortName: 'AI',
    description: 'Use the role-scoped academic assistant with server-enforced data access.',
    category: 'Intelligence',
    icon: 'Sparkles',
    path: '/student/ai-assistant',
    rolePaths: {
      STUDENT: '/student/ai-assistant',
    },
    roles: ALL_ROLES,
    keywords: ['assistant', 'adviser', 'analysis'],
    featureFlag: 'MODULE_AI_ASSISTANT_ENABLED',
  },
  {
    id: 'admin-center',
    name: 'Campus Admin',
    shortName: 'Admin',
    description: 'Manage identities, workspaces, institutional configuration, and operations.',
    category: 'Administration',
    icon: 'Settings2',
    path: '/admin/control-center',
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN'],
    permissionAny: ['settings:read', 'users:read', 'roles:read'],
    keywords: ['users', 'roles', 'settings', 'configuration'],
  },
  {
    id: 'security',
    name: 'Campus Security',
    shortName: 'Security',
    description: 'Review access activity, security events, and institutional audit records.',
    category: 'Administration',
    icon: 'Fingerprint',
    path: '/security-logs',
    roles: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'SECURITY_OFFICER'],
    permissionAny: ['audit:read', 'audit_logs:view'],
    keywords: ['audit', 'login', 'session', 'access'],
  },
];

function resolvePath(definition: CampusSuiteAppDefinition, role: string): string | undefined {
  return definition.rolePaths?.[role] ?? definition.path;
}

export async function listCampusSuiteApps(
  context: CampusSuiteAccessContext,
  isFeatureEnabled: (flag: string) => Promise<boolean> = FeatureFlags.isEnabled
): Promise<CampusSuiteApp[]> {
  const role = normalizeRole(context.role);
  const requiredFlags = Array.from(
    new Set(APP_DEFINITIONS.flatMap((app) => (app.featureFlag ? [app.featureFlag] : [])))
  );
  const flagEntries = await Promise.all(
    requiredFlags.map(async (flag) => [flag, await isFeatureEnabled(flag)] as const)
  );
  const flags = new Map(flagEntries);

  return APP_DEFINITIONS.flatMap((definition) => {
    if (definition.roles && !definition.roles.includes(role)) return [];
    if (definition.featureFlag && flags.get(definition.featureFlag) === false) return [];
    if (
      definition.permissionAny &&
      !definition.permissionAny.some((permission) => checkPermission(context.permissions, permission))
    ) {
      return [];
    }

    const path = resolvePath(definition, role);
    if (!path) return [];

    const {
      rolePaths: _rolePaths,
      roles: _roles,
      featureFlag: _featureFlag,
      permissionAny: _permissionAny,
      ...app
    } = definition;
    return [{ ...app, path }];
  });
}
