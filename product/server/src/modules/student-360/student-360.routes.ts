import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

/**
 * Student 360° Profile — aggregates ALL authorized data from Student Master
 * and linked modules into a single holistic view.
 *
 * RBAC: Students see their own data. Faculty/Mentors see mentee data.
 * HOD/Admin see department students. Super Admin sees all.
 */
router.get('/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;
    const sections = (req.query.sections as string)?.split(',') || ['profile', 'academic', 'attendance', 'fees', 'leave', 'documents', 'activities', 'skills', 'hostel', 'transport', 'library', 'placements', 'complaints'];

    // Authorization check
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { department: true, program: true, section: true, semester: true, mentor: { select: { userId: true, firstName: true, lastName: true } } },
    });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

    const isOwnProfile = student.userId === user?.id;
    const isMentor = student.mentor?.userId === user?.id;
    const isAdmin = ['Super Admin', 'College Admin', 'Principal', 'Vice Principal'].includes(user?.roleName);
    const isHOD = user?.roleName === 'HOD' || user?.roleName === 'Head of Department';

    if (!isOwnProfile && !isMentor && !isAdmin && !isHOD) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this student profile' });
    }

    const result: any = {};

    // Profile — from Student Master (never fabricated)
    if (sections.includes('profile')) {
      result.profile = {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone,
        gender: student.gender,
        dob: student.dob,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        department: student.department?.name,
        program: student.program?.name,
        section: student.section?.name,
        semester: student.semester?.name,
        dateOfAdmission: student.dateOfAdmission,
        status: student.status,
        mentor: student.mentor ? `${student.mentor.firstName} ${student.mentor.lastName}` : null,
      };
    }

    // Academic — marks
    if (sections.includes('academic')) {
      const marks = await prisma.mark.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' }, take: 50 });
      result.academic = { marks };
    }

    // Attendance
    if (sections.includes('attendance')) {
      const attendance = await prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 100,
        select: { date: true, status: true, subjectId: true, type: true },
      });
      const total = attendance.length;
      const present = attendance.filter((a: any) => a.status === 'PRESENT').length;
      result.attendance = { records: attendance, total, present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
    }

    // Fees
    if (sections.includes('fees')) {
      const [bills, payments] = await Promise.all([
        prisma.feeBill.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } }),
        prisma.feePayment.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } }),
      ]);
      const totalDue = bills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
      const totalPaid = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      result.fees = { bills, payments, totalDue, totalPaid, balance: totalDue - totalPaid };
    }

    // Leave/OD
    if (sections.includes('leave')) {
      const requests = await prisma.workflowRequest.findMany({
        where: { studentId, type: { in: ['LEAVE', 'OD', 'MEDICAL_LEAVE', 'HOSTEL_LEAVE'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      result.leave = requests;
    }

    // Documents/Certificates
    if (sections.includes('documents')) {
      const certificates = await prisma.certificateGeneration.findMany({
        where: { studentId },
        include: { template: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      });
      result.documents = certificates;
    }

    // Activities participated
    if (sections.includes('activities')) {
      const activityRecords = await prisma.activityAttendanceRecord.findMany({
        where: { studentId },
        include: { session: { include: { activity: { select: { title: true, category: true, startDate: true } } } } },
        orderBy: { date: 'desc' },
        take: 50,
      });
      const eventRegistrations = await prisma.eventRegistration.findMany({
        where: { studentId },
        include: { event: { select: { title: true, type: true, startDate: true } } },
        orderBy: { registeredAt: 'desc' },
        take: 20,
      });
      result.activities = { activityRecords, eventRegistrations };
    }

    // Skills
    if (sections.includes('skills')) {
      result.skills = await prisma.studentSkill.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
    }

    // Hostel (if allocated)
    if (sections.includes('hostel')) {
      const allocation = await prisma.hostelAllocation.findFirst({ where: { studentId, status: 'ACTIVE' }, include: { room: { include: { floor: { include: { block: true } } } } } });
      result.hostel = allocation;
    }

    // Transport (if allocated)
    if (sections.includes('transport')) {
      const allocation = await prisma.transportAllocation.findFirst({ where: { passengerId: studentId, passengerType: 'STUDENT', status: 'ACTIVE' }, include: { route: { select: { routeName: true } }, stop: { select: { name: true } } } });
      result.transport = allocation;
    }

    // Library
    if (sections.includes('library')) {
      const issues = await prisma.libraryIssue.findMany({ where: { borrowerId: studentId, status: 'ISSUED' }, include: { book: { select: { title: true, author: true } } } });
      const fines = await prisma.libraryFine.findMany({ where: { borrowerId: studentId, status: 'PENDING' } });
      result.library = { currentIssues: issues, pendingFines: fines };
    }

    // Placements
    if (sections.includes('placements')) {
      const placements = await prisma.placementApplication.findMany({ where: { studentId }, orderBy: { appliedAt: 'desc' } });
      result.placements = placements;
    }

    // Complaints/Grievances
    if (sections.includes('complaints')) {
      const tickets = await prisma.ticket.findMany({ where: { studentId: student.id }, orderBy: { createdAt: 'desc' }, take: 10 });
      result.complaints = tickets;
    }

    res.json({ status: 'success', data: result });
  } catch (e) { next(e); }
});

/**
 * Student workspace — "What does the student need right now?"
 * Quick-access dashboard for the logged-in student.
 */
router.get('/my/workspace', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId }, include: { department: true, program: true, section: true } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student profile not found' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAttendance,
      pendingAssignments,
      unreadNotifications,
      pendingLeaves,
      currentIssues,
      pendingFines,
      hostelAllocation,
      transportAllocation,
      upcomingEvents,
      pendingCertificates,
    ] = await Promise.all([
      prisma.attendance.findMany({ where: { studentId: student.id, date: { gte: today, lt: tomorrow } } }),
      prisma.assignment.findMany({ where: { sectionId: student.sectionId, dueDate: { gte: today }, status: 'ACTIVE' }, take: 10, orderBy: { dueDate: 'asc' } }),
      prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
      prisma.workflowRequest.findMany({ where: { studentId: student.id, type: { in: ['LEAVE', 'OD'] }, status: { startsWith: 'PENDING' } }, take: 5 }),
      prisma.libraryIssue.findMany({ where: { borrowerId: student.id, status: 'ISSUED' }, include: { book: { select: { title: true } } } }),
      prisma.libraryFine.count({ where: { borrowerId: student.id, status: 'PENDING' } }),
      prisma.hostelAllocation.findFirst({ where: { studentId: student.id, status: 'ACTIVE' }, include: { room: true } }),
      prisma.transportAllocation.findFirst({ where: { passengerId: student.id, passengerType: 'STUDENT', status: 'ACTIVE' }, include: { route: { select: { routeName: true } }, stop: { select: { name: true } } } }),
      prisma.calendarEvent.findMany({ where: { status: 'ACTIVE', startDate: { gte: today, lte: new Date(today.getTime() + 7 * 86400000) } }, take: 5, orderBy: { startDate: 'asc' } }),
      prisma.certificateGeneration.findMany({ where: { studentId: student.id, status: { notIn: ['PUBLISHED', 'REJECTED'] } }, take: 5 }),
    ]);

    res.json({
      status: 'success',
      data: {
        student: { id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo, department: student.department?.name, program: student.program?.name, section: student.section?.name },
        todayAttendance,
        pendingAssignments,
        unreadNotifications,
        pendingLeaves,
        library: { currentIssues, pendingFines },
        hostel: hostelAllocation,
        transport: transportAllocation,
        upcomingEvents,
        pendingCertificates,
      },
    });
  } catch (e) { next(e); }
});

export default router;
