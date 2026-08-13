import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

// Meetings
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await prisma.meeting.create({
      data: { ...req.body, scheduledDate: new Date(req.body.scheduledDate), chairPersonId: req.body.chairPersonId || (req as any).user?.id, attachments: JSON.stringify(req.body.attachments || []) },
    });
    // Auto-create invitees
    if (req.body.invitees?.length) {
      await prisma.meetingInvitee.createMany({ data: req.body.invitees.map((inv: any) => ({ meetingId: meeting.id, userId: inv.userId, role: inv.role || 'MEMBER' })) });
    }
    res.status(201).json({ status: 'success', data: meeting });
  } catch (e) { next(e); }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { committeeId, status, from, to } = req.query as any;
    const where: any = {};
    if (committeeId) where.committeeId = committeeId;
    if (status) where.status = status;
    if (from || to) { where.scheduledDate = {}; if (from) where.scheduledDate.gte = new Date(from); if (to) where.scheduledDate.lte = new Date(to); }
    const meetings = await prisma.meeting.findMany({ where, include: { invitees: true, agendaItems: { orderBy: { sequence: 'asc' } } }, orderBy: { scheduledDate: 'desc' } });
    res.json({ status: 'success', data: meetings });
  } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id }, include: { invitees: true, agendaItems: { orderBy: { sequence: 'asc' } }, minutes: true, actionItems: true } });
    if (!meeting) return res.status(404).json({ status: 'error', message: 'Meeting not found' });
    res.json({ status: 'success', data: meeting });
  } catch (e) { next(e); }
});

// Agenda
router.post('/:id/agenda', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agenda = await prisma.meetingAgenda.create({ data: { ...req.body, meetingId: req.params.id } });
    res.status(201).json({ status: 'success', data: agenda });
  } catch (e) { next(e); }
});

// RSVP
router.post('/:id/rsvp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invitee = await prisma.meetingInvitee.updateMany({ where: { meetingId: req.params.id, userId: (req as any).user?.id }, data: { rsvpStatus: req.body.rsvpStatus } });
    res.json({ status: 'success', data: invitee });
  } catch (e) { next(e); }
});

// Mark attendance
router.post('/:id/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = await Promise.all((req.body.attendees || []).map((userId: string) =>
      prisma.meetingInvitee.updateMany({ where: { meetingId: req.params.id, userId }, data: { attended: true, attendedAt: new Date() } })
    ));
    res.json({ status: 'success', data: { updated: updates.length } });
  } catch (e) { next(e); }
});

// Minutes
router.post('/:id/minutes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minutes = await prisma.meetingMinutes.upsert({
      where: { meetingId: req.params.id },
      update: { content: req.body.content, version: { increment: 1 } },
      create: { meetingId: req.params.id, content: req.body.content, preparedById: (req as any).user?.id },
    });
    res.json({ status: 'success', data: minutes });
  } catch (e) { next(e); }
});

router.post('/:id/minutes/approve', requireRole(['Principal', 'HOD', 'Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minutes = await prisma.meetingMinutes.update({ where: { meetingId: req.params.id }, data: { status: 'APPROVED', approvedById: (req as any).user?.id, approvedAt: new Date() } });
    res.json({ status: 'success', data: minutes });
  } catch (e) { next(e); }
});

// Action Items
router.post('/:id/action-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.meetingActionItem.create({ data: { ...req.body, meetingId: req.params.id, deadline: req.body.deadline ? new Date(req.body.deadline) : undefined } });
    res.status(201).json({ status: 'success', data: item });
  } catch (e) { next(e); }
});

router.patch('/action-items/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update: any = { ...req.body };
    if (req.body.status === 'COMPLETED') update.completedAt = new Date();
    const item = await prisma.meetingActionItem.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: item });
  } catch (e) { next(e); }
});

export default router;
