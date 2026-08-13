import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

// List bookable resources
router.get('/resources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status, departmentId } = req.query as any;
    const where: any = { status: status || 'AVAILABLE' };
    if (type) where.type = type;
    if (departmentId) where.departmentId = departmentId;
    const resources = await prisma.bookableResource.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: resources });
  } catch (e) { next(e); }
});

router.post('/resources', requireRole(['Super Admin', 'College Admin', 'Estate Officer']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resource = await prisma.bookableResource.create({ data: { ...req.body, amenities: JSON.stringify(req.body.amenities || []) } });
    res.status(201).json({ status: 'success', data: resource });
  } catch (e) { next(e); }
});

// Get resource availability
router.get('/resources/:id/availability', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query as any;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.resourceBooking.findMany({
      where: { resourceId: req.params.id, status: { in: ['APPROVED', 'CONFIRMED'] }, startTime: { lte: endOfDay }, endTime: { gte: startOfDay } },
      orderBy: { startTime: 'asc' },
    });
    res.json({ status: 'success', data: { resourceId: req.params.id, date: targetDate.toISOString().split('T')[0], bookings } });
  } catch (e) { next(e); }
});

// Create booking
router.post('/bookings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resourceId, purpose, description, startTime, endTime, attendees, equipmentNeeded } = req.body;

    // Conflict check
    const conflicts = await prisma.resourceBooking.count({
      where: { resourceId, status: { in: ['APPROVED', 'CONFIRMED'] }, startTime: { lt: new Date(endTime) }, endTime: { gt: new Date(startTime) } },
    });
    if (conflicts > 0) return res.status(409).json({ status: 'error', message: 'Time slot conflict with existing booking' });

    const user = (req as any).user;
    const booking = await prisma.resourceBooking.create({
      data: { resourceId, bookedById: user?.id, bookedByRole: user?.roleName || 'User', purpose, description, startTime: new Date(startTime), endTime: new Date(endTime), attendees, equipmentNeeded: JSON.stringify(equipmentNeeded || []), status: 'REQUESTED', conflictCheckPassed: true },
    });
    res.status(201).json({ status: 'success', data: booking });
  } catch (e) { next(e); }
});

// List my bookings
router.get('/bookings/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await prisma.resourceBooking.findMany({
      where: { bookedById: (req as any).user?.id },
      include: { resource: { select: { name: true, type: true, building: true } } },
      orderBy: { startTime: 'desc' },
    });
    res.json({ status: 'success', data: bookings });
  } catch (e) { next(e); }
});

// Approve/Reject booking
router.patch('/bookings/:id/status', requireRole(['HOD', 'Head of Department', 'Super Admin', 'College Admin', 'Estate Officer']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update: any = { status: req.body.status };
    if (req.body.status === 'APPROVED') { update.approvedById = (req as any).user?.id; update.approvedAt = new Date(); }
    if (req.body.status === 'CANCELLED') { update.cancelledAt = new Date(); update.cancellationReason = req.body.reason; }
    const booking = await prisma.resourceBooking.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: booking });
  } catch (e) { next(e); }
});

export default router;
