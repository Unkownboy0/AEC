import { prisma } from '../../lib/prisma';
import { UserPayload } from '../../utils/security';

export interface AvailabilityBoardQueryParams {
  departmentId?: string;
  role?: 'ALL' | 'FACULTY' | 'STUDENT';
  type?: 'ALL' | 'LEAVE' | 'ON_DUTY';
  search?: string;
}

export class AvailabilityBoardService {
  async getAvailabilityBoard(user: UserPayload, query: AvailabilityBoardQueryParams) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let targetDepartmentId = query.departmentId;

    // Default department for HOD if not provided
    if (!targetDepartmentId && user.role === 'HOD') {
      const hodUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true }
      });
      if (hodUser?.departmentId) {
        targetDepartmentId = hodUser.departmentId;
      }
    }

    const deptFilter = targetDepartmentId && targetDepartmentId !== 'ALL'
      ? { departmentId: targetDepartmentId }
      : {};

    const approvedStudentStatuses = [
      'APPROVED', 'APPROVED_HOD', 'APPROVED_PRINCIPAL', 'APPROVED_MENTOR',
      'APPROVED_DEAN', 'APPROVED_VICE_PRINCIPAL', 'HOD_APPROVED', 'MENTOR_APPROVED', 'COMPLETED'
    ];
    const approvedFacultyStatuses = [
      'APPROVED', 'APPROVED_HOD', 'APPROVED_PRINCIPAL', 'APPROVED_DEAN',
      'APPROVED_VICE_PRINCIPAL', 'HOD_APPROVED', 'FINAL_APPROVED'
    ];

    // 1. Fetch active approved Faculty Leaves / ODs for today
    const facultyLeaves = await prisma.facultyLeaveRequest.findMany({
      where: {
        status: { in: approvedFacultyStatuses },
        startDate: { lte: endOfDay },
        endDate: { gte: today },
        ...(targetDepartmentId && targetDepartmentId !== 'ALL'
          ? { OR: [{ departmentId: targetDepartmentId }, { faculty: { departmentId: targetDepartmentId } }] }
          : {})
      },
      include: {
        department: { select: { id: true, name: true, code: true } }
      },
      orderBy: { startDate: 'asc' }
    });

    // 2. Fetch active approved Student Leaves / ODs for today
    const studentLeaves = await prisma.studentLeaveRequest.findMany({
      where: {
        status: { in: approvedStudentStatuses },
        startDate: { lte: endOfDay },
        endDate: { gte: today },
        ...(targetDepartmentId && targetDepartmentId !== 'ALL'
          ? { OR: [{ departmentId: targetDepartmentId }, { student: { departmentId: targetDepartmentId } }] }
          : {})
      },
      orderBy: { startDate: 'asc' }
    });

    // Fetch corresponding Faculty profile records
    const facultyIds = facultyLeaves.map(f => f.facultyId);
    const faculties = await prisma.faculty.findMany({
      where: { id: { in: facultyIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        designation: true,
        employeeId: true,
        department: { select: { id: true, name: true, code: true } }
      }
    });
    const facultyMap = new Map(faculties.map(f => [f.id, f]));

    // Fetch corresponding Student profile records
    const studentIds = studentLeaves.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        phone: true,
        department: { select: { id: true, name: true, code: true } },
        semester: { select: { number: true, name: true } },
        section: { select: { name: true } }
      }
    });
    const studentMap = new Map(students.map(s => [s.id, s]));

    // 3. Count total active strength in selected scope
    const totalFacultyCount = await prisma.faculty.count({
      where: { deleted: false, ...deptFilter }
    });

    const totalStudentCount = await prisma.student.count({
      where: { deleted: false, ...deptFilter }
    });

    // 4. Map records
    let items: any[] = [];

    if (!query.role || query.role === 'ALL' || query.role === 'FACULTY') {
      const mappedFaculty = facultyLeaves.map(f => {
        const fac = facultyMap.get(f.facultyId);
        const facName = fac ? `${fac.firstName} ${fac.lastName}` : 'Faculty Member';
        return {
          id: `fac-${f.id}`,
          requestId: f.id,
          personId: f.facultyId,
          personName: facName,
          avatarUrl: undefined,
          identifier: fac?.employeeId || fac?.email,
          subTitle: fac?.designation || 'Faculty Member',
          role: 'FACULTY',
          department: f.department?.name || fac?.department?.name || 'Unassigned',
          departmentId: f.departmentId || fac?.department?.id,
          leaveType: f.leaveType,
          category: f.leaveType === 'ON_DUTY' ? 'ON_DUTY' : 'LEAVE',
          reason: f.reason,
          startDate: f.startDate,
          endDate: f.endDate,
          isHalfDay: false,
          substituteName: null,
          proofDocumentUrl: f.attachmentUrl || null
        };
      });
      items.push(...mappedFaculty);
    }

    if (!query.role || query.role === 'ALL' || query.role === 'STUDENT') {
      const mappedStudents = studentLeaves.map(s => {
        const stud = studentMap.get(s.studentId);
        const studName = stud ? `${stud.firstName} ${stud.lastName}` : 'Student';
        return {
          id: `stud-${s.id}`,
          requestId: s.id,
          personId: s.studentId,
          personName: studName,
          avatarUrl: undefined,
          identifier: stud?.admissionNo || s.emergencyContact,
          subTitle: `Sem ${stud?.semester?.number || '-'} | Sec ${stud?.section?.name || '-'}`,
          role: 'STUDENT',
          department: stud?.department?.name || 'Unassigned',
          departmentId: stud?.department?.id,
          leaveType: s.type,
          category: s.type === 'ON_DUTY' ? 'ON_DUTY' : 'LEAVE',
          reason: s.reason,
          startDate: s.startDate,
          endDate: s.endDate,
          isHalfDay: s.durationType === 'HALF_DAY',
          substituteName: null,
          proofDocumentUrl: s.attachmentUrl || null
        };
      });
      items.push(...mappedStudents);
    }

    // Apply type filter if requested
    if (query.type && query.type !== 'ALL') {
      items = items.filter(item => item.category === query.type);
    }

    // Apply search filter if requested
    if (query.search) {
      const q = query.search.toLowerCase();
      items = items.filter(item =>
        item.personName.toLowerCase().includes(q) ||
        (item.identifier && item.identifier.toLowerCase().includes(q)) ||
        (item.department && item.department.toLowerCase().includes(q))
      );
    }

    // Summary calculation (unique persons on leave / OD)
    const facultyOnLeave = new Set(items.filter(i => i.role === 'FACULTY' && i.category === 'LEAVE').map(i => i.personId)).size;
    const facultyOnOD = new Set(items.filter(i => i.role === 'FACULTY' && i.category === 'ON_DUTY').map(i => i.personId)).size;
    const facultyPresent = Math.max(0, totalFacultyCount - (facultyOnLeave + facultyOnOD));

    const studentOnLeave = new Set(items.filter(i => i.role === 'STUDENT' && i.category === 'LEAVE').map(i => i.personId)).size;
    const studentOnOD = new Set(items.filter(i => i.role === 'STUDENT' && i.category === 'ON_DUTY').map(i => i.personId)).size;
    const studentPresent = Math.max(0, totalStudentCount - (studentOnLeave + studentOnOD));

    // List of all active departments for selection dropdown (Dean / VP)
    const departments = await prisma.department.findMany({
      where: { deleted: false },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' }
    });

    return {
      summary: {
        faculty: {
          total: totalFacultyCount,
          present: facultyPresent,
          onLeave: facultyOnLeave,
          onOD: facultyOnOD,
          availabilityRate: totalFacultyCount > 0 ? parseFloat(((facultyPresent / totalFacultyCount) * 100).toFixed(1)) : 100
        },
        student: {
          total: totalStudentCount,
          present: studentPresent,
          onLeave: studentOnLeave,
          onOD: studentOnOD,
          availabilityRate: totalStudentCount > 0 ? parseFloat(((studentPresent / totalStudentCount) * 100).toFixed(1)) : 100
        },
        overall: {
          totalOnLeave: facultyOnLeave + studentOnLeave,
          totalOnOD: facultyOnOD + studentOnOD,
          totalAbsentFromCampus: facultyOnLeave + facultyOnOD + studentOnLeave + studentOnOD
        }
      },
      departments,
      items
    };
  }
}

export const availabilityBoardService = new AvailabilityBoardService();
