import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

const calendarWriteGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'HOD']);

// Get calendar events (filtered by scope, date range, type)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, eventType, scope, departmentId } = req.query as any;
    const where: any = { status: 'ACTIVE' };
    if (eventType) where.eventType = eventType;
    if (scope) where.scope = scope;
    if (departmentId) where.departmentId = departmentId;
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to) where.startDate.lte = new Date(to);
    }
    const events = await prisma.calendarEvent.findMany({ where, orderBy: { startDate: 'asc' }, take: 200 });
    res.json({ status: 'success', data: events });
  } catch (e) { next(e); }
});

// Create event
router.post('/', calendarWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.calendarEvent.create({ data: { ...req.body, startDate: new Date(req.body.startDate), endDate: req.body.endDate ? new Date(req.body.endDate) : undefined, createdById: (req as any).user?.id, targetAudience: JSON.stringify(req.body.targetAudience || []) } });
    res.status(201).json({ status: 'success', data: event });
  } catch (e) { next(e); }
});

// Update event
router.patch('/:id', calendarWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.calendarEvent.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', data: event });
  } catch (e) { next(e); }
});

// Delete (cancel) event
router.delete('/:id', calendarWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.calendarEvent.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ status: 'success', message: 'Event cancelled' });
  } catch (e) { next(e); }
});

// Aggregate today's events
router.get('/today', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const events = await prisma.calendarEvent.findMany({ where: { status: 'ACTIVE', startDate: { gte: today, lt: tomorrow } }, orderBy: { startDate: 'asc' } });
    res.json({ status: 'success', data: events });
  } catch (e) { next(e); }
});

export default router;
