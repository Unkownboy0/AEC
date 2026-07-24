"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseRepository = void 0;
const prisma_1 = require("../../lib/prisma");
const security_1 = require("../../utils/security");
class EnterpriseRepository {
    // ==========================================
    // 1. STUDENTS
    // ==========================================
    async findStudents(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, status, departmentId, courseId, semesterId, mentorId } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (departmentId)
            where.departmentId = departmentId;
        if (courseId)
            where.courseId = courseId;
        if (semesterId)
            where.semesterId = semesterId;
        if (mentorId)
            where.mentorId = mentorId;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { admissionNo: { contains: search } },
            ];
        }
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'students');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.student.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { academicYear: true, department: true, programDepartment: true, program: true, course: true, semester: true, section: true, user: true },
            }),
            prisma_1.prisma.student.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findStudentById(id) {
        return prisma_1.prisma.student.findFirst({
            where: { id, deleted: false },
            include: { academicYear: true, department: true, programDepartment: true, program: true, course: true, semester: true, section: true, hostelBuilding: true, transportRoute: true, user: true },
        });
    }
    async createStudent(data) {
        return prisma_1.prisma.student.create({ data });
    }
    async updateStudent(id, data) {
        return prisma_1.prisma.student.update({ where: { id }, data });
    }
    // ==========================================
    // 2. FACULTY
    // ==========================================
    async findFaculties(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, status, departmentId } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (departmentId)
            where.departmentId = departmentId;
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { employeeId: { contains: search } },
            ];
        }
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'faculties');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.faculty.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    department: true,
                    user: { select: { profilePhoto: true } }
                },
            }),
            prisma_1.prisma.faculty.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findFacultyById(id) {
        return prisma_1.prisma.faculty.findFirst({
            where: { id, deleted: false },
            include: {
                department: true,
                user: { select: { profilePhoto: true } }
            },
        });
    }
    async createFaculty(data) {
        return prisma_1.prisma.faculty.create({ data });
    }
    async updateFaculty(id, data) {
        return prisma_1.prisma.faculty.update({ where: { id }, data });
    }
    // ==========================================
    // 3. ATTENDANCE
    // ==========================================
    async findAttendances(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { status, studentId, facultyId, type } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (studentId)
            where.studentId = studentId;
        if (facultyId)
            where.facultyId = facultyId;
        if (type)
            where.type = type;
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'attendance');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.attendance.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { date: 'desc' },
                include: { student: true, faculty: true, subject: true },
            }),
            prisma_1.prisma.attendance.count({ where }),
        ]);
        return { items, totalCount };
    }
    async createAttendance(data) {
        return prisma_1.prisma.attendance.create({ data });
    }
    async updateAttendance(id, data) {
        return prisma_1.prisma.attendance.update({ where: { id }, data });
    }
    // ==========================================
    // 4. EXAMS
    // ==========================================
    async findExams(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, status, semesterId } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (semesterId)
            where.semesterId = semesterId;
        if (search) {
            where.name = { contains: search };
        }
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'exams');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.exam.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { startDate: 'desc' },
                include: { academicYear: true, course: true, semester: true, coordinator: true },
            }),
            prisma_1.prisma.exam.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findExamById(id) {
        return prisma_1.prisma.exam.findFirst({
            where: { id, deleted: false },
            include: { academicYear: true, course: true, semester: true, coordinator: true },
        });
    }
    async createExam(data) {
        return prisma_1.prisma.exam.create({ data });
    }
    async updateExam(id, data) {
        return prisma_1.prisma.exam.update({ where: { id }, data });
    }
    // ==========================================
    // 5. MARKS
    // ==========================================
    async findMarks(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { examId, studentId, subjectId } = params;
        const where = { deleted: false };
        if (examId)
            where.examId = examId;
        if (studentId)
            where.studentId = studentId;
        if (subjectId)
            where.subjectId = subjectId;
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'marks');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.mark.findMany({
                where,
                skip,
                take: pageSize,
                include: { exam: true, student: true, subject: true },
            }),
            prisma_1.prisma.mark.count({ where }),
        ]);
        return { items, totalCount };
    }
    async createMark(data) {
        return prisma_1.prisma.mark.create({ data });
    }
    async updateMark(id, data) {
        return prisma_1.prisma.mark.update({ where: { id }, data });
    }
    // ==========================================
    // 6. FEES (Fee Categories & Student Bills)
    // ==========================================
    async findFeeCategories(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, status } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (search)
            where.name = { contains: search };
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.feeCategory.findMany({
                where,
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.feeCategory.count({ where }),
        ]);
        return { items, totalCount };
    }
    async createFeeCategory(data) {
        return prisma_1.prisma.feeCategory.create({ data });
    }
    async findFeeBills(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { studentId, status } = params;
        const where = { deleted: false };
        if (studentId)
            where.studentId = studentId;
        if (status)
            where.status = status;
        // Zero Trust: apply role-based data isolation
        if (user) {
            await security_1.SecurityHelper.applySecurityFilters(user, where, 'feeBills');
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.feeBill.findMany({
                where,
                skip,
                take: pageSize,
                include: { student: true, category: true },
            }),
            prisma_1.prisma.feeBill.count({ where }),
        ]);
        return { items, totalCount };
    }
    async createFeeBill(data) {
        return prisma_1.prisma.feeBill.create({ data });
    }
    async updateFeeBill(id, data) {
        return prisma_1.prisma.feeBill.update({ where: { id }, data });
    }
    // ==========================================
    // 7. LIBRARY
    // ==========================================
    async findLibraryBooks(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, category } = params;
        const where = { deleted: false };
        if (category)
            where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { author: { contains: search } },
                { isbn: { contains: search } },
            ];
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.libraryBook.findMany({
                where,
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.libraryBook.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findLibraryBookById(id) {
        return prisma_1.prisma.libraryBook.findFirst({
            where: { id, deleted: false },
        });
    }
    async createLibraryBook(data) {
        return prisma_1.prisma.libraryBook.create({ data });
    }
    async updateLibraryBook(id, data) {
        return prisma_1.prisma.libraryBook.update({ where: { id }, data });
    }
    // ==========================================
    // 8. TRANSPORT ROUTES
    // ==========================================
    async findTransportRoutes(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search } = params;
        const where = { deleted: false };
        if (search) {
            where.routeName = { contains: search };
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.transportRoute.findMany({
                where,
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.transportRoute.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findTransportRouteById(id) {
        return prisma_1.prisma.transportRoute.findFirst({
            where: { id, deleted: false },
        });
    }
    async createTransportRoute(data) {
        return prisma_1.prisma.transportRoute.create({ data });
    }
    async updateTransportRoute(id, data) {
        return prisma_1.prisma.transportRoute.update({ where: { id }, data });
    }
    // ==========================================
    // 9. HOSTELS
    // ==========================================
    async findHostels(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { search, type } = params;
        const where = { deleted: false };
        if (type)
            where.type = type;
        if (search) {
            where.name = { contains: search };
        }
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.hostelBuilding.findMany({
                where,
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.hostelBuilding.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findHostelById(id) {
        return prisma_1.prisma.hostelBuilding.findFirst({
            where: { id, deleted: false },
        });
    }
    async createHostel(data) {
        return prisma_1.prisma.hostelBuilding.create({ data });
    }
    async updateHostel(id, data) {
        return prisma_1.prisma.hostelBuilding.update({ where: { id }, data });
    }
    // ==========================================
    // 10. TICKETS (Support Ticket Desk)
    // ==========================================
    async findTickets(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        const skip = (page - 1) * pageSize;
        const { status, category, priority, studentId } = params;
        const where = { deleted: false };
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (priority)
            where.priority = priority;
        if (studentId)
            where.studentId = studentId;
        const [items, totalCount] = await Promise.all([
            prisma_1.prisma.ticket.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { faculty: true, student: true },
            }),
            prisma_1.prisma.ticket.count({ where }),
        ]);
        return { items, totalCount };
    }
    async findTicketById(id) {
        return prisma_1.prisma.ticket.findFirst({
            where: { id, deleted: false },
            include: { faculty: true, student: true },
        });
    }
    async createTicket(data) {
        return prisma_1.prisma.ticket.create({ data });
    }
    async updateTicket(id, data) {
        return prisma_1.prisma.ticket.update({ where: { id }, data });
    }
    // ==========================================
    // BULK SERVICES
    // ==========================================
    async bulkDelete(modelName, ids) {
        const delegate = prisma_1.prisma[modelName];
        if (!delegate)
            throw new Error(`Invalid model name: ${modelName}`);
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
exports.EnterpriseRepository = EnterpriseRepository;
//# sourceMappingURL=enterprise.repository.js.map