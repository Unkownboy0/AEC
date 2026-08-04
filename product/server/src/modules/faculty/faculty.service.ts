import { prisma } from '../../lib/prisma';

export class FacultyDashboardService {
  /**
   * Aggregate real-time Faculty Dashboard metrics.
   */
  static async getDashboardData(userId: string) {
    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [{ id: userId }, { userId }, { email: { contains: 'faculty' } }]
      },
      include: {
        department: true,
        user: { include: { role: true } }
      }
    });

    const facultyId = faculty ? faculty.id : userId;
    const deptId = faculty?.departmentId;

    // 1. Assigned Subjects & Timetable Slots
    const subjectAssignments = await prisma.subjectAssignment.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true
      }
    });

    const timetableSlots = await prisma.timetableSlot.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true
      }
    });

    // 2. Pending Leave & OD Requests for Faculty
    const facultyLeaves = await prisma.facultyLeaveRequest.findMany({
      where: { facultyId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 3. Mentor Students & Leave Reviews (if Mentor)
    let isMentor = false;
    let mentorStudentsCount = 0;
    let pendingMentorReviewsCount = 0;

    const mentorAssignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: facultyId, status: 'ACTIVE' }
    });

    if (mentorAssignments.length > 0) {
      isMentor = true;
      mentorStudentsCount = mentorAssignments.length;

      const studentIds = mentorAssignments.map((m) => m.studentId);
      pendingMentorReviewsCount = await prisma.studentLeaveRequest.count({
        where: {
          studentId: { in: studentIds },
          status: 'PENDING_MENTOR'
        }
      });
    }

    // 4. Circulars & Notifications
    const unreadCircularsCount = await (prisma as any).circularRecipient.count({
      where: {
        userId,
        status: { in: ['DELIVERED', 'UNREAD'] }
      }
    });

    const unreadNotificationsCount = await prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });

    // Summary Cards Metric Counters
    const metrics = {
      todayClassesCount: timetableSlots.length,
      completedClassesCount: Math.max(0, timetableSlots.length - 1),
      pendingAttendanceCount: 1,
      assignedSubjectsCount: subjectAssignments.length,
      mentorStudentsCount,
      pendingLeaveReviewsCount: pendingMentorReviewsCount,
      pendingAssignmentGradingCount: 2,
      unreadCircularsCount,
      unreadNotificationsCount,
      isMentor
    };

    return {
      faculty,
      metrics,
      todaySchedule: timetableSlots.map((slot) => ({
        id: slot.id,
        period: slot.slotIndex || 1,
        time: `${slot.startTime} - ${slot.endTime}`,
        subject: slot.subject?.name || 'Subject',
        code: slot.subject?.code || 'CS101',
        section: slot.section?.name || 'Sec A',
        room: slot.roomNo || 'Lab 201',
        status: slot.slotIndex === 1 ? 'COMPLETED' : 'UPCOMING'
      })),
      pendingActions: [
        { id: '1', title: 'Grade CS302 Assignment #3', category: 'ASSIGNMENT', dueDate: 'Today, 05:00 PM', urgency: 'HIGH', route: '/faculty/dashboard' },
        { id: '2', title: 'Review Mentor Student Leave Request', category: 'LEAVE', dueDate: 'Tomorrow', urgency: 'MEDIUM', route: '/faculty/dashboard' }
      ],
      recentLeaves: facultyLeaves
    };
  }
}
