import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedException, ForbiddenException } from '../../utils/exceptions';

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

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Access token missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedException('Access token expired or corrupted');
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

    // Super Admin gets all privileges
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const hasPermission = checkPermission(req.user.permissions, permission);
    if (!hasPermission) {
      throw new ForbiddenException(`You do not have the required permission: ${permission}`);
    }

    next();
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admin has bypass access
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const hasRole = allowedRoles.includes(req.user.role);
    if (!hasRole) {
      throw new ForbiddenException('Your role does not allow access to this resource');
    }

    next();
  };
};
