import { prisma } from '../../lib/prisma';
import { HodLeaveOdQueryFilters } from './hod.types';

export class HodRepository {
  /**
   * Get HOD Dashboard metrics strictly for departmentId
   */
  async getDashboardMetrics(departmentId: string) {
    const [
      slLeave,
      slOd,
      wfLeave,
      wfOd,
    ] = await Promise.all([
      prisma.studentLeaveRequest.count({
        where: {
          student: { departmentId },
          type: 'LEAVE',
          OR: [
            { workflowStatus: 'PENDING_HOD' },
            { status: 'PENDING_HOD' },
            { status: 'APPROVED_MENTOR' }
          ]
        },
      }),
      prisma.studentLeaveRequest.count({
        where: {
          student: { departmentId },
          type: 'ON_DUTY',
          OR: [
            { workflowStatus: 'PENDING_HOD' },
            { status: 'PENDING_HOD' },
            { status: 'APPROVED_MENTOR' }
          ]
        },
      }),
      prisma.workflowRequest.count({
        where: {
          OR: [{ departmentId }, { student: { departmentId } }],
          type: { in: ['LEAVE', 'FACULTY_LEAVE'] },
          status: { in: ['PENDING', 'MENTOR_APPROVED'] },
        },
      }),
      prisma.workflowRequest.count({
        where: {
          OR: [{ departmentId }, { student: { departmentId } }],
          type: { in: ['OD', 'FACULTY_OD', 'ON_DUTY'] },
          status: { in: ['PENDING', 'MENTOR_APPROVED'] },
        },
      }),
    ]);

    const pendingLeaveRequests = slLeave + wfLeave;
    const pendingOdRequests = slOd + wfOd;

    const [
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      totalMentors,
      unassignedStudents,
      emergencyRequests,
      attendanceCorrectionRequests,
      facultyLeaveRequests,
      pendingTasks,
      overdueTasks,
      activeComplaints,
      upcomingEvents,
    ] = await Promise.all([
      prisma.student.count({ where: { departmentId } }),
      prisma.student.count({ where: { departmentId, status: 'ACTIVE' } }),
      prisma.faculty.count({ where: { departmentId } }),
      prisma.faculty.count({ where: { departmentId, status: 'ACTIVE' } }),
      prisma.faculty.count({ where: { departmentId } }),
      prisma.student.count({ where: { departmentId, mentorId: null } }),
      prisma.studentLeaveRequest.count({
        where: { student: { departmentId }, isEmergency: true, workflowStatus: 'PENDING_HOD' },
      }),
      (prisma as any).attendanceCorrection ? (prisma as any).attendanceCorrection.count({
        where: { student: { departmentId }, status: 'PENDING' },
      }) : 0,
      prisma.workflowRequest.count({
        where: { OR: [{ departmentId }, { facultyRequester: { departmentId } }], facultyRequesterId: { not: null }, status: { in: ['PENDING', 'HOD_APPROVED'] } },
      }),
      prisma.task.count({
        where: { departmentId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      prisma.task.count({
        where: { departmentId, status: { in: ['PENDING', 'IN_PROGRESS'] }, dueDate: { lt: new Date() } },
      }),
      (prisma as any).complaint ? (prisma as any).complaint.count({
        where: { departmentId, status: { in: ['NEW', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'ACTION_REQUIRED'] } },
      }) : 0,
      (prisma as any).departmentActivity ? (prisma as any).departmentActivity.count({
        where: { departmentId, startDate: { gte: new Date() } },
      }) : 0,
    ]);

    return {
      totalStudents,
      activeStudents,
      totalFaculty,
      activeFaculty,
      totalMentors,
      unassignedStudents,
      pendingLeaveRequests,
      pendingOdRequests,
      emergencyRequests,
      attendanceCorrectionRequests,
      facultyLeaveRequests,
      pendingTasks,
      overdueTasks,
      activeComplaints,
      upcomingEvents,
    };
  }

  /**
   * Fetch Leave and OD Requests for HOD Approval Desk
   */
  async getLeaveOdRequests(departmentId: string, filters: HodLeaveOdQueryFilters) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 50;
    const skip = (page - 1) * limit;

    // 1. Fetch from StudentLeaveRequest table
    const slWhere: any = { student: { departmentId } };
    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'PENDING' || filters.status === 'PENDING_HOD') {
        slWhere.workflowStatus = 'PENDING_HOD';
      } else {
        slWhere.workflowStatus = filters.status;
      }
    }
    if (filters.requestType && filters.requestType !== 'ALL') {
      slWhere.type = filters.requestType === 'OD' ? 'ON_DUTY' : filters.requestType;
    }
    if (filters.isEmergency) slWhere.isEmergency = true;

    // 2. Fetch from WorkflowRequest table
    const wfWhere: any = {
      OR: [
        { departmentId },
        { student: { departmentId } },
        { facultyRequester: { departmentId } },
      ],
    };
    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'PENDING' || filters.status === 'PENDING_HOD') {
        wfWhere.status = { in: ['PENDING', 'MENTOR_APPROVED'] };
      } else if (filters.status === 'APPROVED') {
        wfWhere.status = 'APPROVED';
      } else if (filters.status === 'REJECTED') {
        wfWhere.status = { contains: 'REJECT' };
      }
    }

    const [slItems, wfItems] = await Promise.all([
      prisma.studentLeaveRequest.findMany({
        where: slWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: true,
              section: true,
              mentor: { include: { user: true } },
            },
          },
        },
      }),
      prisma.workflowRequest.findMany({
        where: wfWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              department: true,
              section: true,
              user: true,
            },
          },
          facultyRequester: {
            include: {
              department: true,
              user: true,
            },
          },
        },
      }),
    ]);

    // Format WorkflowRequests into unified items
    const formattedWfItems = wfItems.map((wf: any) => {
      let wfStatus = 'PENDING_HOD';
      if (wf.status === 'APPROVED' || wf.currentStep === 'COMPLETED') wfStatus = 'APPROVED';
      else if (wf.status.includes('REJECT')) wfStatus = 'REJECTED';
      else if (wf.status === 'CLARIFICATION_REQUESTED') wfStatus = 'RETURNED';

      const reqType = wf.type === 'OD' || wf.type === 'FACULTY_OD' || wf.type === 'ON_DUTY' ? 'ON_DUTY' : 'LEAVE';

      const studentObj = wf.student
        ? {
            id: wf.student.id,
            firstName: wf.student.firstName,
            lastName: wf.student.lastName,
            admissionNo: wf.student.admissionNo || 'N/A',
            department: wf.student.department,
            section: wf.student.section,
          }
        : wf.facultyRequester
        ? {
            id: wf.facultyRequester.id,
            firstName: wf.facultyRequester.firstName,
            lastName: wf.facultyRequester.lastName,
            admissionNo: `FAC: ${wf.facultyRequester.employeeId || 'N/A'}`,
            department: wf.facultyRequester.department,
          }
        : {
            id: 'UNKNOWN',
            firstName: 'System',
            lastName: 'User',
            admissionNo: 'N/A',
          };

      const start = wf.startDate ? new Date(wf.startDate) : new Date(wf.createdAt);
      const end = wf.endDate ? new Date(wf.endDate) : start;
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

      return {
        id: wf.id,
        requestNumber: `REQ-${wf.id.slice(0, 6).toUpperCase()}`,
        type: reqType,
        requestCategory: wf.type,
        reason: wf.reason || wf.title || 'Leave/OD Request',
        description: wf.title,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalDays: days,
        status: wf.status,
        workflowStatus: wfStatus,
        student: studentObj,
        createdAt: new Date(wf.createdAt).toISOString(),
        isWorkflowRequest: true,
      };
    });

    // Format StudentLeaveRequests
    const formattedSlItems = slItems.map((sl: any) => ({
      ...sl,
      startDate: new Date(sl.startDate).toISOString(),
      endDate: new Date(sl.endDate).toISOString(),
      createdAt: new Date(sl.createdAt).toISOString(),
      isWorkflowRequest: false,
    }));

    // Deduplicate and combine (prefer WorkflowRequest if duplicate IDs exist)
    const combinedMap = new Map<string, any>();
    formattedSlItems.forEach((item: any) => combinedMap.set(item.id, item));
    formattedWfItems.forEach((item: any) => combinedMap.set(item.id, item));

    let allItems = Array.from(combinedMap.values());

    if (filters.search) {
      const q = filters.search.toLowerCase();
      allItems = allItems.filter(
        (i: any) =>
          i.requestNumber?.toLowerCase().includes(q) ||
          i.reason?.toLowerCase().includes(q) ||
          `${i.student?.firstName || ''} ${i.student?.lastName || ''}`.toLowerCase().includes(q) ||
          i.student?.admissionNo?.toLowerCase().includes(q)
      );
    }

    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allItems.length;
    const items = allItems.slice(skip, skip + limit);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single Leave/OD request by ID within department
   */
  async getLeaveOdRequestById(id: string, departmentId: string) {
    return prisma.studentLeaveRequest.findFirst({
      where: {
        id,
        student: { departmentId },
      },
      include: {
        student: {
          include: {
            user: true,
            section: true,
            program: true,
            mentor: { include: { user: true } },
          },
        },
      },
    });
  }

  /**
   * Get Department Students
   */
  async getDepartmentStudents(departmentId: string, filters: any) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { departmentId };

    if (filters.year) {
      where.year = Number(filters.year);
    }
    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }
    if (filters.mentorId) {
      where.mentorId = filters.mentorId;
    }
    if (filters.search) {
      where.OR = [
        { admissionNo: { contains: filters.search } },
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { user: { email: { contains: filters.search } } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { admissionNo: 'asc' },
        include: {
          user: true,
          section: true,
          program: true,
          mentor: { include: { user: true } },
        },
      }),
    ]);

    return { total, students, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get Department Faculty List
   */
  async getDepartmentFaculty(departmentId: string, filters: any) {
    const where: any = { departmentId };
    if (filters.search) {
      where.OR = [
        { employeeId: { contains: filters.search } },
        { user: { firstName: { contains: filters.search } } },
        { user: { lastName: { contains: filters.search } } },
      ];
    }

    return prisma.faculty.findMany({
      where,
      orderBy: { employeeId: 'asc' },
      include: {
        user: true,
        subjectAssignments: {
          include: {
            subject: true,
            section: true,
          },
        },
      },
    });
  }
}
