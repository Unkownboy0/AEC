import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';
import { RecipientResolverService } from '../notifications/recipient-resolver.service';

const CATEGORY_ROLE_POLICY: Record<string, string[]> = {
  HOSTEL: ['Hostel Warden', 'HOSTEL_WARDEN'],
  TRANSPORT: ['Transport Manager', 'TRANSPORT_MANAGER'],
  LIBRARY: ['Librarian', 'Library Staff', 'LIBRARIAN'],
  FEE: ['Accountant', 'Accounts Officer', 'ACCOUNTANT', 'AO'],
  FEES: ['Accountant', 'Accounts Officer', 'ACCOUNTANT', 'AO'],
  ACCOUNTS: ['Accountant', 'Accounts Officer', 'ACCOUNTANT', 'AO'],
  ADMINISTRATION: ['Administration & Admission Dean', 'College Admin', 'ADMINISTRATION_AND_ADMISSION_DEAN'],
  ADMIN: ['Administration & Admission Dean', 'College Admin', 'ADMINISTRATION_AND_ADMISSION_DEAN'],
  STUDENT_SERVICE: ['Administration & Admission Dean', 'College Admin', 'ADMINISTRATION_AND_ADMISSION_DEAN'],
  DOCUMENT: ['Administration & Admission Dean', 'College Admin', 'ADMINISTRATION_AND_ADMISSION_DEAN'],
  ADMISSION: ['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'],
  GENERAL: ['Grievance Officer', 'Grievance', 'College Admin', 'GRIEVANCE_OFFICER'],
  IT: ['College Admin', 'Super Admin'],
  IQAC: ['IQAC Dean', 'IQAC'],
};

export class ComplaintRoutingService {
  private static async firstActiveUserForRoles(roleNames: string[]): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { role: { name: { in: roleNames } } },
          { userWorkspaces: { some: { status: 'ACTIVE', roleName: { in: roleNames } } } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    return user?.id || null;
  }

  static async resolveOwner(input: { category: string; studentId?: string | null; facultyId?: string | null }): Promise<string> {
    if (input.category === 'ACADEMIC') {
      const [student, faculty] = await Promise.all([
        input.studentId ? prisma.student.findUnique({ where: { id: input.studentId }, select: { departmentId: true } }) : null,
        input.facultyId ? prisma.faculty.findUnique({ where: { id: input.facultyId }, select: { departmentId: true } }) : null,
      ]);
      const departmentId = student?.departmentId || faculty?.departmentId;
      if (departmentId) {
        const hodUserId = await RecipientResolverService.findDepartmentHod(departmentId);
        if (hodUserId) return hodUserId;
      }
      const academicDean = await this.firstActiveUserForRoles(['Academic Dean', 'ACADEMIC_DEAN']);
      if (academicDean) return academicDean;
    } else {
      const owner = await this.firstActiveUserForRoles(CATEGORY_ROLE_POLICY[input.category] || CATEGORY_ROLE_POLICY.GENERAL);
      if (owner) return owner;
    }
    throw new BadRequestException(`No active complaint owner is configured for category ${input.category}`);
  }
}
