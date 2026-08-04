import { prisma } from '../../lib/prisma';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '../../utils/exceptions';

export class ParentService {
  /**
   * Get Parent Profile & Linked Children
   */
  async getLinkedChildren(userId: string) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            student: {
              include: {
                department: true,
                program: true,
                course: true,
                semester: true,
                section: true,
                mentor: true,
              },
            },
          },
        },
      },
    });

    if (!parentProfile) {
      // Fallback: search by parent phone/email matching user phone/email
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('Parent user not found');

      const matchedStudents = await prisma.student.findMany({
        where: {
          OR: [
            { parentEmail: user.email },
            { parentPhone: user.phone || '' },
          ],
          deleted: false,
        },
        include: {
          department: true,
          program: true,
          course: true,
          semester: true,
          section: true,
          mentor: true,
        },
      });

      return matchedStudents.map((s) => ({
        id: s.id,
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        departmentName: s.department?.name,
        programCode: s.program?.code,
        courseName: s.course?.name,
        semesterNumber: s.semester?.number,
        sectionName: s.section?.name,
        mentorName: s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : 'Unassigned',
        mentorPhone: s.mentor?.phone,
        mentorEmail: s.mentor?.email,
      }));
    }

    return parentProfile.students.map((r) => ({
      id: r.student.id,
      admissionNo: r.student.admissionNo,
      firstName: r.student.firstName,
      lastName: r.student.lastName,
      departmentName: r.student.department?.name,
      programCode: r.student.program?.code,
      courseName: r.student.course?.name,
      semesterNumber: r.student.semester?.number,
      sectionName: r.student.section?.name,
      mentorName: r.student.mentor ? `${r.student.mentor.firstName} ${r.student.mentor.lastName}` : 'Unassigned',
      mentorPhone: r.student.mentor?.phone,
      mentorEmail: r.student.mentor?.email,
    }));
  }

  /**
   * Verify that the parent owns/is linked to the requested student
   */
  async verifyParentChildLink(userId: string, studentId: string) {
    const children = await this.getLinkedChildren(userId);
    const linked = children.some((c) => c.id === studentId);
    if (!linked) {
      throw new ForbiddenException('Access denied. You can only view details for your linked child.');
    }
  }

  /**
   * Get Child Attendance
   */
  async getChildAttendance(userId: string, studentId: string) {
    await this.verifyParentChildLink(userId, studentId);

    const records = await prisma.attendance.findMany({
      where: { studentId, deleted: false },
      include: { subject: true },
      orderBy: { date: 'desc' },
      take: 100,
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const percentage = total > 0 ? ((present + late * 0.5) / total) * 100 : 100;

    return {
      summary: {
        totalSessions: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        attendancePercentage: Math.round(percentage * 10) / 10,
      },
      recentRecords: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        status: r.status,
        subjectName: r.subject?.name || 'General Daily Attendance',
        remarks: r.remarks,
      })),
    };
  }

  /**
   * Get Child Academic Marks & Results
   */
  async getChildMarks(userId: string, studentId: string) {
    await this.verifyParentChildLink(userId, studentId);

    const marks = await prisma.mark.findMany({
      where: { studentId, deleted: false },
      include: { subject: true, exam: true },
      orderBy: { createdAt: 'desc' },
    });

    return marks.map((m) => ({
      id: m.id,
      examName: m.exam?.name,
      subjectName: m.subject?.name,
      subjectCode: m.subject?.code,
      internalMarks: m.internalMarks,
      externalMarks: m.externalMarks,
      practicalMarks: m.practicalMarks,
      totalMarks: m.internalMarks + m.externalMarks + m.practicalMarks,
      grade: m.grade,
      gpa: m.gpa,
      status: m.status,
    }));
  }

  /**
   * Get Child Fee Bills & Payment History
   */
  async getChildFees(userId: string, studentId: string) {
    await this.verifyParentChildLink(userId, studentId);

    const feeBills = await prisma.feeBill.findMany({
      where: { studentId, deleted: false },
      include: { category: true },
      orderBy: { billingDate: 'desc' },
    });

    return feeBills.map((b) => ({
      id: b.id,
      categoryName: b.category?.name || 'Semester Fee',
      amount: b.amount,
      discount: b.scholarshipDiscount,
      fine: b.fine,
      paidAmount: b.paidAmount,
      balanceDue: Math.max(0, b.amount + b.fine - b.scholarshipDiscount - b.paidAmount),
      status: b.status,
      dueDate: b.dueDate.toISOString(),
      billingDate: b.billingDate.toISOString(),
    }));
  }

  /**
   * Get Child Leave & OD Requests
   */
  async getChildLeaveOd(userId: string, studentId: string) {
    await this.verifyParentChildLink(userId, studentId);

    const requests = await prisma.studentLeaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      type: r.type,
      category: r.requestCategory,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Get Child Timetable
   */
  async getChildTimetable(userId: string, studentId: string) {
    await this.verifyParentChildLink(userId, studentId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true, semesterId: true, departmentId: true },
    });

    if (!student || !student.sectionId) return [];

    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId: student.sectionId },
      include: { subject: true, faculty: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
    });

    return slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      slotIndex: s.slotIndex,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectName: s.subject?.name,
      facultyName: `${s.faculty?.firstName} ${s.faculty?.lastName}`,
      roomNo: s.roomNo,
    }));
  }

  /**
   * Contact Mentor
   */
  async contactMentor(userId: string, studentId: string, message: string) {
    await this.verifyParentChildLink(userId, studentId);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { mentor: true },
    });

    if (!student || !student.mentor) {
      throw new NotFoundException('No assigned mentor found for your child');
    }

    const parentUser = await prisma.user.findUnique({ where: { id: userId } });

    // Send notification to Mentor
    if (student.mentor.userId) {
      await prisma.notification.create({
        data: {
          recipientId: student.mentor.userId,
          eventType: 'PARENT_MESSAGE',
          title: `Parent Message regarding ${student.firstName} ${student.lastName}`,
          message: `Parent (${parentUser?.firstName} ${parentUser?.lastName}): ${message}`,
          deliveryState: 'DELIVERED',
        },
      });
    }

    return {
      status: 'success',
      message: `Your message has been sent to Mentor (${student.mentor.firstName} ${student.mentor.lastName}).`,
    };
  }
}
