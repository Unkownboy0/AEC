import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

// Clubs
router.get('/clubs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status } = req.query as any;
    const where: any = { status: status || 'ACTIVE' };
    if (type) where.type = type;
    const clubs = await prisma.club.findMany({ where, include: { memberships: { where: { status: 'ACTIVE' } } }, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: clubs });
  } catch (e) { next(e); }
});

router.post('/clubs', requireRole(['Super Admin', 'College Admin', 'Student Affairs']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const club = await prisma.club.create({ data: req.body });
    res.status(201).json({ status: 'success', data: club });
  } catch (e) { next(e); }
});

// Membership
router.post('/clubs/:id/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });
    const membership = await prisma.clubMembership.create({ data: { clubId: req.params.id, studentId: student.id, role: 'MEMBER', status: 'REQUESTED' } });
    res.status(201).json({ status: 'success', data: membership });
  } catch (e) { next(e); }
});

router.patch('/memberships/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const membership = await prisma.clubMembership.update({ where: { id: req.params.id }, data: { ...req.body, approvedById: req.body.status === 'ACTIVE' ? (req as any).user?.id : undefined } });
    res.json({ status: 'success', data: membership });
  } catch (e) { next(e); }
});

// Events
router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.clubEvent.create({ data: { ...req.body, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate), registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : undefined, organizerId: (req as any).user?.id, attachments: JSON.stringify(req.body.attachments || []) } });
    res.status(201).json({ status: 'success', data: event });
  } catch (e) { next(e); }
});

router.get('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clubId, status, upcoming } = req.query as any;
    const where: any = {};
    if (clubId) where.clubId = clubId;
    if (status) where.status = status;
    if (upcoming === 'true') where.startDate = { gte: new Date() };
    const events = await prisma.clubEvent.findMany({ where, include: { club: { select: { name: true } }, registrations: { select: { id: true } } }, orderBy: { startDate: 'desc' } });
    res.json({ status: 'success', data: events });
  } catch (e) { next(e); }
});

router.get('/events/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.clubEvent.findUnique({ where: { id: req.params.id }, include: { club: true, registrations: true, eventAttendance: true, certificates: true } });
    if (!event) return res.status(404).json({ status: 'error', message: 'Event not found' });
    res.json({ status: 'success', data: event });
  } catch (e) { next(e); }
});

// Register for event
router.post('/events/:id/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });
    const reg = await prisma.eventRegistration.create({ data: { eventId: req.params.id, studentId: student.id } });
    res.status(201).json({ status: 'success', data: reg });
  } catch (e) { next(e); }
});

// Event Attendance
router.post('/events/:id/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await Promise.all((req.body.students || []).map((studentId: string) =>
      prisma.eventAttendance.upsert({
        where: { eventId_studentId_date: { eventId: req.params.id, studentId, date: new Date(req.body.date) } },
        update: { status: 'PRESENT', checkIn: new Date() },
        create: { eventId: req.params.id, studentId, date: new Date(req.body.date), status: 'PRESENT', checkIn: new Date(), recordedById: (req as any).user?.id },
      })
    ));
    res.json({ status: 'success', data: { recorded: records.length } });
  } catch (e) { next(e); }
});

// Issue Certificates
router.post('/events/:id/certificates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificates = await Promise.all((req.body.recipients || []).map((r: any) =>
      prisma.eventCertificate.create({ data: { eventId: req.params.id, studentId: r.studentId, type: r.type || 'PARTICIPATION', qrHash: crypto.randomBytes(8).toString('hex'), issuedById: (req as any).user?.id } })
    ));
    res.status(201).json({ status: 'success', data: certificates });
  } catch (e) { next(e); }
});

export default router;
