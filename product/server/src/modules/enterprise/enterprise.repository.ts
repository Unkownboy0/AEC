import { prisma } from '../../lib/prisma';
import { SecurityHelper, UserPayload } from '../../utils/security';

export class EnterpriseRepository {
  // ==========================================
  // 1. STUDENTS
  // ==========================================
  async findStudents(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, status, departmentId, courseId, semesterId, mentorId } = params;

    const where: any = { deleted: false };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (courseId) where.courseId = courseId;
    if (semesterId) where.semesterId = semesterId;
    if (mentorId) where.mentorId = mentorId;
    if (params.scopeWhere) where.AND = [params.scopeWhere];

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNo: { contains: search } },
      ];
    }

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'students');
    }

    const [items, totalCount] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { academicYear: true, department: true, programDepartment: true, program: true, course: true, semester: true, section: true, user: true },
      }),
      prisma.student.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findStudentById(id: string) {
    return prisma.student.findFirst({
      where: { id, deleted: false },
      include: { academicYear: true, department: true, programDepartment: true, program: true, course: true, semester: true, section: true, hostelBuilding: true, transportRoute: true, user: true },
    });
  }

  async createStudent(data: any) {
    return prisma.student.create({ data });
  }

  async updateStudent(id: string, data: any) {
    return prisma.student.update({ where: { id }, data });
  }

  // ==========================================
  // 2. FACULTY
  // ==========================================
  async findFaculties(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, status, departmentId } = params;

    const where: any = { deleted: false };
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'faculties');
    }

    const [items, totalCount] = await Promise.all([
      prisma.faculty.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { 
          department: true,
          user: { select: { profilePhoto: true } }
        },
      }),
      prisma.faculty.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findFacultyById(id: string) {
    return prisma.faculty.findFirst({
      where: { id, deleted: false },
      include: { 
        department: true,
        user: { select: { profilePhoto: true } }
      },
    });
  }

  async createFaculty(data: any) {
    return prisma.faculty.create({ data });
  }

  async updateFaculty(id: string, data: any) {
    return prisma.faculty.update({ where: { id }, data });
  }

  // ==========================================
  // 3. ATTENDANCE
  // ==========================================
  async findAttendances(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { status, studentId, facultyId, type } = params;

    const where: any = { deleted: false };
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (facultyId) where.facultyId = facultyId;
    if (type) where.type = type;

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'attendance');
    }

    const [items, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
        include: { student: true, faculty: true, subject: true },
      }),
      prisma.attendance.count({ where }),
    ]);

    return { items, totalCount };
  }

  async createAttendance(data: any) {
    return prisma.attendance.create({ data });
  }

  async updateAttendance(id: string, data: any) {
    return prisma.attendance.update({ where: { id }, data });
  }

  // ==========================================
  // 4. EXAMS
  // ==========================================
  async findExams(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, status, semesterId } = params;

    const where: any = { deleted: false };
    if (status) where.status = status;
    if (semesterId) where.semesterId = semesterId;

    if (search) {
      where.name = { contains: search };
    }

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'exams');
    }

    const [items, totalCount] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { startDate: 'desc' },
        include: { academicYear: true, course: true, semester: true, coordinator: true },
      }),
      prisma.exam.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findExamById(id: string) {
    return prisma.exam.findFirst({
      where: { id, deleted: false },
      include: { academicYear: true, course: true, semester: true, coordinator: true },
    });
  }

  async createExam(data: any) {
    return prisma.exam.create({ data });
  }

  async updateExam(id: string, data: any) {
    return prisma.exam.update({ where: { id }, data });
  }

  // ==========================================
  // 5. MARKS
  // ==========================================
  async findMarks(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { examId, studentId, subjectId } = params;

    const where: any = { deleted: false };
    if (examId) where.examId = examId;
    if (studentId) where.studentId = studentId;
    if (subjectId) where.subjectId = subjectId;

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'marks');
    }

    const [items, totalCount] = await Promise.all([
      prisma.mark.findMany({
        where,
        skip,
        take: pageSize,
        include: { exam: true, student: true, subject: true },
      }),
      prisma.mark.count({ where }),
    ]);

    return { items, totalCount };
  }

  async createMark(data: any) {
    return prisma.mark.create({ data });
  }

  async updateMark(id: string, data: any) {
    return prisma.mark.update({ where: { id }, data });
  }

  // ==========================================
  // 6. FEES (Fee Categories & Student Bills)
  // ==========================================
  async findFeeCategories(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, status } = params;

    const where: any = { deleted: false };
    if (status) where.status = status;
    if (search) where.name = { contains: search };

    const [items, totalCount] = await Promise.all([
      prisma.feeCategory.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.feeCategory.count({ where }),
    ]);

    return { items, totalCount };
  }

  async createFeeCategory(data: any) {
    return prisma.feeCategory.create({ data });
  }

  async findFeeBills(params: any, user?: UserPayload) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { studentId, status } = params;

    const where: any = { deleted: false };
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    // Zero Trust: apply role-based data isolation
    if (user) {
      await SecurityHelper.applySecurityFilters(user, where, 'feeBills');
    }

    const [items, totalCount] = await Promise.all([
      prisma.feeBill.findMany({
        where,
        skip,
        take: pageSize,
        include: { student: true, category: true },
      }),
      prisma.feeBill.count({ where }),
    ]);

    return { items, totalCount };
  }

  async createFeeBill(data: any) {
    return prisma.feeBill.create({ data });
  }

  async updateFeeBill(id: string, data: any) {
    return prisma.feeBill.update({ where: { id }, data });
  }

  // ==========================================
  // 7. LIBRARY
  // ==========================================
  async findLibraryBooks(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, category } = params;

    const where: any = { deleted: false };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { isbn: { contains: search } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.libraryBook.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.libraryBook.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findLibraryBookById(id: string) {
    return prisma.libraryBook.findFirst({
      where: { id, deleted: false },
    });
  }

  async createLibraryBook(data: any) {
    return prisma.libraryBook.create({ data });
  }

  async updateLibraryBook(id: string, data: any) {
    return prisma.libraryBook.update({ where: { id }, data });
  }

  // ==========================================
  // 8. TRANSPORT ROUTES
  // ==========================================
  async findTransportRoutes(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search } = params;

    const where: any = { deleted: false };
    if (search) {
      where.routeName = { contains: search };
    }

    const [items, totalCount] = await Promise.all([
      prisma.transportRoute.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.transportRoute.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findTransportRouteById(id: string) {
    return prisma.transportRoute.findFirst({
      where: { id, deleted: false },
    });
  }

  async createTransportRoute(data: any) {
    return prisma.transportRoute.create({ data });
  }

  async updateTransportRoute(id: string, data: any) {
    return prisma.transportRoute.update({ where: { id }, data });
  }

  // ==========================================
  // 9. HOSTELS
  // ==========================================
  async findHostels(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { search, type } = params;

    const where: any = { deleted: false };
    if (type) where.type = type;
    if (search) {
      where.name = { contains: search };
    }

    const [items, totalCount] = await Promise.all([
      prisma.hostelBuilding.findMany({
        where,
        skip,
        take: pageSize,
      }),
      prisma.hostelBuilding.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findHostelById(id: string) {
    return prisma.hostelBuilding.findFirst({
      where: { id, deleted: false },
    });
  }

  async createHostel(data: any) {
    return prisma.hostelBuilding.create({ data });
  }

  async updateHostel(id: string, data: any) {
    return prisma.hostelBuilding.update({ where: { id }, data });
  }

  // ==========================================
  // 10. TICKETS (Support Ticket Desk)
  // ==========================================
  async findTickets(params: any) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
    const skip = (page - 1) * pageSize;
    const { status, category, priority, studentId, facultyId, scopeWhere } = params;

    const where: any = { deleted: false, ...(scopeWhere || {}) };
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (studentId) where.studentId = studentId;
    if (facultyId) where.facultyId = facultyId;

    const [items, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { faculty: true, student: true, assignedTo: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.ticket.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findTicketById(id: string) {
    return prisma.ticket.findFirst({
      where: { id, deleted: false },
      include: { faculty: true, student: true, assignedTo: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async createTicket(data: any) {
    return prisma.ticket.create({ data });
  }

  async updateTicket(id: string, data: any) {
    return prisma.ticket.update({ where: { id }, data });
  }

  // ==========================================
  // BULK SERVICES
  // ==========================================
  async bulkDelete(modelName: string, ids: string[]) {
    const delegate = (prisma as any)[modelName];
    if (!delegate) throw new Error(`Invalid model name: ${modelName}`);

    return delegate.updateMany({
      where: { id: { in: ids } },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async bulkArchive(modelName: string, ids: string[]) {
    const delegate = (prisma as any)[modelName];
    if (!delegate) throw new Error(`Invalid model name: ${modelName}`);

    return delegate.updateMany({
      where: { id: { in: ids } },
      data: {
        archived: true,
        archivedAt: new Date(),
        status: 'ARCHIVED',
      },
    });
  }

  async bulkRestore(modelName: string, ids: string[]) {
    const delegate = (prisma as any)[modelName];
    if (!delegate) throw new Error(`Invalid model name: ${modelName}`);

    return delegate.updateMany({
      where: { id: { in: ids } },
      data: {
        deleted: false,
        deletedAt: null,
        archived: false,
        archivedAt: null,
        status: 'ACTIVE',
      },
    });
  }
}
