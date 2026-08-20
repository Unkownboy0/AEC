import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedException, ForbiddenException } from '../../utils/exceptions';

import { prisma } from '../../lib/prisma';
import { resolveUserWorkspaceAccess } from '../../modules/auth/workspace-access';
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

  let decoded: UserPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      maxAge: env.JWT_EXPIRES_IN as jwt.VerifyOptions['maxAge'],
    }) as UserPayload;
  } catch {
    return next(new UnauthorizedException('Access token expired or corrupted'));
  }

  try {
    const access = await resolveUserWorkspaceAccess(decoded.id);
    if (!access) {
      return next(new UnauthorizedException('User account is inactive or no longer available'));
    }

    const requestedRoleHeader = req.headers['x-active-role'];
    const requestedRole = typeof requestedRoleHeader === 'string' && requestedRoleHeader.trim()
      ? requestedRoleHeader.trim()
      : decoded.role;
    const workspace = access.workspaces.find((entry) => entry.name === requestedRole);

    if (!workspace) {
      return next(new ForbiddenException('The requested workspace is not assigned to your account'));
    }

    req.user = {
      id: access.userId,
      email: access.email,
      role: workspace.name,
      permissions: workspace.permissions,
    };
    return next();
  } catch (error) {
    return next(error);
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

    const normalizedAllowed = allowedRoles.map(normalizeRoleStr);

    // Direct active-workspace role match. Elevated roles must still be listed
    // explicitly by the route; authentication alone is never an authorization bypass.
    let hasRole = normalizedAllowed.includes(userRoleNorm);

    // 3. Narrow aliases only. Dean workspaces are intentionally not aliases for
    // one another, and VP is not Principal without an active delegation.
    if (!hasRole) {
      if ((userRoleNorm === 'VICEPRINCIPAL' || userRoleNorm === 'VP') && normalizedAllowed.some(r => r === 'VP' || r === 'VICEPRINCIPAL')) {
        hasRole = true;
      } else if (userRoleNorm === 'HOD' && normalizedAllowed.some(r => r === 'HOD' || r === 'HEADOFDEPARTMENT')) {
        hasRole = true;
      } else if (userRoleNorm === 'FACULTY' && normalizedAllowed.some(r => r === 'FACULTY' || r === 'TEACHER')) {
        hasRole = true;
      }
    }

    // Principal delegation is deliberately NOT a generic role alias. A VP may
    // exercise Principal authority only through a write boundary that invokes
    // the fine-grained delegation authorization helper for the concrete action.

    if (!hasRole) {
      return next(new ForbiddenException('Your role does not allow access to this resource'));
    }

    next();
  };
};
