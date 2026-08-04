import { Request, Response, NextFunction } from 'express';
import { PrincipalAvailabilityResolver } from './availability.resolver';

export interface AuthenticatedRequest extends Request {
  actingDelegationId?: string;
}

export class ActingPrincipalGuard {
  /**
   * Enforces that current user is authorized to act as Vice Principal (Acting Principal)
   * under a currently valid ACTIVE delegation.
   */
  static async requireActiveDelegation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED',
          error: 'Authentication required',
        });
      }

      const context = await PrincipalAvailabilityResolver.resolveContext();

      if (!context.canVpActAsPrincipal || !context.actingPrincipal || context.principalStatus === 'AVAILABLE') {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          error: 'Principal is currently Available. Vice Principal Acting Mode is inactive.',
          principalStatus: context.principalStatus,
        });
      }

      const userRole = (typeof user.role === 'object' ? (user.role as any)?.name : String(user.role || '')).toUpperCase();
      const isVpRole = userRole.includes('VP') || userRole.includes('VICE') || userRole === 'SUPERADMIN' || userRole === 'ADMIN';

      if (!isVpRole && context.actingPrincipal.userId !== user.id) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_UNAUTHORIZED',
          error: 'You are not the designated Vice Principal for the current active delegation.',
        });
      }

      req.actingDelegationId = context.delegation?.id;
      return next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        error: error.message || 'Error validating acting principal authorization',
      });
    }
  }
}
