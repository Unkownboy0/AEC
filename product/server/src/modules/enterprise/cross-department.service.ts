import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export interface WorkloadBreakdown {
  facultyId: string;
  employeeId: string;
  name: string;
  homeDepartment: { id: string; name: string; code: string };
  homeDeptHours: number;
  crossDeptTeaching: Array<{
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    sectionName?: string;
    hoursPerWeek: number;
  }>;
  crossDeptHours: number;
  projectHours: number;
  mentoredStudentsCount: number;
  totalTeachingHours: number;
  maxWeeklyCapacity: number;
  utilizationPercentage: number;
}

export class CrossDepartmentService {
  /**
   * Calculate complete aggregated workload across home and all teaching departments.
   */
  static async calculateFacultyWorkload(facultyId: string): Promise<WorkloadBreakdown> {
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        department: true,
        timetableSlots: {
          include: {
            subject: true,
            department: true,
            section: true,
          },
        },
        teachingAssignments: {
          where: { status: 'ACTIVE' },
          include: {
            teachingDepartment: true,
            subject: true,
          },
        },
        mentoredStudents: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });

    if (!faculty) {
      throw new Error(`Faculty not found with ID: ${facultyId}`);
    }

    const homeDeptId = faculty.departmentId;
    let homeDeptHours = 0;
    const crossDeptMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      sectionName?: string;
      hoursPerWeek: number;
    }>();

    // Calculate hours from published timetable slots
    for (const slot of faculty.timetableSlots) {
      if (slot.departmentId === homeDeptId) {
        homeDeptHours += 1;
      } else {
        const key = `${slot.departmentId}_${slot.subjectId}`;
        const existing = crossDeptMap.get(key);
        if (existing) {
          existing.hoursPerWeek += 1;
        } else {
          crossDeptMap.set(key, {
            departmentId: slot.department.id,
            departmentName: slot.department.name,
            departmentCode: slot.department.code,
            subjectId: slot.subject.id,
            subjectName: slot.subject.name,
            subjectCode: slot.subject.code,
            sectionName: slot.section?.name,
            hoursPerWeek: 1,
          });
        }
      }
    }

    // Also factor active formal teaching assignments if timetable slots not yet mapped
    for (const assign of faculty.teachingAssignments) {
      const key = `${assign.teachingDepartmentId}_${assign.subjectId}`;
      if (!crossDeptMap.has(key)) {
        crossDeptMap.set(key, {
          departmentId: assign.teachingDepartment.id,
          departmentName: assign.teachingDepartment.name,
          departmentCode: assign.teachingDepartment.code,
          subjectId: assign.subject.id,
          subjectName: assign.subject.name,
          subjectCode: assign.subject.code,
          hoursPerWeek: assign.periodsPerWeek,
        });
      }
    }

    const crossDeptTeaching = Array.from(crossDeptMap.values());
    const crossDeptHours = crossDeptTeaching.reduce((acc, curr) => acc + curr.hoursPerWeek, 0);
    const projectHours = 2; // Standard institutional cap for faculty project supervision
    const mentoredCount = faculty.mentoredStudents.length;
    const totalTeachingHours = homeDeptHours + crossDeptHours + projectHours;
    const maxCapacity = 20; // 20 hours/week norm
    const utilization = Math.round((totalTeachingHours / maxCapacity) * 100);

    return {
      facultyId: faculty.id,
      employeeId: faculty.employeeId,
      name: `${faculty.firstName} ${faculty.lastName}`,
      homeDepartment: {
        id: faculty.department.id,
        name: faculty.department.name,
        code: faculty.department.code,
      },
      homeDeptHours,
      crossDeptTeaching,
      crossDeptHours,
      projectHours,
      mentoredStudentsCount: mentoredCount,
      totalTeachingHours,
      maxWeeklyCapacity: maxCapacity,
      utilizationPercentage: utilization,
    };
  }

  /**
   * Request cross-department teaching assignment.
   */
  static async requestTeachingAssignment(params: {
    facultyId: string;
    teachingDepartmentId: string;
    subjectId: string;
    sectionId?: string;
    semesterId?: string;
    academicYearId?: string;
    periodsPerWeek?: number;
    requestedById: string;
    remarks?: string;
  }) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
      include: { department: true },
    });

    if (!faculty) throw new Error('Faculty not found');

    const assignment = await prisma.facultyTeachingAssignment.create({
      data: {
        facultyId: faculty.id,
        homeDepartmentId: faculty.departmentId,
        teachingDepartmentId: params.teachingDepartmentId,
        subjectId: params.subjectId,
        sectionId: params.sectionId,
        semesterId: params.semesterId,
        academicYearId: params.academicYearId,
        periodsPerWeek: params.periodsPerWeek || 3,
        status: 'REQUESTED',
        requestedById: params.requestedById,
        remarks: params.remarks,
      },
      include: {
        faculty: true,
        homeDepartment: true,
        teachingDepartment: true,
        subject: true,
      },
    });

    logger.info(`[CrossDepartment] Teaching assignment requested: ${assignment.id} for Faculty ${faculty.employeeId}`);
    return assignment;
  }

  /**
   * Approve cross-department teaching assignment.
   */
  static async approveTeachingAssignment(assignmentId: string, approvedById: string) {
    const assignment = await prisma.facultyTeachingAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'ACTIVE',
        approvedById,
      },
      include: {
        faculty: true,
        homeDepartment: true,
        teachingDepartment: true,
        subject: true,
      },
    });

    logger.info(`[CrossDepartment] Teaching assignment ${assignmentId} activated by ${approvedById}`);
    return assignment;
  }

  /**
   * Propose a permanent department transfer for a faculty member.
   */
  static async proposeDepartmentTransfer(params: {
    facultyId: string;
    toDepartmentId: string;
    effectiveDate: Date;
    reason: string;
    designationImpact?: string;
    handoverNotes?: any;
    supportingDocUrl?: string;
    initiatedById: string;
    initiatedByName: string;
  }) {
    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
      include: { department: true },
    });

    if (!faculty) throw new Error('Faculty not found');
    if (faculty.departmentId === params.toDepartmentId) {
      throw new Error('Faculty is already assigned to this department');
    }

    const year = new Date().getFullYear();
    const count = await prisma.facultyDepartmentTransfer.count();
    const transferNumber = `TRF-${year}-${String(count + 1).padStart(4, '0')}`;

    const initialHistory = [{
      role: 'INITIATOR',
      approverId: params.initiatedById,
      approverName: params.initiatedByName,
      action: 'PROPOSE',
      comments: params.reason,
      timestamp: new Date().toISOString(),
    }];

    const transfer = await prisma.facultyDepartmentTransfer.create({
      data: {
        transferNumber,
        facultyId: faculty.id,
        fromDepartmentId: faculty.departmentId,
        toDepartmentId: params.toDepartmentId,
        effectiveDate: new Date(params.effectiveDate),
        reason: params.reason,
        designationImpact: params.designationImpact,
        handoverNotes: params.handoverNotes ? JSON.stringify(params.handoverNotes) : null,
        supportingDocUrl: params.supportingDocUrl,
        status: 'PROPOSED',
        currentApproverRole: 'RECEIVING_HOD',
        approvalHistory: JSON.stringify(initialHistory),
        initiatedById: params.initiatedById,
      },
      include: {
        faculty: true,
        fromDepartment: true,
        toDepartment: true,
      },
    });

    logger.info(`[DepartmentTransfer] Proposed ${transferNumber} for ${faculty.firstName} ${faculty.lastName}`);
    return transfer;
  }

  /**
   * Process step in department transfer workflow.
   */
  static async processTransferStep(params: {
    transferId: string;
    action: 'APPROVE' | 'REJECT';
    approverId: string;
    approverName: string;
    approverRole: string;
    comments?: string;
  }) {
    const transfer = await prisma.facultyDepartmentTransfer.findUnique({
      where: { id: params.transferId },
      include: { faculty: true, fromDepartment: true, toDepartment: true },
    });

    if (!transfer) throw new Error('Transfer request not found');

    const history = JSON.parse(transfer.approvalHistory || '[]');
    history.push({
      role: params.approverRole,
      approverId: params.approverId,
      approverName: params.approverName,
      action: params.action,
      comments: params.comments || '',
      timestamp: new Date().toISOString(),
    });

    if (params.action === 'REJECT') {
      return prisma.facultyDepartmentTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'REJECTED',
          approvalHistory: JSON.stringify(history),
        },
      });
    }

    // Role progression: RECEIVING_HOD -> HR -> VP -> PRINCIPAL -> COMPLETED
    let nextStatus = transfer.status;
    let nextRole = transfer.currentApproverRole;

    if (transfer.currentApproverRole === 'RECEIVING_HOD') {
      nextStatus = 'RECEIVING_HOD_APPROVED';
      nextRole = 'HR';
    } else if (transfer.currentApproverRole === 'HR') {
      nextStatus = 'HR_APPROVED';
      nextRole = 'VP';
    } else if (transfer.currentApproverRole === 'VP') {
      nextStatus = 'VP_APPROVED';
      nextRole = 'PRINCIPAL';
    } else if (transfer.currentApproverRole === 'PRINCIPAL') {
      nextStatus = 'COMPLETED';
      nextRole = 'COMPLETED';

      // EXECUTE PERMANENT TRANSFER
      // Update Faculty home department to the new department
      await prisma.faculty.update({
        where: { id: transfer.facultyId },
        data: { departmentId: transfer.toDepartmentId },
      });

      // Update User account departmentId if linked
      if (transfer.faculty.userId) {
        await prisma.user.update({
          where: { id: transfer.faculty.userId },
          data: { departmentId: transfer.toDepartmentId },
        });
      }

      logger.info(`[DepartmentTransfer] Executed permanent transfer: Faculty ${transfer.faculty.employeeId} now in ${transfer.toDepartment.name}`);
    }

    return prisma.facultyDepartmentTransfer.update({
      where: { id: transfer.id },
      data: {
        status: nextStatus,
        currentApproverRole: nextRole,
        approvalHistory: JSON.stringify(history),
        completedAt: nextStatus === 'COMPLETED' ? new Date() : null,
      },
      include: {
        faculty: true,
        fromDepartment: true,
        toDepartment: true,
      },
    });
  }

  /**
   * Get HOD view of faculty segregated into Home Department Faculty and Cross-Department Teaching Faculty.
   */
  static async getDepartmentFacultyRoster(departmentId: string) {
    // 1. Home Department Faculty
    const homeFaculty = await prisma.faculty.findMany({
      where: { departmentId, status: 'ACTIVE' },
      include: {
        user: { select: { id: true, email: true, status: true } },
        timetableSlots: {
          include: { subject: true, section: true, department: true },
        },
        teachingAssignments: {
          where: { status: 'ACTIVE' },
          include: { teachingDepartment: true, subject: true },
        },
      },
    });

    // 2. Cross-Department Faculty teaching in this department
    const crossAssignments = await prisma.facultyTeachingAssignment.findMany({
      where: {
        teachingDepartmentId: departmentId,
        status: 'ACTIVE',
      },
      include: {
        faculty: {
          include: {
            department: true,
            user: { select: { id: true, email: true } },
            timetableSlots: {
              where: { departmentId },
              include: { subject: true, section: true },
            },
          },
        },
        subject: true,
      },
    });

    // Group cross-department faculty without duplicates
    const crossFacultyMap = new Map<string, any>();
    for (const ca of crossAssignments) {
      if (!crossFacultyMap.has(ca.facultyId)) {
        crossFacultyMap.set(ca.facultyId, {
          ...ca.faculty,
          teachingAssignment: ca,
          teachingSubjects: [ca.subject],
        });
      } else {
        crossFacultyMap.get(ca.facultyId).teachingSubjects.push(ca.subject);
      }
    }

    const crossDepartmentFaculty = Array.from(crossFacultyMap.values());

    return {
      departmentId,
      homeFacultyCount: homeFaculty.length,
      crossDepartmentFacultyCount: crossDepartmentFaculty.length,
      totalActiveFaculty: homeFaculty.length + crossDepartmentFaculty.length,
      homeFaculty,
      crossDepartmentFaculty,
    };
  }
}
