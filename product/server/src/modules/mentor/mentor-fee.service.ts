import { prisma } from '../../lib/prisma';
import { NotFoundException, ForbiddenException, BadRequestException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';

export interface MentorFeeAssessmentPayload {
  categoryId?: string;
  categoryName?: string; // e.g. "Tuition Fee", "Hostel Fee", "Mess Fee", "Transport Fee", "Special Fee"
  amount: number;
  dueDate: string;
  scholarshipDiscount?: number;
  remarks?: string;
  reason: string;
  academicYearLabel?: string;
  semesterLabel?: string;
}

export class MentorFeeService {
  /**
   * Helper: Ensure faculty profile exists
   */
  private async getFacultyByUserId(userId: string) {
    const faculty = await (prisma as any).faculty.findFirst({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty profile not found for this user account');
    return faculty;
  }

  /**
   * Helper: Ensure student is assigned to mentor
   */
  private async assertMentee(facultyId: string, studentId: string, userRole?: string) {
    if (['Super Admin', 'College Admin', 'SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(userRole || '')) {
      const student = await (prisma as any).student.findUnique({
        where: { id: studentId },
        include: { department: true, section: true, semester: true },
      });
      if (!student) throw new NotFoundException('Student not found');
      return student;
    }

    const student = await (prisma as any).student.findFirst({
      where: {
        id: studentId,
        deleted: false,
        OR: [
          { mentorId: facultyId },
          { mentorAssignments: { some: { mentorId: facultyId, status: 'ACTIVE' } } },
        ],
      },
      include: { department: true, section: true, semester: true },
    });

    if (!student) {
      throw new ForbiddenException('Access denied: You can only manage fee details for assigned mentees');
    }
    return student;
  }

  /**
   * Check Mentor Fee Permission Pack
   */
  private checkMentorFeePermission(userPermissions: string[], requiredAction: string, userRole?: string) {
    if (['Super Admin', 'SUPER_ADMIN', 'College Admin', 'COLLEGE_ADMIN'].includes(userRole || '')) {
      return true;
    }

    // Default permissions check or explicit MENTOR_FEE_* flags
    const hasExplicit = userPermissions.some(
      (p) => p === requiredAction || p === 'MENTOR_FEE_ALL' || p === 'fees:write' || p === '*'
    );

    // If super admin has enabled general mentor fee management
    const hasMentorRole = ['Mentor', 'Faculty', 'HOD'].includes(userRole || '');
    if (hasExplicit || hasMentorRole) {
      return true;
    }

    throw new ForbiddenException(`Permission denied: Action '${requiredAction}' is not permitted for your role.`);
  }

  /**
   * Get Fee Overview & Bills for an Assigned Mentee
   */
  async getStudentFees(userId: string, studentId: string, userRole?: string) {
    const faculty = await this.getFacultyByUserId(userId);
    const student = await this.assertMentee(faculty.id, studentId, userRole);

    const [bills, payments, feeCategories, audits] = await Promise.all([
      (prisma as any).feeBill.findMany({
        where: { studentId: student.id, deleted: false },
        include: { category: true, payments: true },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).feePayment.findMany({
        where: { studentId: student.id },
        include: { bill: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      (prisma as any).feeCategory.findMany({
        where: { status: 'ACTIVE', deleted: false },
        orderBy: { name: 'asc' },
      }),
      (prisma as any).mentorFeeAudit.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const totalAssessed = bills.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
    const totalScholarship = bills.reduce((sum: number, b: any) => sum + (b.scholarshipDiscount || 0), 0);
    const totalFines = bills.reduce((sum: number, b: any) => sum + (b.fine || 0), 0);
    const totalPaid = payments
      .filter((p: any) => p.status === 'SUCCEEDED' || p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    const outstanding = totalAssessed - totalScholarship + totalFines - totalPaid;

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        department: student.department?.name,
        section: student.section?.name,
        scholarshipScheme: student.scholarship,
        residentialType: student.residentialType || 'DAY_SCHOLAR',
        transportMode: student.transportMode || 'OTHER',
      },
      summary: {
        totalAssessed,
        totalScholarship,
        totalFines,
        totalPaid,
        outstanding: Math.max(0, outstanding),
      },
      bills,
      payments,
      feeCategories,
      recentAudits: audits,
    };
  }

  /**
   * Create/Assess Fee for Assigned Mentee
   */
  async assessFee(
    userId: string,
    studentId: string,
    payload: MentorFeeAssessmentPayload,
    userPermissions: string[] = [],
    userRole?: string
  ) {
    this.checkMentorFeePermission(userPermissions, 'MENTOR_FEE_ADD', userRole);
    const faculty = await this.getFacultyByUserId(userId);
    const student = await this.assertMentee(faculty.id, studentId, userRole);

    if (payload.amount == null || payload.amount < 0) {
      throw new BadRequestException('Fee amount must be a positive number');
    }
    if (!payload.reason || !payload.reason.trim()) {
      throw new BadRequestException('Reason for fee assessment is required for audit integrity');
    }

    // Resolve or find fee category
    let categoryId = payload.categoryId;
    if (!categoryId && payload.categoryName) {
      let category = await (prisma as any).feeCategory.findFirst({
        where: { name: payload.categoryName },
      });
      if (!category) {
        category = await (prisma as any).feeCategory.create({
          data: {
            name: payload.categoryName,
            amount: payload.amount,
            status: 'ACTIVE',
          },
        });
      }
      categoryId = category.id;
    }

    if (!categoryId) {
      const defaultCategory = await (prisma as any).feeCategory.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (defaultCategory) categoryId = defaultCategory.id;
      else {
        const created = await (prisma as any).feeCategory.create({
          data: { name: 'General Student Fee', amount: payload.amount, status: 'ACTIVE' },
        });
        categoryId = created.id;
      }
    }

    const dueDate = payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 30 * 86400000);
    const invoiceNumber = `BILL-${student.admissionNo}-${Date.now().toString(36).toUpperCase()}`;

    const bill = await (prisma as any).feeBill.create({
      data: {
        studentId: student.id,
        categoryId,
        amount: Number(payload.amount),
        scholarshipDiscount: Number(payload.scholarshipDiscount || 0),
        fine: 0,
        paidAmount: 0,
        status: 'PENDING',
        billingDate: new Date(),
        dueDate,
        invoiceNumber,
        academicYearLabel: payload.academicYearLabel || '2026-2027',
        semesterLabel: payload.semesterLabel || student.semester?.name || 'Semester 1',
      },
      include: { category: true },
    });

    // Record Mentor Fee Audit
    await (prisma as any).mentorFeeAudit.create({
      data: {
        studentId: student.id,
        mentorId: faculty.id,
        feeHead: bill.category?.name || 'Fee',
        oldAmount: 0,
        newAmount: Number(payload.amount),
        newDueDate: dueDate,
        reason: payload.reason,
        remarks: payload.remarks || null,
        permissionUsed: 'MENTOR_FEE_ADD',
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'MENTOR_FEE_ASSESSED',
      entityType: 'FEE_BILL',
      entityId: bill.id,
      description: `Mentor ${faculty.firstName} ${faculty.lastName} assessed fee of ₹${payload.amount} for student ${student.admissionNo}. Reason: ${payload.reason}`,
      newValues: { studentId: student.id, amount: payload.amount, invoiceNumber },
    });

    return bill;
  }

  /**
   * Update Fee Due Date / Amount / Remarks for Mentee
   */
  async updateFeeBill(
    userId: string,
    studentId: string,
    billId: string,
    payload: Partial<MentorFeeAssessmentPayload>,
    userPermissions: string[] = [],
    userRole?: string
  ) {
    this.checkMentorFeePermission(userPermissions, 'MENTOR_FEE_EDIT', userRole);
    const faculty = await this.getFacultyByUserId(userId);
    const student = await this.assertMentee(faculty.id, studentId, userRole);

    const existingBill = await (prisma as any).feeBill.findFirst({
      where: { id: billId, studentId: student.id },
      include: { category: true },
    });
    if (!existingBill) {
      throw new NotFoundException('Fee bill not found for this student');
    }

    const updateData: any = {};
    const oldAmount = existingBill.amount;
    const oldDueDate = existingBill.dueDate;

    if (payload.amount !== undefined) {
      if (payload.amount < 0) throw new BadRequestException('Amount cannot be negative');
      updateData.amount = Number(payload.amount);
    }
    if (payload.scholarshipDiscount !== undefined) {
      updateData.scholarshipDiscount = Number(payload.scholarshipDiscount);
    }
    if (payload.dueDate) {
      updateData.dueDate = new Date(payload.dueDate);
    }

    const updatedBill = await (prisma as any).feeBill.update({
      where: { id: billId },
      data: updateData,
      include: { category: true },
    });

    // Record Audit
    await (prisma as any).mentorFeeAudit.create({
      data: {
        studentId: student.id,
        mentorId: faculty.id,
        feeHead: existingBill.category?.name || 'Fee',
        oldAmount,
        newAmount: updatedBill.amount,
        oldDueDate,
        newDueDate: updatedBill.dueDate,
        reason: payload.reason || 'Mentor fee adjustment',
        remarks: payload.remarks || null,
        permissionUsed: 'MENTOR_FEE_EDIT',
      },
    });

    await AuditService.log({
      actorId: userId,
      action: 'MENTOR_FEE_UPDATED',
      entityType: 'FEE_BILL',
      entityId: billId,
      description: `Mentor updated fee bill ${billId} for ${student.admissionNo} from ₹${oldAmount} to ₹${updatedBill.amount}.`,
      newValues: { oldAmount, newAmount: updatedBill.amount, oldDueDate, newDueDate: updatedBill.dueDate },
    });

    return updatedBill;
  }
}
