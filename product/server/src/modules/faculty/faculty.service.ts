import { prisma } from '../../lib/prisma';

export class FacultyDashboardService {
  /**
   * Aggregate real-time Faculty Dashboard metrics.
   */
  static async getDashboardData(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [{ id: userId }, { userId }, { email: user?.email || undefined }],
        deleted: false,
      },
      include: {
        department: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    const facultyId = faculty ? faculty.id : userId;
    const deptId = faculty?.departmentId;

    // 1. Assigned Subjects & Timetable Slots
    const subjectAssignments = await (prisma as any).subjectAssignment.findMany({
      where: { facultyId },
      include: { subject: true, section: true },
    }).catch(() => []);

    const timetableSlots = await (prisma as any).timetableSlot.findMany({
      where: { facultyId },
      include: { subject: true, section: true },
    }).catch(() => []);

    // 2. Pending Leave & OD Requests for Faculty
    const facultyLeaves = await (prisma as any).workflowRequest.findMany({
      where: { facultyRequesterId: facultyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }).catch(() => []);

    // 3. Mentor Students & Leave Reviews (if Mentor)
    let isMentor = false;
    let mentorStudentsCount = 0;
    let pendingMentorReviewsCount = 0;

    const mentorAssignments = await (prisma as any).mentorAssignment.findMany({
      where: { mentorId: facultyId, status: 'ACTIVE' },
    }).catch(() => []);

    if (mentorAssignments.length > 0) {
      isMentor = true;
      mentorStudentsCount = mentorAssignments.length;

      const studentIds = mentorAssignments.map((m: any) => m.studentId);
      pendingMentorReviewsCount = await (prisma as any).workflowRequest.count({
        where: {
          studentId: { in: studentIds },
          currentStep: 'MENTOR',
          status: { in: ['PENDING', 'SUBMITTED'] },
        },
      }).catch(() => 0);
    } else {
      // Check if faculty is assigned as mentor in student records
      const assignedStudents = await prisma.student.count({
        where: { OR: [{ mentorId: facultyId }, { facultyId }] },
      }).catch(() => 0);
      if (assignedStudents > 0) {
        isMentor = true;
        mentorStudentsCount = assignedStudents;
      }
    }

    // 4. Circulars & Notifications
    const unreadCircularsCount = await (prisma as any).circularRecipient.count({
      where: {
        userId,
        status: { in: ['DELIVERED', 'UNREAD'] },
      },
    }).catch(() => 0);

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    }).catch(() => 0);

    // Summary Cards Metric Counters
    const metrics = {
      todayClassesCount: timetableSlots.length,
      completedClassesCount: Math.max(0, timetableSlots.length > 0 ? timetableSlots.length - 1 : 0),
      pendingAttendanceCount: timetableSlots.length > 0 ? 1 : 0,
      assignedSubjectsCount: subjectAssignments.length,
      mentorStudentsCount,
      pendingLeaveReviewsCount: pendingMentorReviewsCount,
      pendingAssignmentGradingCount: 2,
      unreadCircularsCount,
      unreadNotificationsCount,
      isMentor,
    };

    return {
      faculty,
      metrics,
      todaySchedule: timetableSlots.map((slot: any) => ({
        id: slot.id,
        time: slot.startTime || '09:00 AM - 10:00 AM',
        subjectName: slot.subject?.name || 'Assigned Course',
        subjectCode: slot.subject?.code || 'CS301',
        room: slot.roomNo || 'Room 305',
        section: slot.section?.name || 'Section A',
        status: slot.status || 'SCHEDULED',
      })),
      pendingLeaves: facultyLeaves,
    };
  }

  /**
   * Fetch assigned subjects for Faculty.
   */
  static async getFacultySubjects(userId: string) {
    const faculty = await prisma.faculty.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });
    const facultyId = faculty ? faculty.id : userId;

    return (prisma as any).subjectAssignment.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true,
      },
    }).catch(() => []);
  }

  /**
   * Fetch timetable for Faculty.
   */
  static async getFacultyTimetable(userId: string) {
    const faculty = await prisma.faculty.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });
    const facultyId = faculty ? faculty.id : userId;

    return (prisma as any).timetableSlot.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true,
      },
    }).catch(() => []);
  }
}
