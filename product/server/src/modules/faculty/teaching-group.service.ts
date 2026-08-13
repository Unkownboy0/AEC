import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { RequesterIdentity, StudentAccessService } from '../security/student-access.service';

export interface CreateTeachingGroupInput {
  name: string;
  subjectId: string;
  facultyId?: string;
  academicYearId: string;
  semester: number;
  groupType?: string;
  departmentIds: string[];
  sectionIds: string[];
  studentIds?: string[];
}

const normalizeRole = (role: string) => (role || '').toUpperCase().replace(/[\s_-]+/g, '');

export class TeachingGroupService {
  static async resolveFacultyId(requester: RequesterIdentity, requestedFacultyId?: string): Promise<string> {
    const requesterFaculty = await prisma.faculty.findFirst({
      where: { userId: requester.id, deleted: false },
      select: { id: true },
    });
    const role = normalizeRole(requester.role);

    if (role === 'FACULTY' || role === 'MENTOR') {
      if (!requesterFaculty) throw new ForbiddenException('Faculty profile is required');
      if (requestedFacultyId && requestedFacultyId !== requesterFaculty.id) {
        throw new ForbiddenException('Faculty can only create their own teaching groups');
      }
      return requesterFaculty.id;
    }

    if (!requestedFacultyId) {
      throw new BadRequestException('facultyId is required when assigning a teaching group');
    }
    const target = await prisma.faculty.findFirst({
      where: { id: requestedFacultyId, deleted: false, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Faculty member not found');
    return target.id;
  }

  static async create(requester: RequesterIdentity, input: CreateTeachingGroupInput) {
    if (input.departmentIds.length === 0 || input.sectionIds.length === 0) {
      throw new BadRequestException('At least one department and section are required');
    }

    const facultyId = await this.resolveFacultyId(requester, input.facultyId);
    const role = normalizeRole(requester.role);
    const scope = await StudentAccessService.resolveScope(requester);

    if (!scope.unrestricted && (role === 'HOD' || role === 'HEADOFDEPARTMENT')) {
      const outsideScope = input.departmentIds.some((departmentId) => !scope.departmentIds.includes(departmentId));
      if (outsideScope) throw new ForbiddenException('A teaching group cannot include another HOD department');
    }

    const [subject, departments, sections, students, assignment] = await Promise.all([
      prisma.subject.findFirst({ where: { id: input.subjectId, status: 'ACTIVE', deleted: false } }),
      prisma.department.findMany({ where: { id: { in: input.departmentIds }, status: 'ACTIVE' }, select: { id: true } }),
      prisma.section.findMany({
        where: { id: { in: input.sectionIds }, departmentId: { in: input.departmentIds }, status: 'ACTIVE', deleted: false },
        select: { id: true },
      }),
      prisma.student.findMany({
        where: { id: { in: input.studentIds || [] }, departmentId: { in: input.departmentIds }, deleted: false },
        select: { id: true },
      }),
      prisma.subjectAssignment.findFirst({ where: { facultyId, subjectId: input.subjectId } }),
    ]);

    if (!subject) throw new NotFoundException('Subject not found');
    if (departments.length !== new Set(input.departmentIds).size) {
      throw new BadRequestException('One or more departments are invalid');
    }
    if (sections.length !== new Set(input.sectionIds).size) {
      throw new BadRequestException('Every section must belong to a selected active department');
    }
    if (students.length !== new Set(input.studentIds || []).size) {
      throw new BadRequestException('Every selected student must belong to a selected department');
    }
    if ((role === 'FACULTY' || role === 'MENTOR') && !assignment) {
      throw new ForbiddenException('The subject is not assigned to this Faculty member');
    }

    return prisma.teachingGroup.create({
      data: {
        name: input.name.trim(),
        subjectId: input.subjectId,
        facultyId,
        academicYearId: input.academicYearId,
        semester: input.semester,
        groupType: input.groupType || 'COMBINED',
        departments: { create: Array.from(new Set(input.departmentIds)).map((departmentId) => ({ departmentId })) },
        sections: { create: Array.from(new Set(input.sectionIds)).map((sectionId) => ({ sectionId })) },
        students: { create: Array.from(new Set(input.studentIds || [])).map((studentId) => ({ studentId })) },
      },
      include: {
        subject: true,
        faculty: true,
        academicYear: true,
        departments: { include: { department: true } },
        sections: { include: { section: true } },
        students: { include: { student: true } },
      },
    });
  }

  static async listForUser(requester: RequesterIdentity) {
    const role = normalizeRole(requester.role);
    const faculty = await prisma.faculty.findFirst({
      where: { userId: requester.id, deleted: false },
      select: { id: true },
    });
    const scope = await StudentAccessService.resolveScope(requester);

    const where: any = { status: 'ACTIVE' };
    if (role === 'FACULTY' || role === 'MENTOR') {
      if (!faculty) return [];
      where.facultyId = faculty.id;
    } else if (!scope.unrestricted) {
      where.departments = { some: { departmentId: { in: scope.departmentIds } } };
    }

    return prisma.teachingGroup.findMany({
      where,
      include: {
        subject: true,
        faculty: true,
        academicYear: true,
        departments: { include: { department: true } },
        sections: { include: { section: true } },
        students: { include: { student: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async resolveStudents(requester: RequesterIdentity, groupId: string) {
    const groups = await this.listForUser(requester);
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) throw new NotFoundException('Teaching group not found in your access scope');

    const sectionIds = group.sections.map((membership) => membership.sectionId);
    const explicitStudentIds = group.students.map((membership) => membership.studentId);
    return prisma.student.findMany({
      where: {
        deleted: false,
        OR: [
          { sectionId: { in: sectionIds } },
          { id: { in: explicitStudentIds } },
        ],
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        admissionNo: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        sectionId: true,
      },
    });
  }
}

