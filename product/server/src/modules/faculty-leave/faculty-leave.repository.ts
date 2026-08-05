import { prisma } from '../../lib/prisma';
import { CreateFacultyLeaveOdDto } from './faculty-leave.validation';

export class FacultyLeaveRepository {
  /**
   * Find logged-in faculty with department details.
   */
  async findFacultyByUserId(userId: string) {
    return prisma.faculty.findFirst({
      where: {
        OR: [{ userId }, { email: { equals: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email } }],
        deleted: false,
      },
      include: {
        department: true,
      },
    });
  }

  /**
   * Resolve active HOD for a department.
   */
  async findDepartmentHod(departmentId: string) {
    const activeAssignment = await (prisma as any).departmentHodAssignment.findFirst({
      where: { departmentId, isActive: true },
      include: { hodUser: true },
    });
    if (activeAssignment?.hodUser) {
      return activeAssignment.hodUser;
    }
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (dept?.hodUserId) {
      const u = await prisma.user.findUnique({ where: { id: dept.hodUserId } });
      if (u) return u;
    }
    if (dept?.hodId) {
      const hodFaculty = await prisma.faculty.findUnique({
        where: { id: dept.hodId },
        include: { user: true },
      });
      if (hodFaculty?.user) return hodFaculty.user;
    }
    const hodFaculty = await prisma.faculty.findFirst({
      where: { departmentId, status: 'ACTIVE', userId: { not: null } } as any,
      include: { user: true },
    });
    if (hodFaculty?.user) return hodFaculty.user;

    const anyHodUser = await prisma.user.findFirst({
      where: { role: { name: 'HOD' } },
    });
    if (anyHodUser) return anyHodUser;

    return prisma.user.findFirst({
      where: { role: { name: { in: ['Principal', 'Vice Principal', 'Academic Dean', 'Super Admin'] } } },
    });
  }


  /**
   * Create WorkflowRequest and WorkflowHistory in transaction.
   */
  async createLeaveOdRequest(data: {
    requestNumber: string;
    facultyRequesterId: string;
    departmentId: string;
    type: 'LEAVE' | 'ON_DUTY';
    title: string;
    category: string;
    reason: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    isHalfDay: boolean;
    startTime?: string | null;
    endTime?: string | null;
    totalDays: number;
    isEmergency: boolean;
    contactNumber?: string | null;
    attachments: string;
    workHandoverDetails?: string | null;
    preferredSubstituteId?: string | null;
    status: string;
    currentStep: string;
    historyComment: string;
    actorUserId: string;
    actorName: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.workflowRequest.create({
        data: {
          facultyRequesterId: data.facultyRequesterId,
          departmentId: data.departmentId,
          type: data.type === 'LEAVE' ? 'LEAVE' : 'ON_DUTY',
          title: data.title,
          reason: `${data.category}: ${data.reason}`,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          currentStep: data.currentStep,
          attachments: data.attachments,
        },
      });


      await tx.workflowHistory.create({
        data: {
          requestId: request.id,
          stage: 'FACULTY',
          action: 'SUBMIT',
          comment: data.historyComment,
          actionById: data.actorUserId,
          actionByName: data.actorName,
        },
      });

      return request;
    });
  }

  /**
   * Find request by ID with full details.
   */
  async findById(requestId: string) {
    const req = await (prisma as any).workflowRequest.findUnique({
      where: { id: requestId },
      include: {
        facultyRequester: {
          include: {
            department: true,
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!req) return null;

    // Load substitute faculty if assigned
    let preferredSubstitute = null;
    let confirmedSubstitute = null;

    if ((req as any).preferredSubstituteId) {
      preferredSubstitute = await prisma.faculty.findUnique({
        where: { id: (req as any).preferredSubstituteId },
        select: { id: true, firstName: true, lastName: true, designation: true },
      });
    }
    if ((req as any).confirmedSubstituteId) {
      confirmedSubstitute = await prisma.faculty.findUnique({
        where: { id: (req as any).confirmedSubstituteId },
        select: { id: true, firstName: true, lastName: true, designation: true },
      });
    }

    return {
      ...req,
      preferredSubstitute,
      confirmedSubstitute,
    };
  }

  /**
   * List requests for a Faculty.
   */
  async findByFacultyId(facultyId: string) {
    return (prisma as any).workflowRequest.findMany({
      where: { facultyRequesterId: facultyId },
      orderBy: { createdAt: 'desc' },
      include: {
        facultyRequester: {
          include: {
            department: { select: { id: true, name: true, code: true } },
          },
        },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  /**
   * List requests for HOD department queue.
   */
  async findForHodQueue(departmentId: string, filterStatus?: string) {
    const where: any = {
      departmentId,
      facultyRequesterId: { not: null },
    };

    if (filterStatus && filterStatus !== 'ALL') {
      if (filterStatus === 'PENDING') {
        where.currentStep = 'HOD';
        where.status = { in: ['PENDING', 'SUBMITTED', 'PENDING_HOD'] };
      } else if (filterStatus === 'RECOMMENDED' || filterStatus === 'FORWARDED') {
        where.status = { in: ['HOD_APPROVED', 'RECOMMENDED', 'PENDING_PRINCIPAL'] };
      } else if (filterStatus === 'REJECTED') {
        where.status = { in: ['REJECTED_BY_HOD', 'REJECTED'] };
      } else if (filterStatus === 'RETURNED') {
        where.status = { in: ['RETURNED_TO_FACULTY', 'CLARIFICATION_REQUESTED'] };
      } else if (filterStatus === 'EMERGENCY') {
        where.isEmergency = true;
      }
    }

    return (prisma as any).workflowRequest.findMany({
      where,
      orderBy: [{ isEmergency: 'desc' }, { createdAt: 'desc' }],
      include: {
        facultyRequester: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, employeeId: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        history: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }


  /**
   * Calculate live summary cards for HOD dashboard.
   */
  async getHodSummaryCards(departmentId: string) {
    const all = await (prisma as any).workflowRequest.findMany({
      where: { departmentId, facultyRequesterId: { not: null } },
      select: { id: true, status: true, currentStep: true, isEmergency: true, type: true, startDate: true, endDate: true },
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const pendingLeave = all.filter((r: any) => r.type === 'LEAVE' && (r.currentStep === 'HOD' || r.status === 'PENDING')).length;
    const pendingOd = all.filter((r: any) => r.type === 'ON_DUTY' && (r.currentStep === 'HOD' || r.status === 'PENDING')).length;
    const emergencyRequests = all.filter((r: any) => r.isEmergency && r.status !== 'APPROVED' && r.status !== 'REJECTED').length;
    const awaitingClarification = all.filter((r: any) => r.status === 'CLARIFICATION_REQUESTED' || r.status === 'RETURNED_TO_FACULTY').length;
    const recommendedToday = all.filter((r: any) => r.status === 'HOD_APPROVED' || r.status === 'RECOMMENDED').length;
    const rejectedToday = all.filter((r: any) => r.status === 'REJECTED_BY_HOD' || r.status === 'REJECTED').length;
    const returnedRequests = all.filter((r: any) => r.status === 'RETURNED_TO_FACULTY').length;
    const forwardedToPrincipal = all.filter((r: any) => r.status === 'HOD_APPROVED' || r.currentStep === 'PRINCIPAL').length;

    // Currently on leave/OD
    const facultyOnLeave = all.filter((r: any) => r.type === 'LEAVE' && r.status === 'APPROVED' && r.startDate && new Date(r.startDate) <= now && r.endDate && new Date(r.endDate) >= now).length;
    const facultyOnOd = all.filter((r: any) => r.type === 'ON_DUTY' && r.status === 'APPROVED' && r.startDate && new Date(r.startDate) <= now && r.endDate && new Date(r.endDate) >= now).length;

    return {
      pendingFacultyLeave: pendingLeave,
      pendingFacultyOd: pendingOd,
      emergencyRequests,
      awaitingClarification,
      recommendedToday,
      rejectedToday,
      returnedRequests,
      forwardedToPrincipal,
      facultyCurrentlyOnLeave: facultyOnLeave,
      facultyCurrentlyOnOd: facultyOnOd,
      substituteFacultyRequired: pendingLeave + pendingOd,
      unreadNotifications: 0,
    };
  }

  /**
   * Count total requests (for request number generation).
   */
  async countTotalRequests(): Promise<number> {
    return prisma.workflowRequest.count();
  }
}
