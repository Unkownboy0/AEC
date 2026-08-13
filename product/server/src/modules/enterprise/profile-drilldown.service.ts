import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { RequesterIdentity, StudentAccessService } from '../security/student-access.service';

export class ProfileDrilldownService {
  /**
   * Universal 360° Profile Aggregator for any User / Student / Faculty ID
   */
  async getUser360Profile(targetId: string, requester: RequesterIdentity) {
    await StudentAccessService.assertCanViewUser(requester, targetId);
    let user: any = null;
    let studentRecord: any = null;
    let facultyRecord: any = null;

    try {
      // 1. Try finding User by ID, email, or username
      user = await prisma.user.findFirst({
        where: {
          OR: [{ id: targetId }, { email: targetId }, { username: targetId }],
        },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    } catch (e) {
      console.error('Error finding user in getUser360Profile:', e);
    }

    if (user) {
      try {
        studentRecord = await prisma.student.findFirst({
          where: { userId: user.id },
          include: {
            department: true,
            program: true,
            course: true,
            semester: true,
            section: true,
            academicYear: true,
            mentor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true } },
            parentRelations: {
              include: { parent: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } } } },
            },
            attendanceRecords: { take: 50, orderBy: { date: 'desc' } },
            marks: { include: { subject: { select: { name: true, code: true, credits: true } } } },
            submissions: { include: { assignment: { select: { title: true, maxMarks: true } } } },
            counselingRecords: { include: { mentor: { select: { firstName: true, lastName: true } } } },
            feeBills: true,
            internships: { include: { documents: true } },
            placementApplications: { include: { drive: true } },
          },
        });
      } catch (e) {
        console.error('Error fetching student record by userId:', e);
      }

      try {
        facultyRecord = await prisma.faculty.findFirst({
          where: { userId: user.id },
          include: {
            department: true,
            assignedSubjects: true,
            subjectAssignments: { include: { subject: true, section: true } },
            timetableSlots: { include: { subject: true, section: true } },
            mentoredStudents: { select: { id: true, admissionNo: true, firstName: true, lastName: true, email: true, userId: true } },
            appliedLeaves: { orderBy: { createdAt: 'desc' } },
          },
        });
      } catch (e) {
        console.error('Error fetching faculty record by userId:', e);
      }
    } else {
      // 2. Try finding Student by ID, admissionNo, email, or userId
      try {
        studentRecord = await prisma.student.findFirst({
          where: {
            OR: [{ id: targetId }, { admissionNo: targetId }, { email: targetId }, { userId: targetId }],
          },
          include: {
            user: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
            department: true,
            program: true,
            course: true,
            semester: true,
            section: true,
            academicYear: true,
            mentor: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, userId: true } },
            parentRelations: {
              include: { parent: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } } } },
            },
            attendanceRecords: { take: 50, orderBy: { date: 'desc' } },
            marks: { include: { subject: { select: { name: true, code: true, credits: true } } } },
            submissions: { include: { assignment: { select: { title: true, maxMarks: true } } } },
            feeBills: true,
            internships: true,
            placementApplications: { include: { drive: true } },
          },
        });

        if (studentRecord && studentRecord.user) {
          user = studentRecord.user;
        }
      } catch (e) {
        console.error('Error finding student record:', e);
      }

      if (!user && !studentRecord) {
        // 3. Try finding Faculty by ID, employeeId, email, or userId
        try {
          facultyRecord = await prisma.faculty.findFirst({
            where: {
              OR: [{ id: targetId }, { employeeId: targetId }, { email: targetId }, { userId: targetId }],
            },
            include: {
              user: {
                include: {
                  role: {
                    include: { permissions: { include: { permission: true } } },
                  },
                },
              },
              department: true,
              assignedSubjects: true,
              subjectAssignments: { include: { subject: true, section: true } },
              timetableSlots: { include: { subject: true, section: true } },
              mentoredStudents: { select: { id: true, admissionNo: true, firstName: true, lastName: true, email: true, userId: true } },
              appliedLeaves: { orderBy: { createdAt: 'desc' } },
            },
          });

          if (facultyRecord && facultyRecord.user) {
            user = facultyRecord.user;
          }
        } catch (e) {
          console.error('Error finding faculty record:', e);
        }
      }
    }

    if (!user && !studentRecord && !facultyRecord) {
      throw new NotFoundException('Profile not found');
    }

    const userId = user?.id || '';
    const roleName = typeof user?.role === 'object' ? user?.role?.name : (user?.role || (studentRecord ? 'Student' : 'Faculty'));

    // Fetch Assigned Tasks / Works safely
    let assignedTasks: any[] = [];
    try {
      if (userId) {
        assignedTasks = await (prisma as any).task.findMany({
          where: {
            OR: [
              { createdById: userId },
              { assignees: { some: { assigneeId: userId } } },
            ],
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            assignees: { include: { assignee: { select: { id: true, firstName: true, lastName: true, email: true } } } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
        });
      }
    } catch (err) {
      assignedTasks = [];
    }

    // Fetch Audit Logs safely
    let auditLogs: any[] = [];
    try {
      if (userId) {
        auditLogs = await (prisma as any).auditLog.findMany({
          where: { actorId: userId },
          take: 15,
          orderBy: { timestamp: 'desc' },
        });
      }
    } catch (err) {
      auditLogs = [];
    }

    // Extract RBAC permissions matrix
    const permissionsMatrix = user?.role?.permissions
      ? user.role.permissions.map((rp: any) => ({
          name: rp.permission?.name,
          description: rp.permission?.description,
        }))
      : [];

    const resolvedDepartmentId = studentRecord?.departmentId || facultyRecord?.departmentId || user?.departmentId;
    const hod = resolvedDepartmentId
      ? await prisma.user.findFirst({
          where: {
            status: 'ACTIVE',
            role: { name: { in: ['HOD', 'Head of Department'] } },
            OR: [
              { departmentId: resolvedDepartmentId },
              { departmentMemberships: { some: { departmentId: resolvedDepartmentId, role: 'HOD' } } },
            ],
          },
          select: { id: true, firstName: true, lastName: true },
        })
      : null;

    const departmentTree = [
      hod ? { role: 'HOD', name: `${hod.firstName} ${hod.lastName}`.trim(), path: `/profile/${hod.id}` } : null,
      studentRecord?.mentor ? {
        role: 'Mentor',
        name: `${studentRecord.mentor.firstName} ${studentRecord.mentor.lastName}`.trim(),
        path: `/profile/${studentRecord.mentor.userId || studentRecord.mentor.id}`,
      } : null,
      facultyRecord ? {
        role: 'Faculty',
        name: `${facultyRecord.firstName} ${facultyRecord.lastName}`.trim(),
        path: `/profile/${facultyRecord.userId || facultyRecord.id}`,
      } : null,
      studentRecord ? {
        role: 'Student',
        name: `${studentRecord.firstName} ${studentRecord.lastName}`.trim(),
        path: `/profile/${studentRecord.userId || studentRecord.id}`,
      } : null,
    ].filter(Boolean);

    return {
      user: {
        id: userId || targetId,
        email: user?.email || studentRecord?.email || facultyRecord?.email || null,
        firstName: user?.firstName || studentRecord?.firstName || facultyRecord?.firstName || null,
        lastName: user?.lastName || studentRecord?.lastName || facultyRecord?.lastName || null,
        profilePhoto: user?.profilePhoto || null,
        role: roleName,
        status: user?.status || studentRecord?.status || facultyRecord?.status || null,
        onlineStatus: user?.loginStatus || null,
        phone: studentRecord?.phone || facultyRecord?.phone || user?.phone || null,
        bloodGroup: studentRecord?.bloodGroup || user?.bloodGroup || null,
        dob: studentRecord?.dob
          ? new Date(studentRecord.dob).toISOString().split('T')[0]
          : facultyRecord?.dob
            ? new Date(facultyRecord.dob).toISOString().split('T')[0]
            : user?.dob
              ? new Date(user.dob).toISOString().split('T')[0]
              : null,
        joiningDate: facultyRecord?.dateOfJoining
          ? new Date(facultyRecord.dateOfJoining).toISOString().split('T')[0]
          : user?.joiningDate
            ? new Date(user.joiningDate).toISOString().split('T')[0]
            : null,
        designation: facultyRecord?.designation || user?.designation || roleName || null,
        qualification: facultyRecord?.qualification || user?.qualification || null,
        experience: facultyRecord?.experience != null
          ? `${facultyRecord.experience} Years`
          : user?.experience || null,
        officeRoom: facultyRecord?.officeRoom || null,
        reportingOfficer: hod ? `${hod.firstName} ${hod.lastName}`.trim() : null,
      },
      permissionsMatrix,
      studentRecord,
      facultyRecord,
      assignedTasks,
      auditLogs,
      departmentTree,
    };
  }

  /**
   * Get 360° Comprehensive Student Profile
   */
  async getStudent360Profile(studentId: string, requester: RequesterIdentity) {
    await StudentAccessService.assertCanViewStudent(requester, studentId);
    return this.getUser360Profile(studentId, requester);
  }

  /**
   * Get 360° Comprehensive Faculty Profile
   */
  async getFaculty360Profile(facultyId: string, requester: RequesterIdentity) {
    return this.getUser360Profile(facultyId, requester);
  }

  /**
   * Universal Enterprise Deep Search Engine
   */
  async enterpriseDeepSearch(queryStr: string) {
    const query = (queryStr || '').trim();
    if (!query || query.length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const [students, faculty, departments, programs, subjects, tasks, circulars, studentLeaves, facultyLeaves] = await Promise.all([
      prisma.student.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { admissionNo: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
          deleted: false,
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, admissionNo: true, email: true, departmentId: true, userId: true },
      }).catch(() => []),
      prisma.faculty.findMany({
        where: {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { employeeId: { contains: query } },
            { email: { contains: query } },
            { designation: { contains: query } },
          ],
          deleted: false,
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, designation: true, departmentId: true, userId: true },
      }).catch(() => []),
      prisma.department.findMany({
        where: {
          OR: [{ name: { contains: query } }, { code: { contains: query } }],
          status: 'ACTIVE',
        },
        take: 5,
        select: { id: true, name: true, code: true },
      }).catch(() => []),
      prisma.program.findMany({
        where: {
          OR: [{ name: { contains: query } }, { code: { contains: query } }],
          status: 'ACTIVE',
        },
        take: 5,
        select: { id: true, name: true, code: true },
      }).catch(() => []),
      prisma.subject.findMany({
        where: {
          OR: [{ name: { contains: query } }, { code: { contains: query } }],
          status: 'ACTIVE',
        },
        take: 5,
        select: { id: true, name: true, code: true },
      }).catch(() => []),
      prisma.task.findMany({
        where: {
          OR: [{ title: { contains: query } }, { taskNumber: { contains: query } }],
        },
        take: 5,
        select: { id: true, taskNumber: true, title: true, status: true },
      }).catch(() => []),
      prisma.institutionalCircular.findMany({
        where: {
          OR: [{ title: { contains: query } }, { circularNumber: { contains: query } }],
        },
        take: 5,
        select: { id: true, circularNumber: true, title: true, broadcastLevel: true },
      }).catch(() => []),
      prisma.studentLeaveRequest.findMany({
        where: {
          OR: [{ requestNumber: { contains: query } }, { reason: { contains: query } }],
        },
        take: 5,
        select: { id: true, requestNumber: true, type: true, status: true },
      }).catch(() => []),
      prisma.facultyLeaveRequest.findMany({
        where: {
          OR: [{ requestNumber: { contains: query } }, { reason: { contains: query } }],
        },
        take: 5,
        select: { id: true, requestNumber: true, leaveType: true, status: true },
      }).catch(() => []),
    ]);

    return {
      students,
      faculty,
      departments,
      programs,
      subjects,
      tasks,
      circulars,
      studentLeaves,
      facultyLeaves,
    };
  }
}
