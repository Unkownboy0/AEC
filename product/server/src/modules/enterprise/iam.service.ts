import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { broadcastRBACUpdate } from '../../lib/socket';

export class IamService {
  /**
   * Evaluate runtime IAM permissions combining primary role, secondary roles, committee permissions, and active delegations
   */
  async evaluateRuntimeIAM(userId: string) {
    const db = prisma as any;
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        assignedRoles: { include: { role: true } },
        committees: { include: { committee: true } },
      }
    });

    if (!user) throw new NotFoundException('User not found');

    // Collect all active roles (primary + secondary)
    const activeRoles: any[] = [];
    if (user.role) activeRoles.push(user.role);
    if (user.assignedRoles && user.assignedRoles.length > 0) {
      user.assignedRoles.forEach((ur: any) => {
        if (ur.role && !activeRoles.some(r => r.id === ur.role.id)) {
          activeRoles.push(ur.role);
        }
      });
    }

    // Check active permission delegations
    const now = new Date();
    const activeDelegations = await db.permissionDelegation.findMany({
      where: {
        delegateeId: userId,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    // Resolve merged module access (UNION strategy: true if any role/delegation/committee grants it)
    const mergedModuleAccess: Record<string, Record<string, boolean>> = {};
    const mergedSidebarConfig: Record<string, boolean> = {};
    const mergedWorkspacesSet = new Set<string>();

    activeRoles.forEach(r => {
      const modAccess = r.moduleAccess ? JSON.parse(r.moduleAccess) : {};
      Object.keys(modAccess).forEach(mod => {
        if (!mergedModuleAccess[mod]) mergedModuleAccess[mod] = {};
        Object.keys(modAccess[mod]).forEach(act => {
          if (modAccess[mod][act]) {
            mergedModuleAccess[mod][act] = true;
          }
        });
      });

      const sidebar = r.sidebarConfig ? JSON.parse(r.sidebarConfig) : {};
      Object.keys(sidebar).forEach(k => {
        if (sidebar[k]) mergedSidebarConfig[k] = true;
      });

      const ws = r.workspaceAccess ? JSON.parse(r.workspaceAccess) : [];
      ws.forEach((w: string) => mergedWorkspacesSet.add(w));
    });

    // Add Committee permissions
    if (user.committees) {
      user.committees.forEach((uc: any) => {
        if (uc.committee && uc.committee.additionalPermissions) {
          try {
            const addPerms = JSON.parse(uc.committee.additionalPermissions);
            Object.keys(addPerms).forEach(mod => {
              if (!mergedModuleAccess[mod]) mergedModuleAccess[mod] = {};
              Object.keys(addPerms[mod]).forEach(act => {
                if (addPerms[mod][act]) mergedModuleAccess[mod][act] = true;
              });
            });
          } catch (e) {
            // ignore invalid JSON
          }
        }
      });
    }

    // Add Delegation permissions
    for (const del of activeDelegations) {
      if (del.roleId) {
        const delRole = await db.role.findUnique({ where: { id: del.roleId } });
        if (delRole && delRole.moduleAccess) {
          const modAccess = JSON.parse(delRole.moduleAccess);
          Object.keys(modAccess).forEach(mod => {
            if (!mergedModuleAccess[mod]) mergedModuleAccess[mod] = {};
            Object.keys(modAccess[mod]).forEach(act => {
              if (modAccess[mod][act]) mergedModuleAccess[mod][act] = true;
            });
          });
        }
      }
      if (del.customPermissions) {
        try {
          const custPerms = JSON.parse(del.customPermissions);
          Object.keys(custPerms).forEach(mod => {
            if (!mergedModuleAccess[mod]) mergedModuleAccess[mod] = {};
            Object.keys(custPerms[mod]).forEach(act => {
              if (custPerms[mod][act]) mergedModuleAccess[mod][act] = true;
            });
          });
        } catch (e) {}
      }
    }

    const userWorkspaces = user.workspaces
      ? JSON.parse(user.workspaces)
      : Array.from(mergedWorkspacesSet);

    if (userWorkspaces.length === 0) userWorkspaces.push('Default Workspace');

    return {
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      primaryRole: user.role ? { id: user.role.id, name: user.role.name, code: user.role.roleCode } : null,
      assignedRoles: activeRoles.map(r => ({ id: r.id, name: r.name, code: r.roleCode })),
      designation: user.designation,
      departmentId: user.departmentId,
      reportingManagerId: user.reportingManagerId,
      committees: user.committees ? user.committees.map((c: any) => ({ id: c.committee.id, name: c.committee.name, role: c.roleInCommittee })) : [],
      delegationsCount: activeDelegations.length,
      moduleAccess: mergedModuleAccess,
      sidebarConfig: mergedSidebarConfig,
      workspaces: userWorkspaces,
      activeWorkspace: user.activeWorkspace || userWorkspaces[0],
      searchScope: user.role?.searchScope || 'EVERYONE',
      isSuperAdmin: activeRoles.some(r => r.roleCode === 'SUPER_ADMIN')
    };
  }

  /**
   * Master User Directory Search & Filtering
   */
  async getMasterUserDirectory(filters: {
    query?: string;
    roleId?: string;
    departmentId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const db = prisma as any;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (filters.status) whereClause.status = filters.status;
    if (filters.departmentId) whereClause.departmentId = filters.departmentId;
    if (filters.roleId) whereClause.roleId = filters.roleId;

    if (filters.query) {
      whereClause.OR = [
        { firstName: { contains: filters.query } },
        { lastName: { contains: filters.query } },
        { email: { contains: filters.query } },
        { phone: { contains: filters.query } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          role: true,
          assignedRoles: { include: { role: true } },
          committees: { include: { committee: true } },
        }
      }),
      db.user.count({ where: whereClause })
    ]);

    return {
      users: users.map((u: any) => ({
        ...u,
        workspaces: u.workspaces ? JSON.parse(u.workspaces) : [],
        dashboardConfig: u.dashboardConfig ? JSON.parse(u.dashboardConfig) : null,
        notificationPreferences: u.notificationPreferences ? JSON.parse(u.notificationPreferences) : null,
        activityTimeline: u.activityTimeline ? JSON.parse(u.activityTimeline) : [],
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Designations Management
   */
  async getDesignations() {
    const db = prisma as any;
    return db.designation.findMany({ orderBy: { hierarchy: 'asc' } });
  }

  async createDesignation(data: { title: string; code: string; description?: string; hierarchy?: number; departmentId?: string }, adminId: string) {
    const db = prisma as any;
    const designation = await db.designation.create({
      data: {
        title: data.title,
        code: data.code.toUpperCase().replace(/\s+/g, '_'),
        description: data.description,
        hierarchy: data.hierarchy || 99,
        departmentId: data.departmentId || null,
        status: 'ACTIVE'
      }
    });

    if (db.rbacAuditLog) {
      await db.rbacAuditLog.create({
        data: {
          entityType: 'DESIGNATION',
          entityId: designation.id,
          action: 'CREATE',
          newValue: JSON.stringify(designation),
          changedBy: adminId,
          reason: 'Created new designation'
        }
      });
    }

    broadcastRBACUpdate({ type: 'ROLE_UPDATED' });
    return designation;
  }

  /**
   * Committee Management
   */
  async getCommittees() {
    const db = prisma as any;
    return db.committee.findMany({
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        _count: { select: { members: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCommittee(data: { name: string; code: string; type?: string; description?: string; additionalPermissions?: any }, adminId: string) {
    const db = prisma as any;
    const committee = await db.committee.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase().replace(/\s+/g, '_'),
        type: data.type || 'ACADEMIC',
        description: data.description,
        additionalPermissions: data.additionalPermissions ? JSON.stringify(data.additionalPermissions) : null,
        status: 'ACTIVE'
      }
    });

    if (db.rbacAuditLog) {
      await db.rbacAuditLog.create({
        data: {
          entityType: 'COMMITTEE',
          entityId: committee.id,
          action: 'CREATE',
          newValue: JSON.stringify(committee),
          changedBy: adminId,
          reason: 'Created committee'
        }
      });
    }

    broadcastRBACUpdate({ type: 'ROLE_UPDATED' });
    return committee;
  }

  async assignUserToCommittee(userId: string, committeeId: string, roleInCommittee: string = 'MEMBER', adminId: string) {
    const db = prisma as any;
    const existing = await db.userCommittee.findUnique({
      where: { userId_committeeId: { userId, committeeId } }
    });

    if (existing) {
      await db.userCommittee.update({
        where: { userId_committeeId: { userId, committeeId } },
        data: { roleInCommittee }
      });
    } else {
      await db.userCommittee.create({
        data: { userId, committeeId, roleInCommittee }
      });
    }

    broadcastRBACUpdate({ type: 'PERMISSIONS_UPDATED', userId });
    return { success: true };
  }

  /**
   * Permission Delegation Engine
   */
  async getDelegations() {
    const db = prisma as any;
    return db.permissionDelegation.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createDelegation(data: {
    delegatorId: string;
    delegateeId: string;
    roleId?: string;
    customPermissions?: any;
    reason: string;
    startDate: Date;
    endDate: Date;
  }, adminId: string) {
    const db = prisma as any;
    const delegation = await db.permissionDelegation.create({
      data: {
        delegatorId: data.delegatorId,
        delegateeId: data.delegateeId,
        roleId: data.roleId || null,
        customPermissions: data.customPermissions ? JSON.stringify(data.customPermissions) : null,
        reason: data.reason,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'ACTIVE'
      }
    });

    if (db.rbacAuditLog) {
      await db.rbacAuditLog.create({
        data: {
          entityType: 'DELEGATION',
          entityId: delegation.id,
          action: 'CREATE',
          newValue: JSON.stringify(delegation),
          changedBy: adminId,
          reason: data.reason
        }
      });
    }

    broadcastRBACUpdate({ type: 'PERMISSIONS_UPDATED', userId: data.delegateeId });
    return delegation;
  }

  async revokeDelegation(delegationId: string, adminId: string) {
    const db = prisma as any;
    const del = await db.permissionDelegation.update({
      where: { id: delegationId },
      data: { status: 'REVOKED' }
    });

    broadcastRBACUpdate({ type: 'PERMISSIONS_UPDATED', userId: del.delegateeId });
    return del;
  }
}
