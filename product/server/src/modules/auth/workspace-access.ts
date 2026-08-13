import { prisma } from '../../lib/prisma';

export interface WorkspaceRoleContext {
  name: string;
  permissions: string[];
}

export interface UserWorkspaceAccess {
  userId: string;
  email: string;
  primaryRole: string;
  workspaces: WorkspaceRoleContext[];
}

interface WorkspaceRecord {
  roleName: string;
  status: string;
}

interface AssignedRoleRecord {
  role: {
    name: string;
    status: string;
  };
}

export function collectAuthorizedWorkspaceNames(
  primaryRole: string,
  workspaceRecords: WorkspaceRecord[],
  assignedRoles: AssignedRoleRecord[]
): string[] {
  const names = new Set<string>([primaryRole]);

  workspaceRecords
    .filter((workspace) => workspace.status === 'ACTIVE')
    .forEach((workspace) => names.add(workspace.roleName));

  assignedRoles
    .filter((assignment) => assignment.role.status === 'ACTIVE')
    .forEach((assignment) => names.add(assignment.role.name));

  return Array.from(names);
}

export async function resolveUserWorkspaceAccess(userId: string): Promise<UserWorkspaceAccess | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      status: true,
      role: {
        select: {
          name: true,
          status: true,
          permissions: {
            select: {
              permission: {
                select: { name: true },
              },
            },
          },
        },
      },
      userWorkspaces: {
        select: { roleName: true, status: true },
      },
      assignedRoles: {
        select: {
          role: {
            select: {
              name: true,
              status: true,
              permissions: {
                select: {
                  permission: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
      faculty: { select: { id: true } },
    },
  });

  if (!user || user.status !== 'ACTIVE' || user.role.status !== 'ACTIVE') {
    return null;
  }

  const authorizedNames = collectAuthorizedWorkspaceNames(
    user.role.name,
    user.userWorkspaces,
    user.assignedRoles
  ).filter((name) => name !== 'Faculty' || Boolean(user.faculty));

  const roleContexts = new Map<string, WorkspaceRoleContext>();
  roleContexts.set(user.role.name, {
    name: user.role.name,
    permissions: user.role.permissions.map((entry) => entry.permission.name),
  });

  user.assignedRoles.forEach((assignment) => {
    if (assignment.role.status !== 'ACTIVE') return;
    roleContexts.set(assignment.role.name, {
      name: assignment.role.name,
      permissions: assignment.role.permissions.map((entry) => entry.permission.name),
    });
  });

  const unresolvedNames = authorizedNames.filter((name) => !roleContexts.has(name));
  if (unresolvedNames.length > 0) {
    const workspaceRoles = await prisma.role.findMany({
      where: {
        name: { in: unresolvedNames },
        status: 'ACTIVE',
      },
      select: {
        name: true,
        permissions: {
          select: {
            permission: {
              select: { name: true },
            },
          },
        },
      },
    });

    workspaceRoles.forEach((role) => {
      roleContexts.set(role.name, {
        name: role.name,
        permissions: role.permissions.map((entry) => entry.permission.name),
      });
    });
  }

  return {
    userId: user.id,
    email: user.email,
    primaryRole: user.role.name,
    workspaces: authorizedNames
      .map((name) => roleContexts.get(name))
      .filter((workspace): workspace is WorkspaceRoleContext => Boolean(workspace)),
  };
}
