import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

const activityStaffGuard = requireRole(['Super Admin', 'College Admin', 'Faculty', 'HOD', 'Mentor']);

// Activities
router.post('/activities', activityStaffGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await prisma.campusActivity.create({ data: { ...req.body, startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate), organizerId: (req as any).user?.id, audience: JSON.stringify(req.body.audience || []) } });
    res.status(201).json({ status: 'success', data: activity });
  } catch (e) { next(e); }
});

router.get('/activities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, departmentId, upcoming, page = '1', limit = '20' } = req.query as any;
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (upcoming === 'true') where.startDate = { gte: new Date() };
    const [activities, total] = await Promise.all([
      prisma.campusActivity.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), include: { sessions: { select: { id: true, date: true } } }, orderBy: { startDate: 'desc' } }),
      prisma.campusActivity.count({ where }),
    ]);
    res.json({ status: 'success', data: { activities, total } });
  } catch (e) { next(e); }
});

router.get('/activities/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await prisma.campusActivity.findUnique({ where: { id: req.params.id }, include: { sessions: { orderBy: { sessionOrder: 'asc' }, include: { attendance: { select: { id: true, studentId: true, status: true } } } } } });
    if (!activity) return res.status(404).json({ status: 'error', message: 'Activity not found' });
    res.json({ status: 'success', data: activity });
  } catch (e) { next(e); }
});

// Sessions
router.post('/activities/:id/sessions', activityStaffGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.activitySession.create({ data: { ...req.body, activityId: req.params.id, date: new Date(req.body.date) } });
    res.status(201).json({ status: 'success', data: session });
  } catch (e) { next(e); }
});

// Session Attendance
router.post('/sessions/:sessionId/attendance', activityStaffGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await Promise.all((req.body.students || []).map((s: any) =>
      prisma.activityAttendanceRecord.upsert({
        where: { sessionId_studentId_date: { sessionId: req.params.sessionId, studentId: s.studentId, date: new Date(req.body.date) } },
        update: { status: s.status || 'PRESENT', checkIn: new Date() },
        create: { sessionId: req.params.sessionId, studentId: s.studentId, date: new Date(req.body.date), status: s.status || 'PRESENT', checkIn: new Date(), source: req.body.source || 'MANUAL', recordedById: (req as any).user?.id },
      })
    ));
    res.json({ status: 'success', data: { recorded: records.length } });
  } catch (e) { next(e); }
});

// Session Assessment
router.post('/sessions/:sessionId/assessment', activityStaffGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.activitySession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    const assessment = await prisma.activityAssessment.create({ data: { ...req.body, sessionId: req.params.sessionId, activityId: session.activityId, evaluatedById: (req as any).user?.id, evaluatedAt: new Date() } });
    res.status(201).json({ status: 'success', data: assessment });
  } catch (e) { next(e); }
});

// Student Skills
router.get('/skills/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.studentSkill.findMany({ where: { studentId: req.params.studentId }, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: skills });
  } catch (e) { next(e); }
});

router.post('/skills', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await prisma.studentSkill.create({ data: req.body });
    res.status(201).json({ status: 'success', data: skill });
  } catch (e) { next(e); }
});

router.post('/skills/:id/verify', requireRole(['Faculty', 'HOD', 'Mentor', 'Super Admin']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const skill = await prisma.studentSkill.update({ where: { id: req.params.id }, data: { isVerified: true, verifiedById: (req as any).user?.id, verifiedAt: new Date(), level: req.body.level } });
    res.json({ status: 'success', data: skill });
  } catch (e) { next(e); }
});

export default router;
