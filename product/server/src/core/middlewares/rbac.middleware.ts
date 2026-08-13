import { Request, Response, NextFunction } from 'express';
import { RbacService } from '../../modules/enterprise/rbac.service';
import { UnauthorizedException, ForbiddenException } from '../../utils/exceptions';

const rbacService = new RbacService();

export interface AuthenticatedRequest extends Request {
  user?: any;
  rbac?: any;
}

/**
 * Universal Dynamic RBAC Middleware Guard
 * Validates whether the user's role has permission for a specific module and action.
 */
export function requirePermission(moduleName: string, actionName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) {
        throw new UnauthorizedException('Authentication required');
      }

      // Fetch dynamic RBAC configuration
      const userRBAC = await rbacService.evaluateUserRBAC(userId);
      req.rbac = userRBAC;

      // Super Admin bypass
      if (userRBAC.isSuperAdmin) {
        return next();
      }

      const modulePerms = userRBAC.moduleAccess[moduleName];
      if (!modulePerms) {
        throw new ForbiddenException(`Access denied to module '${moduleName}'`);
      }

      const hasAction = modulePerms[actionName] === true || modulePerms['manage'] === true;
      if (!hasAction) {
        throw new ForbiddenException(`Permission denied: '${actionName}' on '${moduleName}'`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Requires Super Admin Privileges
 */
export function requireSuperAdmin() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      if (!userId) throw new UnauthorizedException('Authentication required');

      const activeRole = String((req as any).user?.role || '');
      const userRBAC = await rbacService.evaluateUserRBAC(userId, activeRole);
      req.rbac = userRBAC;

      if (!userRBAC.isSuperAdmin) {
        throw new ForbiddenException('The active Super Admin workspace is required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
