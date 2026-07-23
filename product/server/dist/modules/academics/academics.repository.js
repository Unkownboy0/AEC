"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicsRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class AcademicsRepository {
    // ==========================================
    // 1. DEPARTMENTS
    // ==========================================
    async findDepartments(params) {
        const { page, pageSize, search, status, type, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
                { shortName: { contains: search } },
            ];
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.department.findMany({
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
            prisma_1.prisma.department.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findDeptById(id) {
        return prisma_1.prisma.department.findFirst({
            where: { id, deleted: false },
            include: {
                programs: { where: { deleted: false, archived: false } },
                courses: { where: { deleted: false, archived: false } },
            },
        });
    }
    async createDept(data) {
        return prisma_1.prisma.department.create({ data });
    }
    async updateDept(id, data) {
        return prisma_1.prisma.department.update({ where: { id }, data });
    }
    // ==========================================
    // 2. PROGRAMS
    // ==========================================
    async findPrograms(params) {
        const { page, pageSize, search, status, level, departmentId, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (level)
            where.level = level;
        if (departmentId)
            where.departmentId = departmentId;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
            ];
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.program.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { department: true },
            }),
            prisma_1.prisma.program.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findProgramById(id) {
        return prisma_1.prisma.program.findFirst({
            where: { id, deleted: false },
            include: { department: true },
        });
    }
    async createProgram(data) {
        return prisma_1.prisma.program.create({ data });
    }
    async updateProgram(id, data) {
        return prisma_1.prisma.program.update({ where: { id }, data });
    }
    // ==========================================
    // 3. COURSES
    // ==========================================
    async findCourses(params) {
        const { page, pageSize, search, status, programId, departmentId, regulation, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (programId)
            where.programId = programId;
        if (departmentId)
            where.departmentId = departmentId;
        if (regulation)
            where.regulation = regulation;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
            ];
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.course.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { program: true, department: true },
            }),
            prisma_1.prisma.course.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findCourseById(id) {
        return prisma_1.prisma.course.findFirst({
            where: { id, deleted: false },
            include: { program: true, department: true },
        });
    }
    async createCourse(data) {
        return prisma_1.prisma.course.create({ data });
    }
    async updateCourse(id, data) {
        return prisma_1.prisma.course.update({ where: { id }, data });
    }
    // ==========================================
    // 4. ACADEMIC YEARS
    // ==========================================
    async findYears(params) {
        const { page, pageSize, search, status, sortBy = 'name', sortOrder = 'desc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (search) {
            where.name = { contains: search };
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.academicYear.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma_1.prisma.academicYear.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findYearById(id) {
        return prisma_1.prisma.academicYear.findFirst({
            where: { id, deleted: false },
        });
    }
    async createYear(data) {
        return prisma_1.prisma.academicYear.create({ data });
    }
    async updateYear(id, data) {
        return prisma_1.prisma.academicYear.update({ where: { id }, data });
    }
    // ==========================================
    // 5. SEMESTERS
    // ==========================================
    async findSemesters(params) {
        const { page, pageSize, search, status, courseId, programId, academicYearId, departmentId, sortBy = 'number', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (courseId)
            where.courseId = courseId;
        if (programId)
            where.programId = programId;
        if (academicYearId)
            where.academicYearId = academicYearId;
        if (departmentId) {
            where.course = { departmentId };
        }
        if (search) {
            where.name = { contains: search };
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.semester.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { course: true, program: true, academicYear: true },
            }),
            prisma_1.prisma.semester.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findSemesterById(id) {
        return prisma_1.prisma.semester.findFirst({
            where: { id, deleted: false },
            include: { course: true, program: true, academicYear: true },
        });
    }
    async createSemester(data) {
        return prisma_1.prisma.semester.create({ data });
    }
    async updateSemester(id, data) {
        return prisma_1.prisma.semester.update({ where: { id }, data });
    }
    // ==========================================
    // 6. SECTIONS
    // ==========================================
    async findSections(params) {
        const { page, pageSize, search, status, semesterId, programId, departmentId, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (semesterId)
            where.semesterId = semesterId;
        if (programId)
            where.programId = programId;
        if (departmentId)
            where.departmentId = departmentId;
        if (search) {
            where.name = { contains: search };
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.section.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { semester: true, program: true, department: true },
            }),
            prisma_1.prisma.section.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findSectionById(id) {
        return prisma_1.prisma.section.findFirst({
            where: { id, deleted: false },
            include: { semester: true, program: true, department: true },
        });
    }
    async createSection(data) {
        return prisma_1.prisma.section.create({ data });
    }
    async updateSection(id, data) {
        return prisma_1.prisma.section.update({ where: { id }, data });
    }
    // ==========================================
    // 7. SUBJECTS
    // ==========================================
    async findSubjects(params) {
        const { page, pageSize, search, status, semesterId, departmentId, programId, sectionId, isCore, isLab, isElective, sortBy = 'name', sortOrder = 'asc', includeArchived = false } = params;
        const skip = (page - 1) * pageSize;
        const where = { deleted: false };
        if (!includeArchived) {
            where.archived = false;
        }
        if (status)
            where.status = status;
        if (semesterId)
            where.semesterId = semesterId;
        if (departmentId)
            where.departmentId = departmentId;
        if (programId)
            where.programId = programId;
        if (sectionId)
            where.sectionId = sectionId;
        if (isCore !== undefined)
            where.isCore = isCore;
        if (isLab !== undefined)
            where.isLab = isLab;
        if (isElective !== undefined)
            where.isElective = isElective;
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
            ];
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.subject.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortOrder },
                include: { semester: true, department: true, program: true, section: true },
            }),
            prisma_1.prisma.subject.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findSubjectById(id) {
        return prisma_1.prisma.subject.findFirst({
            where: { id, deleted: false },
            include: { semester: true, department: true, program: true, section: true },
        });
    }
    async createSubject(data) {
        return prisma_1.prisma.subject.create({ data });
    }
    async updateSubject(id, data) {
        return prisma_1.prisma.subject.update({ where: { id }, data });
    }
    // ==========================================
    // BULK OPERATIONS
    // ==========================================
    async bulkDelete(modelName, ids) {
        const delegate = prisma_1.prisma[modelName];
        if (!delegate)
            throw new Error(`Invalid model name: ${modelName}`);
        // Soft delete
        return delegate.updateMany({
            where: { id: { in: ids } },
            data: {
                deleted: true,
                deletedAt: new Date(),
            },
        });
    }
    async bulkArchive(modelName, ids) {
        const delegate = prisma_1.prisma[modelName];
        if (!delegate)
            throw new Error(`Invalid model name: ${modelName}`);
        return delegate.updateMany({
            where: { id: { in: ids } },
            data: {
                archived: true,
                archivedAt: new Date(),
                status: 'ARCHIVED',
            },
        });
    }
    async bulkRestore(modelName, ids) {
        const delegate = prisma_1.prisma[modelName];
        if (!delegate)
            throw new Error(`Invalid model name: ${modelName}`);
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
exports.AcademicsRepository = AcademicsRepository;
//# sourceMappingURL=academics.repository.js.map