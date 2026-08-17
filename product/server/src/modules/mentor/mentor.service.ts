import { prisma } from '../../lib/prisma';
import { NotFoundException, ForbiddenException, BadRequestException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../security/audit.service';
import { StudentLeaveService } from '../enterprise/student-leave.service';

export class MentorService {
  private async requireFaculty(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');
    return faculty;
  }

  private async requireMentee(facultyId: string, studentId: string) {
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        deleted: false,
        OR: [{ mentorId: facultyId }, { mentorAssignments: { some: { mentorId: facultyId, status: 'ACTIVE' } } }],
      },
    });
    if (!student) throw new ForbiddenException('Access denied: this student is not assigned to you');
    return student;
  }

  async getCounselingRecords(userId: string) {
    const faculty = await this.requireFaculty(userId);
    const records = await prisma.counselingRecord.findMany({
      where: { mentorId: faculty.id },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => ({
      ...record,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      date: record.createdAt.toISOString(),
    }));
  }

  /**
   * 1. Get Mentor Dashboard Stats
   */
  async getDashboardStats(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) {
      throw new NotFoundException('Mentor faculty profile not found for this user account');
    }

    const department = faculty.departmentId
      ? await prisma.department.findUnique({ where: { id: faculty.departmentId } })
      : null;

    const assignedStudents = await prisma.student.findMany({
      where: { deleted: false, OR: [{ mentorId: faculty.id }, { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } }] },
      include: {
        department: true,
        program: true,
        course: true,
        semester: true,
        section: true,
      },
    });

    const studentIds = assignedStudents.map((s) => s.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Pending Leave & OD Requests
    const pendingWhere = {
      OR: [
        { mentorId: faculty.id },
        { studentId: { in: studentIds } },
        { student: { mentorId: faculty.id } },
        { student: { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } } },
      ],
      status: 'PENDING_MENTOR',
    };

    const pendingLeaveRequests = await prisma.studentLeaveRequest.findMany({
      where: pendingWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
            department: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const pendingLeaveCount = await prisma.studentLeaveRequest.count({
      where: pendingWhere,
    });

    // Students on Leave / OD Today
    const studentsOnLeaveToday = await prisma.studentLeaveRequest.count({
      where: {
        studentId: { in: studentIds },
        status: 'APPROVED',
        startDate: { lte: tomorrow },
        endDate: { gte: today },
        type: 'LEAVE',
      },
    });

    const studentsOnOdToday = await prisma.studentLeaveRequest.count({
      where: {
        studentId: { in: studentIds },
        status: 'APPROVED',
        startDate: { lte: tomorrow },
        endDate: { gte: today },
        type: 'ON_DUTY',
      },
    });

    // Today's Attendance Overview
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: today, lt: tomorrow },
      },
    });

    const presentToday = todayAttendance.filter((a) => a.status === 'PRESENT').length;
    const absentToday = todayAttendance.filter((a) => a.status === 'ABSENT').length;

    // Counseling & Support Cases
    const openCounselingCases = await prisma.counselingRecord.count({
      where: { mentorId: faculty.id },
    });

    // Configurable risk thresholds — see settings.catalog.ts. Never hardcode
    // these; a college may set stricter/looser policy per SystemSetting.
    const [attendanceThresholdSetting, arrearThresholdSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: 'ATTENDANCE_RISK_THRESHOLD' }, select: { value: true } }),
      prisma.systemSetting.findUnique({ where: { key: 'ACADEMIC_RISK_ARREAR_THRESHOLD' }, select: { value: true } }),
    ]);
    const attendanceRiskThreshold = parseInt(attendanceThresholdSetting?.value || '75', 10);
    const arrearRiskThreshold = parseInt(arrearThresholdSetting?.value || '1', 10);

    // Attendance risk: overall attendance % (all-time, all recorded sessions)
    // below the configured threshold, computed per mentee.
    let attendanceRiskCount = 0;
    let academicRiskCount = 0;
    const riskStudentIds: string[] = [];
    const riskDetailByStudent = new Map<string, { attendancePercent: number | null; arrearCount: number; isAttendanceRisk: boolean; isAcademicRisk: boolean; reasons: string[] }>();

    if (studentIds.length > 0) {
      const [attendanceRows, arrearGroups] = await Promise.all([
        prisma.attendance.groupBy({
          by: ['studentId', 'status'],
          where: { studentId: { in: studentIds } },
          _count: { _all: true },
        }),
        prisma.mark.groupBy({
          by: ['studentId'],
          where: { studentId: { in: studentIds }, status: 'PUBLISHED', grade: 'F' },
          _count: { _all: true },
        }),
      ]);

      const perStudentAttendance = new Map<string, { present: number; total: number }>();
      for (const row of attendanceRows) {
        if (!row.studentId) continue;
        const entry = perStudentAttendance.get(row.studentId) || { present: 0, total: 0 };
        entry.total += row._count._all;
        if (row.status === 'PRESENT') entry.present += row._count._all;
        perStudentAttendance.set(row.studentId, entry);
      }

      const arrearsByStudent = new Map(
        arrearGroups.filter((g): g is typeof g & { studentId: string } => g.studentId !== null)
          .map((g) => [g.studentId, g._count._all])
      );

      for (const studentId of studentIds) {
        const att = perStudentAttendance.get(studentId);
        const pct = att && att.total > 0 ? (att.present / att.total) * 100 : 100;
        const arrears = arrearsByStudent.get(studentId) || 0;

        const isAttendanceRisk = att && att.total > 0 && pct < attendanceRiskThreshold;
        const isAcademicRisk = arrears >= arrearRiskThreshold;

        if (isAttendanceRisk) attendanceRiskCount++;
        if (isAcademicRisk) academicRiskCount++;
        if (isAttendanceRisk || isAcademicRisk) {
          riskStudentIds.push(studentId);
          riskDetailByStudent.set(studentId, {
            attendancePercent: att && att.total > 0 ? Math.round(pct * 10) / 10 : null,
            arrearCount: arrears,
            isAttendanceRisk: !!isAttendanceRisk,
            isAcademicRisk,
            reasons: [
              ...(isAttendanceRisk ? [`Attendance ${Math.round(pct * 10) / 10}% is below the ${attendanceRiskThreshold}% threshold`] : []),
              ...(isAcademicRisk ? [`${arrears} arrear${arrears === 1 ? '' : 's'} (threshold ${arrearRiskThreshold})`] : []),
            ],
          });
        }
      }
    }

    return {
      mentorInfo: {
        id: faculty.id,
        name: `${faculty.firstName} ${faculty.lastName}`,
        designation: faculty.designation,
        departmentName: department?.name,
      },
      metrics: {
        totalAssignedStudents: assignedStudents.length,
        presentToday,
        absentToday,
        studentsOnLeaveToday,
        studentsOnOdToday,
        pendingLeaveOdApprovals: pendingLeaveCount,
        openCounselingCases,
        attendanceRiskCount,
        academicRiskCount,
        attendanceRiskThreshold,
        arrearRiskThreshold,
      },
      pendingApprovals: pendingLeaveRequests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        studentId: r.studentId,
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        admissionNo: r.student.admissionNo,
        departmentName: r.student.department?.name,
        sectionName: r.student.section?.name,
        type: r.type,
        category: r.requestCategory,
        startDate: r.startDate.toISOString().split('T')[0],
        endDate: r.endDate.toISOString().split('T')[0],
        totalDays: r.totalDays,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      riskStudents: assignedStudents
        .filter((s) => riskStudentIds.includes(s.id))
        .map((s) => {
          const detail = riskDetailByStudent.get(s.id);
          return {
            id: s.id,
            admissionNo: s.admissionNo,
            name: `${s.firstName} ${s.lastName}`,
            attendancePercent: detail?.attendancePercent ?? null,
            arrearCount: detail?.arrearCount ?? 0,
            isAttendanceRisk: detail?.isAttendanceRisk ?? false,
            isAcademicRisk: detail?.isAcademicRisk ?? false,
            reason: detail?.reasons.join('; ') ?? '',
          };
        }),
      recentStudents: assignedStudents.slice(0, 10).map((s) => ({
        id: s.id,
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName}`,
        departmentName: s.department?.name,
        semesterNumber: s.semester?.number,
        sectionName: s.section?.name,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
      })),
    };
  }

  /**
   * 2. Get Assigned Student Roster
   */
  async getAssignedStudents(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');

    const students = await prisma.student.findMany({
      where: { deleted: false, OR: [{ mentorId: faculty.id }, { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } }] },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
      },
      orderBy: { admissionNo: 'asc' },
    });

    const studentIds = students.map((s) => s.id);
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId: { in: studentIds } },
    });

    return students.map((s) => {
      const records = attendanceRecords.filter((a) => a.studentId === s.id);
      const total = records.length;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

      let riskLevel = 'LOW';
      if (percentage < 65) riskLevel = 'CRITICAL';
      else if (percentage < 75) riskLevel = 'WARNING';

      return {
        id: s.id,
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName}`,
        departmentName: s.department?.name,
        programCode: s.program?.code,
        semesterNumber: s.semester?.number,
        sectionName: s.section?.name,
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        parentEmail: s.parentEmail,
        attendancePercentage: percentage,
        riskLevel,
      };
    });
  }

  /**
   * 2b. Get Assigned Student Academic Standing (CGPA + Active Arrears)
   *
   * Reuses the same real computation as getDashboardStats (published Mark
   * rows, grade === 'F' for arrears) plus the average published-mark GPA
   * pattern already used in enterprise.controller.ts's student dashboard.
   * Returns null for cgpa when the student has no published marks at all —
   * never a fabricated number.
   */
  async getAcademicStanding(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');

    const students = await prisma.student.findMany({
      where: { deleted: false, OR: [{ mentorId: faculty.id }, { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } }] },
      include: {
        department: true,
        program: true,
        semester: true,
        section: true,
      },
      orderBy: { admissionNo: 'asc' },
    });

    const studentIds = students.map((s) => s.id);

    const [publishedMarks, arrearGroups] = studentIds.length > 0
      ? await Promise.all([
          prisma.mark.findMany({
            where: { studentId: { in: studentIds }, status: 'PUBLISHED' },
            select: { studentId: true, gpa: true },
          }),
          prisma.mark.groupBy({
            by: ['studentId'],
            where: { studentId: { in: studentIds }, status: 'PUBLISHED', grade: 'F' },
            _count: { _all: true },
          }),
        ])
      : [[], []];

    const gpaByStudent = new Map<string, number[]>();
    for (const m of publishedMarks as { studentId: string; gpa: number }[]) {
      const arr = gpaByStudent.get(m.studentId) || [];
      arr.push(m.gpa);
      gpaByStudent.set(m.studentId, arr);
    }
    const arrearsByStudent = new Map((arrearGroups as { studentId: string; _count: { _all: number } }[]).map((g) => [g.studentId, g._count._all]));

    return students.map((s) => {
      const gpas = gpaByStudent.get(s.id);
      const cgpa = gpas && gpas.length > 0
        ? Math.round((gpas.reduce((sum, g) => sum + g, 0) / gpas.length) * 100) / 100
        : null;

      return {
        id: s.id,
        admissionNo: s.admissionNo,
        name: `${s.firstName} ${s.lastName}`,
        departmentName: s.department?.name,
        programCode: s.program?.code,
        semesterNumber: s.semester?.number,
        sectionName: s.section?.name,
        cgpa,
        arrearsCount: arrearsByStudent.get(s.id) || 0,
      };
    });
  }

  /**
   * 3. Get Student Detail
   */
  async getStudentDetail(userId: string, studentId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        program: true,
        course: true,
        semester: true,
        section: true,
      },
    });

    if (!student) throw new NotFoundException('Student record not found');
    await this.requireMentee(faculty.id, studentId);

    const [attendance, marks, leaveRequests, counseling] = await Promise.all([
      prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.mark.findMany({
        where: { studentId },
        include: { subject: true, exam: true },
      }),
      prisma.studentLeaveRequest.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.counselingRecord.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      student,
      recentAttendance: attendance,
      academicMarks: marks,
      leaveRequests,
      counselingRecords: counseling,
    };
  }

  /**
   * 4. Get Pending Student Leave & OD Requests
   */
  async getPendingLeaveOdRequests(userId: string) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');

    const requests = await prisma.studentLeaveRequest.findMany({
      where: {
        OR: [
          { mentorId: faculty.id },
          { student: { mentorId: faculty.id } },
          { student: { mentorAssignments: { some: { mentorId: faculty.id, status: 'ACTIVE' } } } },
        ],
        status: 'PENDING_MENTOR',
      },
      include: {
        student: {
          include: {
            department: true,
            section: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      admissionNo: r.student.admissionNo,
      departmentName: r.student.department?.name,
      sectionName: r.student.section?.name,
      type: r.type,
      category: r.requestCategory,
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * 4b. Get Single Leave/OD Request Detail for Mentor Review
   * Validates that the authenticated user is the assigned mentor for this student.
   */
  async getLeaveRequestDetail(userId: string, requestId: string) {
    const studentLeaveService = new StudentLeaveService();
    return studentLeaveService.getRequestDetails(requestId, userId);
  }

  /**
   * 5. Review Student Leave / OD Request (Mentor Approval -> Forward to Active HOD)
   * Delegates to StudentLeaveService.mentorReview to ensure unified workflow processing,
   * audit history, HOD resolution, and domain event notifications.
   */
  async reviewStudentLeaveOd(userId: string, requestId: string, payload: {
    action: 'APPROVE' | 'REJECT' | 'RETURN';
    remarks?: string;
  }) {
    const studentLeaveService = new StudentLeaveService();
    return studentLeaveService.mentorReview(
      userId,
      requestId,
      payload.action,
      payload.remarks
    );
  }

  /**
   * 6. Add Counseling / Support Note
   */
  async addCounselingNote(userId: string, studentId: string, payload: {
    notes: string;
    actionTaken?: string;
  }) {
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Mentor faculty profile not found');
    await this.requireMentee(faculty.id, studentId);
    if (!payload.notes?.trim()) throw new BadRequestException('Mentor note is required');

    const note = await prisma.counselingRecord.create({
      data: {
        studentId,
        mentorId: faculty.id,
        notes: payload.notes,
        actionTaken: payload.actionTaken || null,
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'COUNSELING_NOTE_ADDED',
      entityType: 'COUNSELING',
      entityId: studentId,
      description: `Mentor added counseling note for student`,
    });

    return note;
  }
}
