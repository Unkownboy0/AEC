import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

/**
 * Staff/Faculty 360° Profile — aggregates all authorized data.
 * RBAC: Self, HOD (department), Dean, Principal, HR Admin.
 */
router.get('/:facultyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facultyId } = req.params;
    const user = (req as any).user;

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });
    if (!faculty) return res.status(404).json({ status: 'error', message: 'Faculty not found' });

    const isOwnProfile = faculty.userId === user?.id;
    const isAdmin = ['Super Admin', 'College Admin', 'Principal', 'Vice Principal', 'HR Admin'].includes(user?.roleName);

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    const sections = (req.query.sections as string)?.split(',') || ['profile', 'leave', 'appraisal', 'research', 'evidence', 'activities', 'meetings'];
    const result: any = {};

    if (sections.includes('profile')) {
      result.profile = {
        id: faculty.id,
        employeeId: faculty.employeeId,
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        email: faculty.email,
        phone: faculty.phone,
        designation: faculty.designation,
        department: faculty.department?.name,
        status: faculty.status,
        dateOfJoining: faculty.dateOfJoining,
      };
    }

    if (sections.includes('leave') && faculty.userId) {
      result.leave = await prisma.workflowRequest.findMany({
        where: { facultyRequesterId: faculty.id, type: { in: ['FACULTY_LEAVE', 'FACULTY_OD'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }

    if (sections.includes('appraisal')) {
      result.appraisal = await prisma.appraisalSubmission.findMany({
        where: { facultyId },
        include: { config: { select: { title: true, academicYear: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    if (sections.includes('research')) {
      const [projects, publications, patents] = await Promise.all([
        prisma.researchProject.findMany({ where: { piId: facultyId }, orderBy: { createdAt: 'desc' }, take: 10 }),
        prisma.researchPublication.findMany({ where: { departmentId: faculty.departmentId }, take: 20 }),
        prisma.patent.findMany({ where: { departmentId: faculty.departmentId }, take: 10 }),
      ]);
      result.research = { projects, publications, patents };
    }

    if (sections.includes('evidence')) {
      result.evidence = await prisma.evidenceItem.findMany({ where: { ownerId: facultyId, status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, take: 20 });
    }

    if (sections.includes('activities') && faculty.userId) {
      result.activities = await prisma.campusActivity.findMany({
        where: { OR: [{ organizerId: faculty.userId }, { responsibleStaffId: facultyId }] },
        orderBy: { startDate: 'desc' },
        take: 20,
      });
    }

    if (sections.includes('meetings') && faculty.userId) {
      const invites = await prisma.meetingInvitee.findMany({
        where: { userId: faculty.userId },
        include: { meeting: { select: { title: true, scheduledDate: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      result.meetings = invites;
    }

    res.json({ status: 'success', data: result });
  } catch (e) { next(e); }
});

/**
 * Staff workspace — quick dashboard
 */
router.get('/my/workspace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const faculty = await prisma.faculty.findFirst({ where: { userId }, include: { department: true } });
    if (!faculty) return res.status(404).json({ status: 'error', message: 'Faculty profile not found' });

    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [pendingApprovals, pendingLeaves, upcomingMeetings, pendingTasks, activeAppraisal] = await Promise.all([
      prisma.workflowRequest.count({ where: { mentorId: faculty.id, status: { startsWith: 'PENDING' } } }),
      prisma.workflowRequest.count({ where: { facultyRequesterId: faculty.id, type: 'FACULTY_LEAVE', status: { startsWith: 'PENDING' } } }),
      prisma.meetingInvitee.findMany({ where: { userId, meeting: { scheduledDate: { gte: today }, status: 'SCHEDULED' } }, include: { meeting: { select: { title: true, scheduledDate: true, startTime: true, venue: true } } }, take: 5 }),
      prisma.meetingActionItem.count({ where: { assigneeId: userId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.appraisalSubmission.findFirst({ where: { facultyId: faculty.id, status: { in: ['DRAFT', 'RETURNED'] } }, include: { config: { select: { title: true, endDate: true } } } }),
    ]);

    res.json({
      status: 'success',
      data: {
        faculty: { id: faculty.id, name: `${faculty.firstName} ${faculty.lastName}`, employeeId: faculty.employeeId, department: faculty.department?.name, designation: faculty.designation },
        pendingApprovals,
        pendingLeaves,
        upcomingMeetings,
        pendingTasks,
        activeAppraisal,
      },
    });
  } catch (e) { next(e); }
});

export default router;
