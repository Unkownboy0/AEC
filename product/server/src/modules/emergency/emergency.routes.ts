import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const emergencyGuard = requireRole(['Security Officer', 'Principal', 'Vice Principal', 'Super Admin', 'College Admin']);

// Create emergency alert
router.post('/alerts', emergencyGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertNumber = `SOS-${Date.now().toString(36).toUpperCase()}`;
    const alert = await prisma.emergencyAlert.create({
      data: {
        ...req.body,
        alertNumber,
        initiatedById: (req as any).user?.id,
        initiatedByRole: (req as any).user?.roleName || 'Admin',
        channels: JSON.stringify(req.body.channels || ['IN_APP', 'PUSH']),
        updateHistory: JSON.stringify([]),
      },
    });
    res.status(201).json({ status: 'success', data: alert });
  } catch (e) { next(e); }
});

// List alerts
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    const alerts = await prisma.emergencyAlert.findMany({ where, include: { acknowledgements: { select: { id: true, status: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: alerts });
  } catch (e) { next(e); }
});

// Get active alerts
router.get('/alerts/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await prisma.emergencyAlert.findMany({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: alerts });
  } catch (e) { next(e); }
});

// Update alert
router.patch('/alerts/:id', emergencyGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alert = await prisma.emergencyAlert.findUnique({ where: { id: req.params.id } });
    if (!alert) return res.status(404).json({ status: 'error', message: 'Alert not found' });

    const history = JSON.parse(alert.updateHistory);
    if (req.body.update) history.push({ time: new Date().toISOString(), update: req.body.update, by: (req as any).user?.id });

    const update: any = { ...req.body, updateHistory: JSON.stringify(history) };
    if (req.body.status === 'RESOLVED') { update.resolvedAt = new Date(); update.resolvedById = (req as any).user?.id; update.resolution = req.body.resolution; }
    delete update.update;

    const updated = await prisma.emergencyAlert.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: updated });
  } catch (e) { next(e); }
});

// Acknowledge alert
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ack = await prisma.emergencyAcknowledgement.upsert({
      where: { alertId_userId: { alertId: req.params.id, userId: (req as any).user?.id } },
      update: { status: req.body.status || 'ACKNOWLEDGED', message: req.body.message, location: req.body.location },
      create: { alertId: req.params.id, userId: (req as any).user?.id, status: req.body.status || 'ACKNOWLEDGED', message: req.body.message, location: req.body.location },
    });
    res.json({ status: 'success', data: ack });
  } catch (e) { next(e); }
});

// Get acknowledgement stats
router.get('/alerts/:id/stats', emergencyGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await prisma.emergencyAcknowledgement.groupBy({ by: ['status'], where: { alertId: req.params.id }, _count: true });
    const needHelp = await prisma.emergencyAcknowledgement.findMany({ where: { alertId: req.params.id, status: 'NEED_HELP' }, select: { userId: true, message: true, location: true } });
    res.json({ status: 'success', data: { stats, needHelp } });
  } catch (e) { next(e); }
});

export default router;
