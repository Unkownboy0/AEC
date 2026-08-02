import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { broadcastRBACUpdate } from '../../lib/socket';
import bcrypt from 'bcryptjs';

export const PERMISSION_ACTIONS = [
  'view', 'create', 'edit', 'delete', 'approve', 'reject',
  'assign', 'transfer', 'upload', 'download', 'export', 'import',
  'print', 'share', 'archive', 'restore', 'ai_access', 'analytics',
  'reports', 'audit_logs', 'settings', 'api_access', 'mobile_access'
] as const;

export const DEFAULT_MODULES = [
  'Academics', 'Curriculum', 'Attendance', 'Assignments', 'Exams',
  'Placement', 'Library', 'Hostel', 'Transport', 'Sports',
  'Finance', 'Administration', 'IQAC', 'Reports', 'Users',
  'Settings', 'Workflow', 'AI', 'AuditLogs'
];

export const DEFAULT_31_ROLES = [
  { name: 'Super Admin', roleCode: 'SUPER_ADMIN', priority: 1, hierarchy: 1, color: '#ef4444', icon: 'ShieldAlert', searchScope: 'EVERYONE' },
  { name: 'College Admin', roleCode: 'COLLEGE_ADMIN', priority: 2, hierarchy: 2, color: '#f97316', icon: 'Building', searchScope: 'EVERYONE' },
  { name: 'Principal', roleCode: 'PRINCIPAL', priority: 3, hierarchy: 3, color: '#8b5cf6', icon: 'Crown', searchScope: 'EVERYONE' },
  { name: 'Vice Principal', roleCode: 'VICE_PRINCIPAL', priority: 4, hierarchy: 4, color: '#6366f1', icon: 'Award', searchScope: 'EVERYONE' },
  { name: 'Academic Dean', roleCode: 'ACADEMIC_DEAN', priority: 5, hierarchy: 5, color: '#3b82f6', icon: 'GraduationCap', searchScope: 'EVERYONE' },
  { name: 'Administration & Admission Dean', roleCode: 'ADMIN_DEAN', priority: 6, hierarchy: 6, color: '#0ea5e9', icon: 'Briefcase', searchScope: 'EVERYONE' },
  { name: 'IQAC Dean', roleCode: 'IQAC_DEAN', priority: 7, hierarchy: 7, color: '#06b6d4', icon: 'CheckCircle2', searchScope: 'EVERYONE' },
  { name: 'HOD', roleCode: 'HOD', priority: 8, hierarchy: 8, color: '#10b981', icon: 'Users', searchScope: 'OWN_DEPARTMENT' },
  { name: 'Faculty', roleCode: 'FACULTY', priority: 9, hierarchy: 9, color: '#84cc16', icon: 'BookOpen', searchScope: 'ASSIGNED_STUDENTS' },
  { name: 'Mentor', roleCode: 'MENTOR', priority: 10, hierarchy: 10, color: '#eab308', icon: 'UserCheck', searchScope: 'ASSIGNED_STUDENTS' },
  { name: 'Student', roleCode: 'STUDENT', priority: 11, hierarchy: 11, color: '#ec4899', icon: 'User', searchScope: 'OWN_PROFILE' },
  { name: 'Parent', roleCode: 'PARENT', priority: 12, hierarchy: 12, color: '#f43f5e', icon: 'HeartHandshake', searchScope: 'OWN_CHILD' },
  { name: 'Accounts Officer', roleCode: 'ACCOUNTS_OFFICER', priority: 13, hierarchy: 13, color: '#14b8a6', icon: 'Receipt', searchScope: 'EVERYONE' },
  { name: 'Accounts Staff', roleCode: 'ACCOUNTS_STAFF', priority: 14, hierarchy: 14, color: '#2dd4bf', icon: 'DollarSign', searchScope: 'OWN_DEPARTMENT' },
  { name: 'Controller of Examination', roleCode: 'COE', priority: 15, hierarchy: 15, color: '#a855f7', icon: 'FileCheck', searchScope: 'EVERYONE' },
  { name: 'Assistant Controller of Examination', roleCode: 'ACOE', priority: 16, hierarchy: 16, color: '#c084fc', icon: 'FileText', searchScope: 'EVERYONE' },
  { name: 'Exam Cell Staff', roleCode: 'EXAM_STAFF', priority: 17, hierarchy: 17, color: '#d8b4fe', icon: 'FileSpreadsheet', searchScope: 'EVERYONE' },
  { name: 'Placement Officer', roleCode: 'PLACEMENT_OFFICER', priority: 18, hierarchy: 18, color: '#38bdf8', icon: 'Target', searchScope: 'EVERYONE' },
  { name: 'Placement Coordinator', roleCode: 'PLACEMENT_COORDINATOR', priority: 19, hierarchy: 19, color: '#7dd3fc', icon: 'Send', searchScope: 'EVERYONE' },
  { name: 'Librarian', roleCode: 'LIBRARIAN', priority: 20, hierarchy: 20, color: '#fb923c', icon: 'BookMarked', searchScope: 'EVERYONE' },
  { name: 'Library Staff', roleCode: 'LIBRARY_STAFF', priority: 21, hierarchy: 21, color: '#ffb703', icon: 'Book', searchScope: 'EVERYONE' },
  { name: 'Hostel Warden', roleCode: 'HOSTEL_WARDEN', priority: 22, hierarchy: 22, color: '#f472b6', icon: 'Home', searchScope: 'EVERYONE' },
  { name: 'Hostel Staff', roleCode: 'HOSTEL_STAFF', priority: 23, hierarchy: 23, color: '#fbcfe8', icon: 'Key', searchScope: 'OWN_DEPARTMENT' },
  { name: 'Transport Manager', roleCode: 'TRANSPORT_MANAGER', priority: 24, hierarchy: 24, color: '#4ade80', icon: 'Truck', searchScope: 'EVERYONE' },
  { name: 'Transport Staff', roleCode: 'TRANSPORT_STAFF', priority: 25, hierarchy: 25, color: '#86efac', icon: 'Navigation', searchScope: 'OWN_DEPARTMENT' },
  { name: 'Sports Director', roleCode: 'SPORTS_DIRECTOR', priority: 26, hierarchy: 26, color: '#ef4444', icon: 'Trophy', searchScope: 'EVERYONE' },
  { name: 'Physical Director', roleCode: 'PHYSICAL_DIRECTOR', priority: 27, hierarchy: 27, color: '#f97316', icon: 'Activity', searchScope: 'EVERYONE' },
  { name: 'Sports Coach', roleCode: 'SPORTS_COACH', priority: 28, hierarchy: 28, color: '#fbbf24', icon: 'Dumbbell', searchScope: 'EVERYONE' },
  { name: 'Office Superintendent', roleCode: 'OFFICE_SUPERINTENDENT', priority: 29, hierarchy: 29, color: '#94a3b8', icon: 'FileStack', searchScope: 'EVERYONE' },
  { name: 'Office Staff', roleCode: 'OFFICE_STAFF', priority: 30, hierarchy: 30, color: '#cbd5e1', icon: 'Folder', searchScope: 'OWN_DEPARTMENT' },
  { name: 'Receptionist', roleCode: 'RECEPTIONIST', priority: 31, hierarchy: 31, color: '#e2e8f0', icon: 'PhoneCall', searchScope: 'EVERYONE' },
];

export class RbacService {
  /**
   * Auto-seed default 31 roles if missing
   */
  async seedDefaultRoles() {
    const db = prisma as any;
    for (const r of DEFAULT_31_ROLES) {
      const existing = await db.role.findFirst({
        where: { OR: [{ name: r.name }, { roleCode: r.roleCode }] }
      });

      const defaultModuleAccess: Record<string, Record<string, boolean>> = {};
      DEFAULT_MODULES.forEach(mod => {
        defaultModuleAccess[mod] = {};
        PERMISSION_ACTIONS.forEach(act => {
          if (r.roleCode === 'SUPER_ADMIN') {
            defaultModuleAccess[mod][act] = true;
          } else if (r.roleCode === 'COLLEGE_ADMIN' || r.roleCode === 'PRINCIPAL') {
            defaultModuleAccess[mod][act] = act !== 'settings';
          } else {
            defaultModuleAccess[mod][act] = ['view', 'reports', 'mobile_access'].includes(act);
          }
        });
      });

      const defaultSidebarConfig = {
        academics: true,
        attendance: true,
        assignments: true,
        results: true,
        leave: true,
        placement: true,
        library: true,
        sports: true,
        hostel: r.roleCode.includes('HOSTEL') || r.roleCode.includes('ADMIN'),
        transport: r.roleCode.includes('TRANSPORT') || r.roleCode.includes('ADMIN'),
        finance: r.roleCode.includes('ACCOUNTS') || r.roleCode.includes('ADMIN'),
      };

      const defaultDashboardConfig = {
        widgets: [
          { id: 'stats_overview', visible: true, editable: false, configurable: true },
          { id: 'recent_activities', visible: true, editable: false, configurable: true },
          { id: 'attendance_chart', visible: true, editable: true, configurable: true },
          { id: 'notifications_panel', visible: true, editable: true, configurable: true },
          { id: 'quick_actions', visible: true, editable: true, configurable: true },
        ]
      };

      if (!existing) {
        await db.role.create({
          data: {
            name: r.name,
            roleCode: r.roleCode,
            priority: r.priority,
            hierarchy: r.hierarchy,
            color: r.color,
            icon: r.icon,
            isSystem: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT'].includes(r.roleCode),
            searchScope: r.searchScope,
            moduleAccess: JSON.stringify(defaultModuleAccess),
            sidebarConfig: JSON.stringify(defaultSidebarConfig),
            dashboardConfig: JSON.stringify(defaultDashboardConfig),
            workspaceAccess: JSON.stringify([r.name + ' Workspace']),
            status: 'ACTIVE'
          }
        });
      }
    }
  }

  /**
   * Get complete master role permission matrix
   */
  async getMasterMatrix() {
    await this.seedDefaultRoles();
    const db = prisma as any;
    const roles = await db.role.findMany({
      orderBy: { priority: 'asc' },
      include: {
        _count: { select: { users: true } }
      }
    });

    return roles.map((r: any) => ({
      ...r,
      moduleAccess: r.moduleAccess ? JSON.parse(r.moduleAccess) : {},
      sidebarConfig: r.sidebarConfig ? JSON.parse(r.sidebarConfig) : {},
      dashboardConfig: r.dashboardConfig ? JSON.parse(r.dashboardConfig) : {},
      workspaceAccess: r.workspaceAccess ? JSON.parse(r.workspaceAccess) : [],
    }));
  }

  /**
   * Get all enterprise permission groups with permission counts
   */
  async getPermissionGroups() {
    return prisma.permissionGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        permissions: {
          select: { id: true, name: true, action: true, description: true },
        },
      },
    });
  }

  /**
   * Get Permission Audit Logs (denied & modified events)
   */
  async getPermissionAuditLogs(params: { limit?: number; userId?: string; action?: string }) {
    return prisma.permissionAudit.findMany({
      where: {
        ...(params.userId ? { userId: params.userId } : {}),
        ...(params.action ? { action: params.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });
  }

  /**
   * Log RBAC Audit Event
   */
  async logAudit(entityType: string, entityId: string, action: string, oldValue: any, newValue: any, changedBy: string, reason?: string) {
    const db = prisma as any;
    if (!db.rbacAuditLog) return null;
    return db.rbacAuditLog.create({
      data: {
        entityType,
        entityId,
        action,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        changedBy,
        reason,
      }
    });
  }

  /**
   * Create custom role
   */
  async createRole(data: any, createdBy: string) {
    const db = prisma as any;
    const existing = await db.role.findFirst({
      where: { OR: [{ name: data.name }, { roleCode: data.roleCode }] }
    });
    if (existing) throw new BadRequestException('Role name or code already exists');

    const role = await db.role.create({
      data: {
        name: data.name,
        roleCode: data.roleCode || data.name.toUpperCase().replace(/\s+/g, '_'),
        description: data.description,
        color: data.color || '#6366f1',
        icon: data.icon || 'Shield',
        priority: data.priority || 50,
        hierarchy: data.hierarchy || 50,
        departmentId: data.departmentId || null,
        searchScope: data.searchScope || 'OWN_DEPARTMENT',
        moduleAccess: JSON.stringify(data.moduleAccess || {}),
        sidebarConfig: JSON.stringify(data.sidebarConfig || {}),
        dashboardConfig: JSON.stringify(data.dashboardConfig || {}),
        workspaceAccess: JSON.stringify(data.workspaceAccess || [data.name + ' Workspace']),
        status: 'ACTIVE',
        createdBy,
      }
    });

    await this.logAudit('ROLE', role.id, 'CREATE', null, role, createdBy, data.reason || 'Created custom role');
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId: role.id });
    return role;
  }

  /**
   * Rename role
   */
  async renameRole(roleId: string, newName: string, changedBy: string) {
    const db = prisma as any;
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System protected roles cannot be renamed');

    const updated = await db.role.update({
      where: { id: roleId },
      data: { name: newName }
    });

    await this.logAudit('ROLE', roleId, 'UPDATE', { name: role.name }, { name: newName }, changedBy, 'Renamed role');
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId });
    return updated;
  }

  /**
   * Delete or deactivate role
   */
  async deleteRole(roleId: string, changedBy: string) {
    const db = prisma as any;
    const role = await db.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } }
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    if (role._count.users > 0) throw new BadRequestException(`Cannot delete role assigned to ${role._count.users} users. Reassign users first.`);

    await db.role.delete({ where: { id: roleId } });
    await this.logAudit('ROLE', roleId, 'DELETE', role, null, changedBy, 'Deleted role');
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId });
    return { success: true };
  }

  /**
   * Clone role
   */
  async cloneRole(sourceRoleId: string, newRoleName: string, newRoleCode: string, createdBy: string) {
    const db = prisma as any;
    const source = await db.role.findUnique({ where: { id: sourceRoleId } });
    if (!source) throw new NotFoundException('Source role not found');

    const cloned = await db.role.create({
      data: {
        name: newRoleName,
        roleCode: newRoleCode || newRoleName.toUpperCase().replace(/\s+/g, '_'),
        description: `Cloned from ${source.name}. ${source.description || ''}`,
        color: source.color,
        icon: source.icon,
        priority: source.priority + 1,
        hierarchy: source.hierarchy,
        searchScope: source.searchScope,
        moduleAccess: source.moduleAccess,
        sidebarConfig: source.sidebarConfig,
        dashboardConfig: source.dashboardConfig,
        workspaceAccess: source.workspaceAccess,
        approvalLevels: source.approvalLevels,
        notificationSettings: source.notificationSettings,
        isSystem: false,
        status: 'ACTIVE',
        createdBy,
      }
    });

    await this.logAudit('ROLE', cloned.id, 'CLONE', { sourceRoleId }, cloned, createdBy, `Cloned from ${source.name}`);
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId: cloned.id });
    return cloned;
  }

  /**
   * Merge roles: move all users from sourceRoleId to targetRoleId, optionally delete source
   */
  async mergeRoles(sourceRoleId: string, targetRoleId: string, deleteSource: boolean, changedBy: string) {
    const db = prisma as any;
    const source = await db.role.findUnique({ where: { id: sourceRoleId }, include: { _count: { select: { users: true } } } });
    const target = await db.role.findUnique({ where: { id: targetRoleId } });

    if (!source || !target) throw new NotFoundException('Source or target role not found');

    // Move users
    await db.user.updateMany({
      where: { roleId: sourceRoleId },
      data: { roleId: targetRoleId }
    });

    if (deleteSource && !source.isSystem) {
      await db.role.delete({ where: { id: sourceRoleId } });
    }

    await this.logAudit('ROLE', targetRoleId, 'MERGE', { sourceRoleId, userCount: source._count.users }, { targetRoleId }, changedBy, `Merged ${source.name} into ${target.name}`);
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId: targetRoleId });
    return { success: true, movedUsers: source._count.users };
  }

  /**
   * Update full role configuration
   */
  async updateRoleConfig(roleId: string, data: any, changedBy: string) {
    const db = prisma as any;
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const updateData: any = {};
    if (data.moduleAccess) updateData.moduleAccess = JSON.stringify(data.moduleAccess);
    if (data.sidebarConfig) updateData.sidebarConfig = JSON.stringify(data.sidebarConfig);
    if (data.dashboardConfig) updateData.dashboardConfig = JSON.stringify(data.dashboardConfig);
    if (data.workspaceAccess) updateData.workspaceAccess = JSON.stringify(data.workspaceAccess);
    if (data.approvalLevels) updateData.approvalLevels = JSON.stringify(data.approvalLevels);
    if (data.notificationSettings) updateData.notificationSettings = JSON.stringify(data.notificationSettings);
    if (data.searchScope) updateData.searchScope = data.searchScope;
    if (data.color) updateData.color = data.color;
    if (data.icon) updateData.icon = data.icon;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;

    const updated = await db.role.update({
      where: { id: roleId },
      data: updateData
    });

    await this.logAudit('ROLE', roleId, 'UPDATE_CONFIG', role, updated, changedBy, data.reason || 'Updated role config');
    broadcastRBACUpdate({ type: 'PERMISSIONS_UPDATED', roleId });
    return updated;
  }

  /**
   * Bulk user role assignment
   */
  async bulkRoleAssignment(userIds: string[], roleId: string, changedBy: string) {
    const db = prisma as any;
    const role = await db.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Target role not found');

    await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { roleId }
    });

    await this.logAudit('USER', roleId, 'BULK_ROLE_ASSIGN', { userIdsCount: userIds.length }, { roleId: role.name }, changedBy, 'Bulk role assignment');
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', roleId });
    return { success: true, count: userIds.length };
  }

  /**
   * Bulk permission update across multiple roles
   */
  async bulkPermissionUpdate(roleIds: string[], moduleName: string, actionName: string, value: boolean, changedBy: string) {
    const db = prisma as any;
    const roles = await db.role.findMany({ where: { id: { in: roleIds } } });

    for (const r of roles) {
      const moduleAccess = r.moduleAccess ? JSON.parse(r.moduleAccess) : {};
      if (!moduleAccess[moduleName]) moduleAccess[moduleName] = {};
      moduleAccess[moduleName][actionName] = value;

      await db.role.update({
        where: { id: r.id },
        data: { moduleAccess: JSON.stringify(moduleAccess) }
      });
    }

    await this.logAudit('PERMISSION', moduleName, 'BULK_PERMISSION_UPDATE', { moduleName, actionName, value }, { roleIds }, changedBy, 'Bulk permission toggle');
    broadcastRBACUpdate({ type: 'PERMISSIONS_UPDATED' });
    return { success: true, updatedRoles: roleIds.length };
  }

  /**
   * Evaluate runtime user permission set, workspaces, sidebars & widgets
   */
  async evaluateUserRBAC(userId: string) {
    const db = prisma as any;
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) throw new NotFoundException('User not found');

    const role = user.role || {};
    const roleModuleAccess = role.moduleAccess ? JSON.parse(role.moduleAccess) : {};
    const roleSidebarConfig = role.sidebarConfig ? JSON.parse(role.sidebarConfig) : {};
    const roleDashboardConfig = role.dashboardConfig ? JSON.parse(role.dashboardConfig) : {};
    const userWorkspaces = user.workspaces ? JSON.parse(user.workspaces) : (role.workspaceAccess ? JSON.parse(role.workspaceAccess) : ['Default Workspace']);

    return {
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      roleId: user.roleId,
      roleName: role.name || 'User',
      roleCode: role.roleCode || 'USER',
      hierarchy: role.hierarchy || 99,
      designation: user.designation || role.name,
      departmentId: user.departmentId,
      reportingManagerId: user.reportingManagerId,
      searchScope: role.searchScope || 'EVERYONE',
      moduleAccess: roleModuleAccess,
      sidebarConfig: roleSidebarConfig,
      dashboardConfig: user.dashboardConfig ? JSON.parse(user.dashboardConfig) : roleDashboardConfig,
      workspaces: userWorkspaces,
      activeWorkspace: user.activeWorkspace || userWorkspaces[0] || 'Default Workspace',
      notificationPreferences: user.notificationPreferences ? JSON.parse(user.notificationPreferences) : {},
      isSuperAdmin: role.roleCode === 'SUPER_ADMIN'
    };
  }

  /**
   * Super Admin User Control Operations
   */
  async adminUpdateUser(targetUserId: string, data: any, adminUserId: string) {
    const db = prisma as any;
    const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const updateFields: any = {};
    if (data.status) updateFields.status = data.status; // ACTIVE, BLOCKED, INACTIVE, SUSPENDED
    if (data.roleId) updateFields.roleId = data.roleId;
    if (data.departmentId !== undefined) updateFields.departmentId = data.departmentId;
    if (data.designation !== undefined) updateFields.designation = data.designation;
    if (data.reportingManagerId !== undefined) updateFields.reportingManagerId = data.reportingManagerId;
    if (data.workspaces) updateFields.workspaces = JSON.stringify(data.workspaces);
    if (data.activeWorkspace) updateFields.activeWorkspace = data.activeWorkspace;
    if (data.newPassword) {
      updateFields.passwordHash = await bcrypt.hash(data.newPassword, 10);
      updateFields.forcePasswordChange = true;
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: updateFields
    });

    await this.logAudit('USER', targetUserId, 'ADMIN_USER_UPDATE', targetUser, updated, adminUserId, data.reason || 'Super Admin user control edit');
    broadcastRBACUpdate({ type: 'ROLE_UPDATED', userId: targetUserId });
    return updated;
  }

  /**
   * Approval Matrix Rules Management
   */
  async getApprovalRules() {
    const db = prisma as any;
    if (!db.approvalMatrixRule) return [];
    return db.approvalMatrixRule.findMany({
      orderBy: [{ workflowType: 'asc' }, { stepOrder: 'asc' }]
    });
  }

  async setApprovalRule(workflowType: string, stepOrder: number, approverRole: string, conditions: any, adminId: string) {
    const db = prisma as any;
    if (!db.approvalMatrixRule) return null;
    const existing = await db.approvalMatrixRule.findFirst({
      where: { workflowType, stepOrder }
    });

    let rule;
    if (existing) {
      rule = await db.approvalMatrixRule.update({
        where: { id: existing.id },
        data: { approverRole, conditions: JSON.stringify(conditions || {}) }
      });
    } else {
      rule = await db.approvalMatrixRule.create({
        data: { workflowType, stepOrder, approverRole, conditions: JSON.stringify(conditions || {}) }
      });
    }

    await this.logAudit('APPROVAL', rule.id, 'SET_RULE', existing, rule, adminId, 'Updated approval matrix');
    broadcastRBACUpdate({ type: 'APPROVAL_UPDATED' });
    return rule;
  }

  /**
   * Get Audit Logs
   */
  async getAuditLogs(params: { entityType?: string; limit?: number }) {
    const db = prisma as any;
    if (!db.rbacAuditLog) return [];
    return db.rbacAuditLog.findMany({
      where: params.entityType ? { entityType: params.entityType } : {},
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
    });
  }
}
