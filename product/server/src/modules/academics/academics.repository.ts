import { prisma } from '../../lib/prisma';

export class AcademicsRepository {
  // ==========================================
  // 1. DEPARTMENTS
  // ==========================================
  async findDepartments(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, type, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (type) where.type = type;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { shortName: { contains: search } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          programs: { where: { deleted: false, archived: false } },
          courses: { where: { deleted: false, archived: false } },
          subjects: { where: { deleted: false, archived: false } },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findDeptById(id: string) {
    return prisma.department.findFirst({
      where: { id, deleted: false },
      include: {
        programs: { where: { deleted: false, archived: false } },
        courses: { where: { deleted: false, archived: false } },
      },
    });
  }

  async createDept(data: any) {
    return prisma.department.create({ data });
  }

  async updateDept(id: string, data: any) {
    return prisma.department.update({ where: { id }, data });
  }

  // ==========================================
  // 2. PROGRAMS
  // ==========================================
  async findPrograms(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    level?: string;
    departmentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, level, departmentId, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (level) where.level = level;
    if (departmentId) where.departmentId = departmentId;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { department: true },
      }),
      prisma.program.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findProgramById(id: string) {
    return prisma.program.findFirst({
      where: { id, deleted: false },
      include: { department: true },
    });
  }

  async createProgram(data: any) {
    return prisma.program.create({ data });
  }

  async updateProgram(id: string, data: any) {
    return prisma.program.update({ where: { id }, data });
  }

  // ==========================================
  // 3. COURSES
  // ==========================================
  async findCourses(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    programId?: string;
    departmentId?: string;
    regulation?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, programId, departmentId, regulation, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (programId) where.programId = programId;
    if (departmentId) where.departmentId = departmentId;
    if (regulation) where.regulation = regulation;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { program: true, department: true },
      }),
      prisma.course.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findCourseById(id: string) {
    return prisma.course.findFirst({
      where: { id, deleted: false },
      include: { program: true, department: true },
    });
  }

  async createCourse(data: any) {
    return prisma.course.create({ data });
  }

  async updateCourse(id: string, data: any) {
    return prisma.course.update({ where: { id }, data });
  }

  // ==========================================
  // 4. ACADEMIC YEARS
  // ==========================================
  async findYears(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, sortBy = 'name', sortOrder = 'desc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;

    if (search) {
      where.name = { contains: search };
    }

    const [items, totalCount] = await Promise.all([
      prisma.academicYear.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.academicYear.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findYearById(id: string) {
    return prisma.academicYear.findFirst({
      where: { id, deleted: false },
    });
  }

  async createYear(data: any) {
    return prisma.academicYear.create({ data });
  }

  async updateYear(id: string, data: any) {
    return prisma.academicYear.update({ where: { id }, data });
  }

  // ==========================================
  // 5. SEMESTERS
  // ==========================================
  async findSemesters(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    courseId?: string;
    programId?: string;
    academicYearId?: string;
    departmentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, courseId, programId, academicYearId, departmentId, sortBy = 'number', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (courseId) where.courseId = courseId;
    if (programId) where.programId = programId;
    if (academicYearId) where.academicYearId = academicYearId;
    if (departmentId) {
      where.course = { departmentId };
    }

    if (search) {
      where.name = { contains: search };
    }

    const [items, totalCount] = await Promise.all([
      prisma.semester.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { course: true, program: true, academicYear: true },
      }),
      prisma.semester.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findSemesterById(id: string) {
    return prisma.semester.findFirst({
      where: { id, deleted: false },
      include: { course: true, program: true, academicYear: true },
    });
  }

  async createSemester(data: any) {
    return prisma.semester.create({ data });
  }

  async updateSemester(id: string, data: any) {
    return prisma.semester.update({ where: { id }, data });
  }

  // ==========================================
  // 6. SECTIONS
  // ==========================================
  async findSections(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    semesterId?: string;
    programId?: string;
    departmentId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, semesterId, programId, departmentId, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (semesterId) where.semesterId = semesterId;
    if (programId) where.programId = programId;
    if (departmentId) where.departmentId = departmentId;

    if (search) {
      where.name = { contains: search };
    }

    const [items, totalCount] = await Promise.all([
      prisma.section.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { semester: true, program: true, department: true },
      }),
      prisma.section.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findSectionById(id: string) {
    return prisma.section.findFirst({
      where: { id, deleted: false },
      include: { semester: true, program: true, department: true },
    });
  }

  async createSection(data: any) {
    return prisma.section.create({ data });
  }

  async updateSection(id: string, data: any) {
    return prisma.section.update({ where: { id }, data });
  }

  // ==========================================
  // 7. SUBJECTS
  // ==========================================
  async findSubjects(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    semesterId?: string;
    departmentId?: string;
    programId?: string;
    sectionId?: string;
    isCore?: boolean;
    isLab?: boolean;
    isElective?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeArchived?: boolean;
  }) {
    const { page, pageSize, search, status, semesterId, departmentId, programId, sectionId, isCore, isLab, isElective, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { deleted: false };
    if (!includeArchived) {
      where.archived = false;
    }
    if (status) where.status = status;
    if (semesterId) where.semesterId = semesterId;
    if (departmentId) where.departmentId = departmentId;
    if (programId) where.programId = programId;
    if (sectionId) where.sectionId = sectionId;
    if (isCore !== undefined) where.isCore = isCore;
    if (isLab !== undefined) where.isLab = isLab;
    if (isElective !== undefined) where.isElective = isElective;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: { semester: true, department: true, program: true, section: true },
      }),
      prisma.subject.count({ where }),
    ]);

    return { items, totalCount };
  }

  async findSubjectById(id: string) {
    return prisma.subject.findFirst({
      where: { id, deleted: false },
      include: { semester: true, department: true, program: true, section: true },
    });
  }

  async createSubject(data: any) {
    return prisma.subject.create({ data });
  }

  async updateSubject(id: string, data: any) {
    return prisma.subject.update({ where: { id }, data });
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================
  async bulkDelete(modelName: string, ids: string[]) {
    const delegate = (prisma as any)[modelName];
    if (!delegate) throw new Error(`Invalid model name: ${modelName}`);

    // Soft delete
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
