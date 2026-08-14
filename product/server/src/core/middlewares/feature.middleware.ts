import { Request, Response, NextFunction } from 'express';
import { ForbiddenException, UnauthorizedException } from '../../utils/exceptions';
import { featureFlagsService } from '../../modules/platform/feature-flags.service';

// Gates a route behind a Platform Control Center feature flag. Unregistered
// keys resolve open (see resolveFlag) so this is safe to add ahead of the
// flag being created in the registry.
export const requireFeature = (key: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedException('Authentication required'));
    try {
      const result = await featureFlagsService.resolveForUser(key, req.user.id);
      if (!result.enabled) {
        return next(new ForbiddenException(`This feature is currently disabled: ${key}`));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
