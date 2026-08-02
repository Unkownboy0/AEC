import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export const PERMISSION_GROUPS_DEF = [
  { name: 'Dashboard', code: 'DASHBOARD', description: 'System and Executive Dashboard Widgets', icon: 'LayoutDashboard', sortOrder: 1 },
  { name: 'Users', code: 'USERS', description: 'User Account Management & Roles', icon: 'UserCheck', sortOrder: 2 },
  { name: 'Students', code: 'STUDENTS', description: 'Student Profiles & Academic Records', icon: 'GraduationCap', sortOrder: 3 },
  { name: 'Faculty', code: 'FACULTY', description: 'Faculty Profiles & Teaching Assignments', icon: 'Briefcase', sortOrder: 4 },
  { name: 'Parents', code: 'PARENTS', description: 'Parent & Guardian Management', icon: 'Users', sortOrder: 5 },
  { name: 'Departments', code: 'DEPARTMENTS', description: 'Department Structure & Intake', icon: 'Building2', sortOrder: 6 },
  { name: 'Attendance', code: 'ATTENDANCE', description: 'Student & Staff Attendance Tracking', icon: 'CalendarCheck', sortOrder: 7 },
  { name: 'Marks', code: 'MARKS', description: 'Examinations, Internal & External Marks', icon: 'FileSpreadsheet', sortOrder: 8 },
  { name: 'Timetable', code: 'TIMETABLE', description: 'Master Schedules & Timetable Slots', icon: 'Clock', sortOrder: 9 },
  { name: 'Leave', code: 'LEAVE', description: 'Student & Faculty Leave Approvals', icon: 'FileText', sortOrder: 10 },
  { name: 'OD', code: 'OD', description: 'On-Duty Requests & Approval Workflows', icon: 'Award', sortOrder: 11 },
  { name: 'Fees', code: 'FEES', description: 'Fee Categories, Bills & Payment Records', icon: 'CreditCard', sortOrder: 12 },
  { name: 'Reports', code: 'REPORTS', description: 'Institutional & Analytical Reports', icon: 'BarChart3', sortOrder: 13 },
  { name: 'Tasks', code: 'TASKS', description: 'Task Management & Academic Assignments', icon: 'CheckSquare', sortOrder: 14 },
  { name: 'Notifications', code: 'NOTIFICATIONS', description: 'System Broadcasts & Custom Alerts', icon: 'Bell', sortOrder: 15 },
  { name: 'Circulars', code: 'CIRCULARS', description: 'Institutional Notices & Official Circulars', icon: 'FileStack', sortOrder: 16 },
  { name: 'Downloads', code: 'DOWNLOADS', description: 'Resource & File Downloads', icon: 'Download', sortOrder: 17 },
  { name: 'Exports', code: 'EXPORTS', description: 'Data Export Operations (CSV/PDF/XLSX)', icon: 'FileUp', sortOrder: 18 },
  { name: 'Analytics', code: 'ANALYTICS', description: 'Executive Analytics & Performance Insights', icon: 'PieChart', sortOrder: 19 },
  { name: 'Settings', code: 'SETTINGS', description: 'Global System & Database Settings', icon: 'Settings', sortOrder: 20 },
  { name: 'Approvals', code: 'APPROVALS', description: 'Multi-Level Approval Matrix & Decisions', icon: 'ShieldCheck', sortOrder: 21 },
];

export const PERMISSION_TYPES_DEF = [
  'view',
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'export',
  'download',
  'assign',
  'manage',
] as const;

export const CORE_ROLE_HIERARCHY = [
  { name: 'Super Admin', roleCode: 'SUPER_ADMIN', priority: 1, hierarchy: 1, color: '#ef4444', icon: 'ShieldAlert', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'Principal', roleCode: 'PRINCIPAL', priority: 2, hierarchy: 2, color: '#8b5cf6', icon: 'Crown', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'Vice Principal', roleCode: 'VICE_PRINCIPAL', priority: 3, hierarchy: 3, color: '#6366f1', icon: 'Award', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'Academic Dean', roleCode: 'ACADEMIC_DEAN', priority: 4, hierarchy: 4, color: '#3b82f6', icon: 'GraduationCap', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'Administration & Admission Dean', roleCode: 'ADMIN_DEAN', priority: 5, hierarchy: 5, color: '#0ea5e9', icon: 'Briefcase', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'IQAC Dean', roleCode: 'IQAC_DEAN', priority: 6, hierarchy: 6, color: '#06b6d4', icon: 'CheckCircle2', isSystem: true, searchScope: 'EVERYONE' },
  { name: 'HOD', roleCode: 'HOD', priority: 7, hierarchy: 7, color: '#10b981', icon: 'Users', isSystem: true, searchScope: 'OWN_DEPARTMENT' },
  { name: 'Faculty', roleCode: 'FACULTY', priority: 8, hierarchy: 8, color: '#84cc16', icon: 'BookOpen', isSystem: true, searchScope: 'ASSIGNED_STUDENTS' },
  { name: 'Mentor', roleCode: 'MENTOR', priority: 9, hierarchy: 9, color: '#eab308', icon: 'UserCheck', isSystem: true, searchScope: 'ASSIGNED_STUDENTS' },
  { name: 'Student', roleCode: 'STUDENT', priority: 10, hierarchy: 10, color: '#ec4899', icon: 'User', isSystem: true, searchScope: 'OWN_PROFILE' },
  { name: 'Parent', roleCode: 'PARENT', priority: 11, hierarchy: 11, color: '#f43f5e', icon: 'HeartHandshake', isSystem: true, searchScope: 'OWN_CHILD' },
];

export async function seedEnterpriseRBAC() {
  logger.info('🚀 Starting Enterprise Phase 1 RBAC Seeding...');

  // 1. Seed Permission Groups
  const groupMap = new Map<string, string>(); // code -> id
  for (const g of PERMISSION_GROUPS_DEF) {
    const group = await prisma.permissionGroup.upsert({
      where: { code: g.code },
      update: { name: g.name, description: g.description, icon: g.icon, sortOrder: g.sortOrder },
      create: { name: g.name, code: g.code, description: g.description, icon: g.icon, sortOrder: g.sortOrder },
    });
    groupMap.set(g.code, group.id);
  }
  logger.info(`✅ Seeded ${PERMISSION_GROUPS_DEF.length} Permission Groups`);

  // 2. Seed 210 Permissions (21 groups × 10 actions)
  const permMap = new Map<string, string>(); // "group_code:action" -> id
  let permCount = 0;

  for (const g of PERMISSION_GROUPS_DEF) {
    const groupCode = g.code.toLowerCase();
    const groupId = groupMap.get(g.code)!;

    for (const act of PERMISSION_TYPES_DEF) {
      const permName = `${groupCode}:${act}`;
      const perm = await prisma.permission.upsert({
        where: { name: permName },
        update: {
          module: g.code,
          action: act.toUpperCase(),
          description: `${act.toUpperCase()} permission for ${g.name} module`,
          groupId,
        },
        create: {
          name: permName,
          module: g.code,
          action: act.toUpperCase(),
          description: `${act.toUpperCase()} permission for ${g.name} module`,
          groupId,
        },
      });
      permMap.set(permName, perm.id);
      permCount++;
    }
  }
  logger.info(`✅ Seeded ${permCount} Granular Permissions`);

  // 3. Seed Core Roles & RolePermissions
  for (const r of CORE_ROLE_HIERARCHY) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {
        roleCode: r.roleCode,
        priority: r.priority,
        hierarchy: r.hierarchy,
        color: r.color,
        icon: r.icon,
        isSystem: r.isSystem,
        searchScope: r.searchScope,
      },
      create: {
        name: r.name,
        roleCode: r.roleCode,
        priority: r.priority,
        hierarchy: r.hierarchy,
        color: r.color,
        icon: r.icon,
        isSystem: r.isSystem,
        searchScope: r.searchScope,
        description: `${r.name} Enterprise Role`,
      },
    });

    // Determine permissions for this role
    const assignedPermIds: string[] = [];

    PERMISSION_GROUPS_DEF.forEach((g) => {
      const groupCode = g.code.toLowerCase();

      PERMISSION_TYPES_DEF.forEach((act) => {
        const permKey = `${groupCode}:${act}`;
        const permId = permMap.get(permKey);
        if (!permId) return;

        let shouldGrant = false;

        switch (r.roleCode) {
          case 'SUPER_ADMIN':
            shouldGrant = true; // Everything
            break;

          case 'PRINCIPAL':
            // Everything except System Settings & Database write
            if (g.code === 'SETTINGS' && (act === 'manage' || act === 'delete')) {
              shouldGrant = false;
            } else {
              shouldGrant = true;
            }
            break;

          case 'VICE_PRINCIPAL':
            // Placement, Training, Internships, Career, Industry Collaboration, Reports, Approvals, Dashboard
            if (['DASHBOARD', 'REPORTS', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS', 'EXPORTS', 'ANALYTICS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = ['view', 'approve', 'reject', 'export', 'download'].includes(act);
            }
            break;

          case 'ACADEMIC_DEAN':
            // Academic Modules only
            if (['DASHBOARD', 'STUDENTS', 'FACULTY', 'DEPARTMENTS', 'ATTENDANCE', 'MARKS', 'TIMETABLE', 'LEAVE', 'OD', 'REPORTS', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS', 'EXPORTS', 'ANALYTICS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = act !== 'delete';
            }
            break;

          case 'ADMIN_DEAN':
            // Administration Modules only
            if (['DASHBOARD', 'USERS', 'STUDENTS', 'FACULTY', 'PARENTS', 'DEPARTMENTS', 'LEAVE', 'OD', 'FEES', 'REPORTS', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS', 'EXPORTS', 'SETTINGS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = act !== 'delete';
            }
            break;

          case 'IQAC_DEAN':
            // Quality Modules only
            if (['DASHBOARD', 'REPORTS', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS', 'EXPORTS', 'ANALYTICS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = ['view', 'create', 'update', 'approve', 'reject', 'export', 'download'].includes(act);
            }
            break;

          case 'HOD':
            // Own Department - full departmental access
            if (['DASHBOARD', 'USERS', 'STUDENTS', 'FACULTY', 'PARENTS', 'DEPARTMENTS', 'ATTENDANCE', 'MARKS', 'TIMETABLE', 'LEAVE', 'OD', 'REPORTS', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS', 'EXPORTS', 'ANALYTICS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = act !== 'delete' || g.code === 'TASKS';
            }
            break;

          case 'FACULTY':
            // Own Classes, Students, Subjects
            if (['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'MARKS', 'TIMETABLE', 'LEAVE', 'OD', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS'].includes(g.code)) {
              shouldGrant = ['view', 'create', 'update', 'download'].includes(act);
            }
            break;

          case 'MENTOR':
            // Assigned Students only
            if (['STUDENTS', 'ATTENDANCE', 'MARKS', 'LEAVE', 'OD', 'TASKS', 'NOTIFICATIONS', 'CIRCULARS', 'APPROVALS'].includes(g.code)) {
              shouldGrant = ['view', 'approve', 'reject', 'create', 'update'].includes(act);
            }
            break;

          case 'STUDENT':
            // Own Data only
            if (['DASHBOARD', 'ATTENDANCE', 'MARKS', 'TIMETABLE', 'LEAVE', 'OD', 'FEES', 'NOTIFICATIONS', 'CIRCULARS', 'DOWNLOADS'].includes(g.code)) {
              shouldGrant = ['view', 'create', 'download'].includes(act);
            }
            break;

          case 'PARENT':
            // Own Child only
            if (['DASHBOARD', 'ATTENDANCE', 'MARKS', 'FEES', 'NOTIFICATIONS', 'CIRCULARS'].includes(g.code)) {
              shouldGrant = ['view', 'download'].includes(act);
            }
            break;

          default:
            shouldGrant = act === 'view';
            break;
        }

        if (shouldGrant) {
          assignedPermIds.push(permId);
        }
      });
    });

    // Clear and recreate RolePermission links
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: assignedPermIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    });

    logger.info(`🔑 Role '${r.name}' assigned ${assignedPermIds.length} permissions.`);
  }

  logger.info('🎉 Enterprise Phase 1 RBAC Seeding Completed Successfully!');
}
