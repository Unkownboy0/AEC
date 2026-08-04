import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedException, ForbiddenException } from '../../utils/exceptions';

import { prisma } from '../../lib/prisma';

export interface UserPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedException('Access token missing or invalid'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    const userPayload: UserPayload = { ...decoded };

    const activeRole = req.headers['x-active-role'] as string;
    if (activeRole && activeRole !== decoded.role) {
      const allowedRoles = [decoded.role];
      if (['Faculty', 'HOD', 'Academic Dean', 'Vice Principal', 'Principal'].includes(decoded.role)) {
        allowedRoles.push('Faculty', 'Mentor');
      }

      if (allowedRoles.includes(activeRole)) {
        const roleData = await prisma.role.findFirst({
          where: { name: activeRole },
          include: { permissions: { include: { permission: true } } }
        });
        if (roleData) {
          userPayload.role = activeRole;
          userPayload.permissions = roleData.permissions.map(p => p.permission.name);
        }
      }
    }

    req.user = userPayload;
    next();
  } catch (error) {
    next(new UnauthorizedException('Access token expired or corrupted'));
  }
};

export const checkPermission = (userPermissions: string[], required: string): boolean => {
  if (userPermissions.includes('*:*') || userPermissions.includes('*')) return true;
  if (userPermissions.includes(required)) return true;

  const parts = required.split(':');
  if (parts.length !== 2) return false;
  const [reqModule, reqAction] = parts;

  // Module level wildcard or management permission bypass
  if (userPermissions.includes(`${reqModule}:*`) || userPermissions.includes(`${reqModule}:manage`)) {
    return true;
  }

  // Mapping compatibility
  if (reqAction === 'read') {
    return userPermissions.includes(`${reqModule}:view`) || userPermissions.includes(`${reqModule}:read`);
  }
  if (reqAction === 'write') {
    return userPermissions.includes(`${reqModule}:create`) || 
           userPermissions.includes(`${reqModule}:edit`) || 
           userPermissions.includes(`${reqModule}:delete`) ||
           userPermissions.includes(`${reqModule}:write`);
  }

  return false;
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admin & Principal get executive privilege access
    const userRoleNorm = normalizeRoleStr(typeof req.user.role === 'object' ? (req.user.role as any)?.name : String(req.user.role || ''));
    if (userRoleNorm === 'SUPERADMIN' || userRoleNorm === 'ADMIN' || userRoleNorm === 'PRINCIPAL') {
      return next();
    }

    const hasPermission = checkPermission(req.user.permissions, permission);
    if (!hasPermission) {
      throw new ForbiddenException(`You do not have the required permission: ${permission}`);
    }

    next();
  };
};

const normalizeRoleStr = (r: string) => (r || '').toUpperCase().replace(/[\s_]+/g, '');

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'));
    }

    const userRoleRaw = typeof req.user.role === 'object' ? (req.user.role as any)?.name : String(req.user.role || '');
    const userRoleNorm = normalizeRoleStr(userRoleRaw);

    // 1. Super Admin and Principal have top-level executive access to all college ERP resources
    if (userRoleNorm === 'SUPERADMIN' || userRoleNorm === 'ADMIN' || userRoleNorm === 'PRINCIPAL') {
      return next();
    }

    const normalizedAllowed = allowedRoles.map(normalizeRoleStr);

    // 2. Direct normalized match
    let hasRole = normalizedAllowed.includes(userRoleNorm);

    // 3. Role alias & hierarchy matching
    if (!hasRole) {
      if ((userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP') && normalizedAllowed.some(r => r === 'VP' || r === 'VICEPRINCIPAL' || r === 'PRINCIPAL')) {
        hasRole = true;
      } else if (userRoleNorm.includes('DEAN') && normalizedAllowed.some(r => r.includes('DEAN'))) {
        hasRole = true;
      } else if (userRoleNorm === 'HOD' && normalizedAllowed.some(r => r === 'HOD' || r === 'HEADOFDEPARTMENT')) {
        hasRole = true;
      } else if (userRoleNorm === 'FACULTY' && normalizedAllowed.some(r => r === 'FACULTY' || r === 'TEACHER')) {
        hasRole = true;
      }
    }

    // 4. Active Principal delegation check for VP
    if (!hasRole && (userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP')) {
      try {
        const activeDelegation = await (prisma as any).principalDelegation.findFirst({
          where: {
            actingUserId: req.user.id,
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        });
        if (activeDelegation) {
          hasRole = true;
        }
      } catch {
        // Fallback
      }
    }

    if (!hasRole) {
      return next(new ForbiddenException('Your role does not allow access to this resource'));
    }

    next();
  };
};
