import { prisma } from '../../lib/prisma';

export interface FieldPolicyContext {
  requestingUserId: string;
  requestingUserRole: string;
  targetEntityType: 'STUDENT' | 'FACULTY' | 'PARENT';
  targetEntityId: string;
}

export class ProfileFieldPolicyService {
  /**
   * Filter Student Record based on viewer's role and permission scope
   */
  static async filterStudentProfile(studentData: any, context: FieldPolicyContext) {
    if (!studentData) return null;

    const { requestingUserId, requestingUserRole, targetEntityId } = context;

    // Super Admin / Principal gets complete institutional view
    if (['Super Admin', 'Principal'].includes(requestingUserRole)) {
      return this.sanitizeSensitiveFields(studentData, false);
    }

    // Student viewing self
    if (requestingUserRole === 'Student' && studentData.userId === requestingUserId) {
      return this.sanitizeSensitiveFields(studentData, false);
    }

    // Mentor viewing assigned mentee
    if (requestingUserRole === 'Mentor' || requestingUserRole === 'Faculty') {
      const isAssignedMentor = studentData.mentorId === targetEntityId || studentData.mentor?.userId === requestingUserId;
      if (isAssignedMentor) {
        return this.sanitizeSensitiveFields(studentData, false);
      }
    }

    // Parent viewing linked child
    if (requestingUserRole === 'Parent') {
      const parentProfile = await prisma.parentProfile.findUnique({
        where: { userId: requestingUserId },
      });
      if (parentProfile) {
        const link = await prisma.parentStudentRelation.findFirst({
          where: { parentId: parentProfile.id, studentId: studentData.id },
        });
        if (link) {
          return this.sanitizeSensitiveFields(studentData, false);
        }
      }
    }

    // HOD viewing department student
    if (requestingUserRole === 'HOD') {
      const hodFaculty = await prisma.faculty.findFirst({ where: { userId: requestingUserId } });
      if (hodFaculty && hodFaculty.departmentId === studentData.departmentId) {
        return this.sanitizeSensitiveFields(studentData, false);
      }
    }

    // Default restricted view (Redact bank, parent income, private notes)
    return this.sanitizeSensitiveFields(studentData, true);
  }

  /**
   * Sanitize & redact sensitive fields
   */
  private static sanitizeSensitiveFields(record: any, redactSensitive: boolean) {
    const cleaned = { ...record };

    if (redactSensitive) {
      delete cleaned.bankName;
      delete cleaned.bankAccountNo;
      delete cleaned.ifscCode;
      delete cleaned.aadhaarNumber;
      delete cleaned.parentIncome;
      delete cleaned.confidentialNotes;
    }

    return cleaned;
  }
}
