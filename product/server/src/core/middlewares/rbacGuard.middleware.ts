import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UnauthorizedException, ForbiddenException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';

export interface RBACGuardRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Audit log a denied permission attempt
 */
async function logDeniedAccess(
  req: RBACGuardRequest,
  requiredGroup: string,
  requiredAction: string,
  reason: string
) {
  try {
    const userId = req.user?.id || 'UNKNOWN';
    const userRole = req.user?.role || 'UNKNOWN';
    const userEmail = req.user?.email || 'UNKNOWN';
    const endpoint = `${req.method} ${req.originalUrl || req.url}`;
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Write to PermissionAudit
    await prisma.permissionAudit.create({
      data: {
        userId,
        action: 'ACCESS_DENIED',
        endpoint,
        result: 'DENIED',
        ipAddress,
        userAgent,
        reason: `${reason} [Required: ${requiredGroup}:${requiredAction}]`,
      },
    });

    // Write to SecurityAuditLog
    await prisma.securityAuditLog.create({
      data: {
        userId,
        userEmail,
        userRole,
        action: 'DENIED',
        module: requiredGroup.toUpperCase(),
        description: `Access Denied: Required permission ${requiredGroup}:${requiredAction} on ${endpoint}`,
        statusCode: 403,
        ipAddress,
        userAgent,
      },
    });

    logger.warn(`⛔ [403 Forbidden Logged] User ${userEmail} (${userRole}) denied on ${endpoint}`);
  } catch (err) {
    logger.error('Failed to record RBAC audit log:', err);
  }
}

/**
 * Reusable RBAC Permission Guard Middleware
 * @param group Module or Group name (e.g., 'students', 'faculty', 'attendance')
 * @param action Permission action (e.g., 'view', 'create', 'update', 'delete', 'approve', 'export')
 */
export function requirePermissionGuard(group: string, action: string) {
  return async (req: RBACGuardRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Authentication required');
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || [];
      const targetGroup = group.toLowerCase();
      const targetAction = action.toLowerCase();
      const requiredPerm = `${targetGroup}:${targetAction}`;

      // Super Admin bypass
      if (userRole === 'Super Admin' || userPermissions.includes('*:*') || userPermissions.includes('*')) {
        return next();
      }

      // Exact match check
      if (userPermissions.includes(requiredPerm)) {
        return next();
      }

      // Group wildcard check (e.g., 'students:*' or 'students:manage')
      if (userPermissions.includes(`${targetGroup}:*`) || userPermissions.includes(`${targetGroup}:manage`)) {
        return next();
      }

      // Read compatibility check
      if (targetAction === 'read' && (userPermissions.includes(`${targetGroup}:view`) || userPermissions.includes(`${targetGroup}:read`))) {
        return next();
      }

      // Write compatibility check
      if (targetAction === 'write' && (
        userPermissions.includes(`${targetGroup}:create`) ||
        userPermissions.includes(`${targetGroup}:update`) ||
        userPermissions.includes(`${targetGroup}:edit`) ||
        userPermissions.includes(`${targetGroup}:delete`)
      )) {
        return next();
      }

      // Fallback check against Prisma DB if JWT permissions are outdated
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (dbUser && dbUser.role) {
        const dbPerms = dbUser.role.permissions.map((rp) => rp.permission.name.toLowerCase());
        if (
          dbPerms.includes(requiredPerm) ||
          dbPerms.includes(`${targetGroup}:*`) ||
          dbPerms.includes(`${targetGroup}:manage`)
        ) {
          return next();
        }
      }

      // Access Denied: Log every denied attempt before throwing 403
      await logDeniedAccess(
        req,
        targetGroup,
        targetAction,
        `User with role '${userRole}' lacks permission '${requiredPerm}'`
      );

      throw new ForbiddenException(`Forbidden: Missing required permission '${requiredPerm}'`);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Role Hierarchy Level Guard Middleware
 */
export function requireHierarchyGuard(maxHierarchyLevel: number) {
  return async (req: RBACGuardRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedException('Authentication required');

      if (req.user.role === 'Super Admin') return next();

      const userRole = await prisma.role.findFirst({
        where: { name: req.user.role },
      });

      if (!userRole || userRole.hierarchy > maxHierarchyLevel) {
        await logDeniedAccess(
          req,
          'HIERARCHY',
          'ACCESS',
          `Role '${req.user.role}' hierarchy level (${userRole?.hierarchy || 99}) exceeds allowed maximum (${maxHierarchyLevel})`
        );
        throw new ForbiddenException('Your role hierarchy does not permit access to this section');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
