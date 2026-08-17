/**
 * requireFeature middleware
 *
 * Blocks an API route if a module feature flag is disabled by the institution's
 * Super Admin. Intended to be placed immediately after requireAuth on any route
 * that belongs to a configurable module.
 *
 * Usage:
 *   router.get('/stats', requireAuth, requireFeature('MODULE_LIBRARY_ENABLED'), controller.getStats);
 *
 * When the flag is disabled, the route returns 503 Service Unavailable with a
 * structured JSON body that the client can use to display a "module not enabled"
 * message rather than a generic error.
 *
 * The flag value is served from the FeatureFlags in-memory cache so this adds
 * negligible overhead to each request.
 */
import { Request, Response, NextFunction } from 'express';
import { FeatureFlags } from '../feature-flags';

/**
 * @param flagKey - The MODULE_*_ENABLED key from settings.catalog.ts
 * @example requireFeature('MODULE_LIBRARY_ENABLED')
 */
export function requireFeature(flagKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const enabled = await FeatureFlags.isEnabled(flagKey);
      if (enabled) {
        return next();
      }

      // Module is disabled by the institution operator.
      // Return 503 so monitoring tools can detect module-level outages separately
      // from authentication failures or server errors.
      res.status(503).json({
        status: 'error',
        statusCode: 503,
        code: 'MODULE_DISABLED',
        flagKey,
        message: 'This module is not enabled for your institution. Contact your system administrator.',
        requestId: (req as any).requestId,
      });
    } catch {
      // If the flag check itself fails (e.g. DB unavailable), default to allowing
      // access so a transient DB error never locks out legitimate users.
      return next();
    }
  };
}
