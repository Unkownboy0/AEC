/*
  CAMPUSOS ICON MAP — Central module-to-icon registry
  
  Every module must use the same icon everywhere:
  Sidebar, Quick Action, Mobile More page, Empty State,
  Search Results, Page Header, Notification Category.
  
  Icon library: lucide-react (already integrated)
  Standard stroke: 1.75 (set via AppIcon component)
*/

export const moduleIconMap = {
  // Core Navigation
  dashboard: 'LayoutDashboard',
  home: 'House',
  search: 'Search',
  notifications: 'Bell',
  profile: 'UserRound',
  settings: 'Settings',
  help: 'CircleHelp',
  more: 'Grid3x3',

  // Academic Modules
  timetable: 'CalendarDays',
  attendance: 'ClipboardCheck',
  assignments: 'FileText',
  marks: 'ChartNoAxesColumnIncreasing',
  examinations: 'NotebookTabs',
  subjects: 'BookOpen',
  results: 'ChartNoAxesColumnIncreasing',
  academics: 'GraduationCap',
  syllabus: 'BookMarked',

  // Leave & Requests
  leave: 'CalendarOff',
  od: 'BadgeCheck',
  requests: 'ClipboardList',

  // People
  students: 'GraduationCap',
  faculty: 'Users',
  parents: 'Users',
  mentors: 'Heart',
  staff: 'UsersRound',

  // Administration
  departments: 'Building2',
  approvals: 'CircleCheckBig',
  tasks: 'ListChecks',
  circulars: 'Megaphone',
  messages: 'MessageSquare',
  complaints: 'MessageCircleWarning',
  announcements: 'BellRing',

  // Finance
  fees: 'IndianRupee',
  payments: 'CreditCard',
  scholarships: 'Award',

  // Infrastructure
  transport: 'Bus',
  hostel: 'Building',
  library: 'LibraryBig',

  // Career
  placement: 'BriefcaseBusiness',
  internship: 'Building',
  jobs: 'Briefcase',

  // Analytics
  reports: 'ChartSpline',
  analytics: 'BarChart3',
  performance: 'TrendingUp',

  // System
  delegation: 'UserRoundCog',
  security: 'ShieldCheck',
  backup: 'DatabaseBackup',
  logs: 'ScrollText',
  roles: 'KeyRound',
  media: 'ImagePlay',

  // Status
  online: 'CircleDot',
  offline: 'CircleSlash',
  busy: 'CirclePause',
  available: 'CircleCheck',

  // Actions
  add: 'Plus',
  edit: 'Pencil',
  delete: 'Trash2',
  view: 'Eye',
  download: 'Download',
  upload: 'Upload',
  share: 'Share2',
  filter: 'SlidersHorizontal',
  sort: 'ArrowUpDown',
  refresh: 'RefreshCw',
  close: 'X',
  back: 'ChevronLeft',
  forward: 'ChevronRight',
  expand: 'Maximize2',
  collapse: 'Minimize2',
  menu: 'Menu',
  check: 'Check',
  alert: 'AlertTriangle',
  info: 'Info',
  lock: 'Lock',
  unlock: 'Unlock',
  calendar: 'Calendar',
  clock: 'Clock',
  location: 'MapPin',
  phone: 'Phone',
  email: 'Mail',
  link: 'Link',
  file: 'FileText',
  folder: 'Folder',
  image: 'Image',
  camera: 'Camera',
  print: 'Printer',
  qr: 'QrCode',
  idcard: 'CreditCard',
  availability: 'RadioTower',
} as const;

export type ModuleIconKey = keyof typeof moduleIconMap;

export function getModuleIconName(module: ModuleIconKey | string): string {
  return (moduleIconMap as Record<string, string>)[module] ?? 'LayoutDashboard';
}
