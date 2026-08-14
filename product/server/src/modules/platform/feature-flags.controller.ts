import { Request, Response, NextFunction } from 'express';
import { featureFlagsService } from './feature-flags.service';

const actor = (req: Request) => ({ id: (req as any).user.id });
const meta = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

export class FeatureFlagsController {
  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await featureFlagsService.ensureSeeded();
      res.status(200).json({ status: 'success', data: await featureFlagsService.list() });
    } catch (error) { next(error); }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await featureFlagsService.get(req.params.key) }); } catch (error) { next(error); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ status: 'success', data: await featureFlagsService.create(req.body, actor(req), meta(req)) }); } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason, ...changes } = req.body ?? {};
      res.status(200).json({ status: 'success', data: await featureFlagsService.update(req.params.key, changes, actor(req), meta(req), reason) });
    } catch (error) { next(error); }
  };

  upsertOverride = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await featureFlagsService.upsertOverride(req.params.key, req.body, actor(req), meta(req)) }); } catch (error) { next(error); }
  };

  deleteOverride = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await featureFlagsService.deleteOverride(req.params.overrideId, actor(req), meta(req)) }); } catch (error) { next(error); }
  };

  history = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await featureFlagsService.history(req.params.key) }); } catch (error) { next(error); }
  };

  resolve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, roleName, departmentId } = req.query as Record<string, string | undefined>;
      res.status(200).json({ status: 'success', data: await featureFlagsService.resolve(req.params.key, { userId, roleName, departmentId }) });
    } catch (error) { next(error); }
  };

  // Effective state for the calling user — used by the frontend to gate its own UI.
  check = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(200).json({ status: 'success', data: await featureFlagsService.resolveForUser(req.params.key, (req as any).user.id) }); } catch (error) { next(error); }
  };
}
