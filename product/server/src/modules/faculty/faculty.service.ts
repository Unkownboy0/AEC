import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { broadcastRBACUpdate } from '../../lib/socket';

export class FacultyDashboardService {
  private static async requireFaculty(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId, deleted: false, status: 'ACTIVE' } });
    if (!faculty) throw new ForbiddenException('An active Faculty profile is required');
    return faculty;
  }

  static async getTodayAttendanceSessions(userId: string) {
    const faculty = await this.requireFaculty(userId);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()];
    return prisma.timetableSlot.findMany({
      where: { facultyId: faculty.id, dayOfWeek },
      include: { subject: true, section: true, department: true },
      orderBy: { slotIndex: 'asc' },
    });
  }

  static async getAttendanceSession(userId: string, slotId: string, groupId?: string) {
    const faculty = await this.requireFaculty(userId);
    const slot = await prisma.timetableSlot.findFirst({
      where: { id: slotId, facultyId: faculty.id },
      include: { subject: true, section: true, department: true },
    });
    if (!slot) throw new NotFoundException('Scheduled class not found in your teaching allocation');
    let students;
    let teachingGroup = null;
    if (groupId) {
      teachingGroup = await prisma.teachingGroup.findFirst({
        where: { id: groupId, facultyId: faculty.id, subjectId: slot.subjectId, status: 'ACTIVE' },
        include: { sections: true, students: true },
      });
      if (!teachingGroup) throw new ForbiddenException('Combined teaching group is outside this class allocation');
      const sectionIds = teachingGroup.sections.map((item) => item.sectionId);
      const studentIds = teachingGroup.students.map((item) => item.studentId);
      students = await prisma.student.findMany({ where: { deleted: false, OR: [{ sectionId: { in: sectionIds } }, { id: { in: studentIds } }] }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] });
    } else {
      students = await prisma.student.findMany({ where: { sectionId: slot.sectionId, deleted: false }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] });
    }
    return {
      slot: { id: slot.id, subjectId: slot.subjectId, subject: slot.subject, section: slot.section, period: slot.slotIndex, room: slot.roomNo, startTime: slot.startTime, endTime: slot.endTime, date: new Date().toISOString().slice(0, 10) },
      teachingGroup: teachingGroup ? { id: teachingGroup.id, name: teachingGroup.name } : null,
      students: students.map((student) => ({ id: student.id, admissionNo: student.admissionNo, name: `${student.firstName} ${student.lastName}`, status: 'PRESENT' })),
    };
  }

  static async submitAttendanceSession(userId: string, slotId: string, input: { groupId?: string; date?: string; records?: Array<{ studentId: string; status: string; remarks?: string }> }) {
    if (!Array.isArray(input.records) || input.records.length === 0) throw new BadRequestException('Attendance records are required');
    const session = await this.getAttendanceSession(userId, slotId, input.groupId);
    const allowed = new Set(session.students.map((student) => student.id));
    if (input.records.some((record) => !allowed.has(record.studentId))) throw new ForbiddenException('Attendance contains a student outside this scheduled class');
    const validStatuses = new Set(['PRESENT', 'ABSENT', 'LATE', 'ON_DUTY', 'EXCUSED_LEAVE']);
    if (input.records.some((record) => !validStatuses.has(record.status))) throw new BadRequestException('Invalid attendance status');
    const faculty = await this.requireFaculty(userId);
    const date = input.date ? new Date(input.date) : new Date();
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid attendance date');
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);
    await prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { studentId: { in: input.records!.map((record) => record.studentId) }, subjectId: session.slot.subjectId, date: { gte: date, lt: nextDay }, type: `PERIOD_${session.slot.period}` } });
      await tx.attendance.createMany({ data: input.records!.map((record) => ({ date, status: record.status, type: `PERIOD_${session.slot.period}`, remarks: record.remarks, studentId: record.studentId, facultyId: faculty.id, subjectId: session.slot.subjectId })) });
    });
    broadcastRBACUpdate({ type: 'ATTENDANCE_UPDATED', payload: { departmentId: session.slot.section.departmentId, subjectId: session.slot.subjectId, slotId, count: input.records.length, recordedAt: new Date().toISOString() } });
    return { submitted: input.records.length, slot: session.slot, teachingGroup: session.teachingGroup };
  }
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
    if (!faculty) {
      throw new Error('Faculty profile not found');
    }

    const assignedDepartments = await prisma.departmentMembership.findMany({
      where: { userId, role: { in: ['FACULTY', 'MENTOR', 'MEMBER'] } },
      include: { department: true },
      orderBy: [{ isPrimary: 'desc' }, { department: { name: 'asc' } }],
    });
    if (!assignedDepartments.some((assignment) => assignment.departmentId === faculty.departmentId)) {
      assignedDepartments.unshift({
        id: `primary-${faculty.departmentId}`,
        userId,
        departmentId: faculty.departmentId,
        role: 'FACULTY',
        isPrimary: true,
        createdAt: faculty.createdAt,
        updatedAt: faculty.updatedAt,
        department: faculty.department,
      });
    }

    // 1. Assigned Subjects & Timetable Slots
    const subjectAssignments = await prisma.subjectAssignment.findMany({
      where: { facultyId },
      include: { subject: true, section: true },
    });

    const timetableSlots = await prisma.timetableSlot.findMany({
      where: { facultyId },
      include: { subject: true, section: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
    });

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

    const mentorAssignments = await prisma.mentorAssignment.findMany({
      where: { mentorId: facultyId, status: 'ACTIVE' },
    });

    if (mentorAssignments.length > 0) {
      isMentor = true;
      mentorStudentsCount = mentorAssignments.length;

      const studentIds = mentorAssignments.map((m: any) => m.studentId);
      pendingMentorReviewsCount = await prisma.workflowRequest.count({
        where: {
          studentId: { in: studentIds },
          currentStep: 'MENTOR',
          status: { in: ['PENDING', 'SUBMITTED'] },
        },
      });
    } else {
      // Check if faculty is assigned as mentor in student records
      const assignedStudents = await prisma.student.count({
        where: { OR: [{ mentorId: facultyId }, { facultyId }] },
      });
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

    const dayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][new Date().getDay()];
    const todaySlots = timetableSlots.filter((slot) => slot.dayOfWeek === dayName);
    const currentTime = new Date().toTimeString().slice(0, 5);
    const completedClassesCount = todaySlots.filter((slot) => slot.endTime <= currentTime).length;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const subjectsWithAttendance = await prisma.attendance.findMany({
      where: { facultyId, date: { gte: startOfToday, lt: endOfToday }, subjectId: { not: null } },
      distinct: ['subjectId'],
      select: { subjectId: true },
    });
    const attendanceSubjectIds = new Set(subjectsWithAttendance.map((record) => record.subjectId));
    const pendingAttendanceCount = todaySlots.filter(
      (slot) => slot.endTime <= currentTime && !attendanceSubjectIds.has(slot.subjectId)
    ).length;
    const pendingAssignmentGradingCount = await prisma.assignmentSubmission.count({
      where: { assignment: { facultyId }, status: 'SUBMITTED' },
    });
    const teachingGroups = await prisma.teachingGroup.findMany({
      where: { facultyId, status: 'ACTIVE' },
      include: {
        subject: true,
        departments: { include: { department: true } },
        sections: { include: { section: true } },
      },
      orderBy: { name: 'asc' },
    });

    const metrics = {
      todayClassesCount: todaySlots.length,
      completedClassesCount,
      pendingAttendanceCount,
      assignedSubjectsCount: subjectAssignments.length,
      mentorStudentsCount,
      pendingLeaveReviewsCount: pendingMentorReviewsCount,
      pendingAssignmentGradingCount,
      unreadCircularsCount,
      unreadNotificationsCount,
      isMentor,
    };

    return {
      faculty,
      assignedDepartments,
      teachingGroups,
      metrics,
      todaySchedule: todaySlots.map((slot) => ({
        id: slot.id,
        time: `${slot.startTime} - ${slot.endTime}`,
        subjectName: slot.subject.name,
        subjectCode: slot.subject.code,
        room: slot.roomNo,
        section: slot.section.name,
        status: slot.endTime <= currentTime ? 'COMPLETED' : 'SCHEDULED',
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

    return prisma.subjectAssignment.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true,
      },
    });
  }

  /**
   * Fetch timetable for Faculty.
   */
  static async getFacultyTimetable(userId: string) {
    const faculty = await prisma.faculty.findFirst({
      where: { OR: [{ id: userId }, { userId }] },
    });
    const facultyId = faculty ? faculty.id : userId;

    return prisma.timetableSlot.findMany({
      where: { facultyId },
      include: {
        subject: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
    });
  }
}
