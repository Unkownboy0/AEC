"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicsService = void 0;
const academics_repository_1 = require("./academics.repository");
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class AcademicsService {
    repo = new academics_repository_1.AcademicsRepository();
    // ==========================================
    // 1. DEPARTMENTS SERVICE
    // ==========================================
    async getFacultyDeptId(userId) {
        const f = await prisma_1.prisma.faculty.findFirst({ where: { userId } });
        return f ? f.departmentId : null;
    }
    async listDepartments(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            const deptId = await this.getFacultyDeptId(user.id);
            if (deptId) {
                const dept = await this.repo.findDeptById(deptId);
                return { items: dept ? [dept] : [], totalCount: dept ? 1 : 0 };
            }
        }
        return this.repo.findDepartments({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            type: params.type,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getDepartment(id) {
        const dept = await this.repo.findDeptById(id);
        if (!dept)
            throw new exceptions_1.NotFoundException('Department not found');
        return dept;
    }
    async createDepartment(input, userId, ip, ua) {
        const { code, name, shortName, description, type, color, email, phone, website, officeLocation, establishedYear, hodName, academicYearId } = input;
        if (!code || !name)
            throw new exceptions_1.BadRequestException('Department Code and Name are required');
        // Check uniqueness
        const existingCode = await prisma_1.prisma.department.findFirst({ where: { code, deleted: false } });
        if (existingCode)
            throw new exceptions_1.BadRequestException('Department Code already exists');
        const dept = await this.repo.createDept({
            code,
            name,
            shortName,
            description,
            type: type || 'Engineering',
            color: color || '#6366f1',
            email,
            phone,
            website,
            officeLocation,
            establishedYear: establishedYear ? parseInt(establishedYear) : null,
            hodName,
            academicYearId,
            status: 'ACTIVE',
        });
        await this.logActivity(userId, 'CREATE', 'DEPARTMENTS', `Created department: ${name} (${code})`, ip, ua);
        return dept;
    }
    async updateDepartment(id, input, userId, ip, ua) {
        const dept = await this.getDepartment(id);
        const { name, shortName, description, type, status, color, email, phone, website, officeLocation, establishedYear, hodName, academicYearId } = input;
        const data = {};
        if (name)
            data.name = name;
        if (shortName !== undefined)
            data.shortName = shortName;
        if (description !== undefined)
            data.description = description;
        if (type)
            data.type = type;
        if (status)
            data.status = status;
        if (color)
            data.color = color;
        if (email !== undefined)
            data.email = email;
        if (phone !== undefined)
            data.phone = phone;
        if (website !== undefined)
            data.website = website;
        if (officeLocation !== undefined)
            data.officeLocation = officeLocation;
        if (establishedYear !== undefined)
            data.establishedYear = establishedYear ? parseInt(establishedYear) : null;
        if (hodName !== undefined)
            data.hodName = hodName;
        if (academicYearId !== undefined)
            data.academicYearId = academicYearId;
        const updated = await this.repo.updateDept(id, data);
        await this.logActivity(userId, 'UPDATE', 'DEPARTMENTS', `Updated department details for ${dept.code}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 2. PROGRAMS SERVICE
    // ==========================================
    async listPrograms(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            params.departmentId = await this.getFacultyDeptId(user.id) || 'none';
        }
        return this.repo.findPrograms({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            level: params.level,
            departmentId: params.departmentId,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getProgram(id) {
        const prog = await this.repo.findProgramById(id);
        if (!prog)
            throw new exceptions_1.NotFoundException('Program not found');
        return prog;
    }
    async createProgram(input, userId, ip, ua) {
        const { code, name, duration, level, credits, departmentId, coordinator, status } = input;
        if (!code || !name || !departmentId)
            throw new exceptions_1.BadRequestException('Code, Name and Department are required');
        const program = await this.repo.createProgram({
            code,
            name,
            duration: duration ? parseInt(duration) : 4,
            level: level || 'UG',
            credits: credits ? parseInt(credits) : 160,
            departmentId,
            coordinator,
            status: status || 'ACTIVE',
        });
        await this.logActivity(userId, 'CREATE', 'PROGRAMS', `Created program: ${name} (${code})`, ip, ua);
        return program;
    }
    async updateProgram(id, input, userId, ip, ua) {
        const prog = await this.getProgram(id);
        const { name, code, duration, level, credits, departmentId, coordinator, status } = input;
        const data = {};
        if (name)
            data.name = name;
        if (code)
            data.code = code;
        if (duration !== undefined)
            data.duration = parseInt(duration);
        if (level)
            data.level = level;
        if (credits !== undefined)
            data.credits = parseInt(credits);
        if (departmentId)
            data.departmentId = departmentId;
        if (coordinator !== undefined)
            data.coordinator = coordinator;
        if (status)
            data.status = status;
        const updated = await this.repo.updateProgram(id, data);
        await this.logActivity(userId, 'UPDATE', 'PROGRAMS', `Updated program details for ${prog.code}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 3. COURSES SERVICE
    // ==========================================
    async listCourses(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            params.departmentId = await this.getFacultyDeptId(user.id) || 'none';
        }
        return this.repo.findCourses({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            programId: params.programId,
            departmentId: params.departmentId,
            regulation: params.regulation,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getCourse(id) {
        const course = await this.repo.findCourseById(id);
        if (!course)
            throw new exceptions_1.NotFoundException('Course not found');
        return course;
    }
    async createCourse(input, userId, ip, ua) {
        const { code, name, duration, credits, regulation, coordinator, description, status, programId, departmentId } = input;
        if (!code || !name || !programId || !departmentId) {
            throw new exceptions_1.BadRequestException('Code, Name, Program, and Department are required');
        }
        const course = await this.repo.createCourse({
            code,
            name,
            duration: parseInt(duration),
            credits: credits ? parseInt(credits) : 160,
            regulation: regulation || 'R26',
            coordinator,
            description,
            status: status || 'ACTIVE',
            programId,
            departmentId,
        });
        await this.logActivity(userId, 'CREATE', 'COURSES', `Created Course: ${name} (${code})`, ip, ua);
        return course;
    }
    async updateCourse(id, input, userId, ip, ua) {
        const course = await this.getCourse(id);
        const { name, code, duration, credits, regulation, coordinator, description, status, programId, departmentId } = input;
        const data = {};
        if (name)
            data.name = name;
        if (code)
            data.code = code;
        if (duration !== undefined)
            data.duration = parseInt(duration);
        if (credits !== undefined)
            data.credits = parseInt(credits);
        if (regulation)
            data.regulation = regulation;
        if (coordinator !== undefined)
            data.coordinator = coordinator;
        if (description !== undefined)
            data.description = description;
        if (status)
            data.status = status;
        if (programId)
            data.programId = programId;
        if (departmentId)
            data.departmentId = departmentId;
        const updated = await this.repo.updateCourse(id, data);
        await this.logActivity(userId, 'UPDATE', 'COURSES', `Updated course details for ${course.code}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 4. ACADEMIC YEARS SERVICE
    // ==========================================
    async listYears(params) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        return this.repo.findYears({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getYear(id) {
        const year = await this.repo.findYearById(id);
        if (!year)
            throw new exceptions_1.NotFoundException('Academic Year not found');
        return year;
    }
    async createYear(input, userId, ip, ua) {
        const { name, status, startDate, endDate, isCurrent } = input;
        if (!name || !startDate || !endDate)
            throw new exceptions_1.BadRequestException('Name, Start Date, and End Date are required');
        // If isCurrent is true or status is ACTIVE, let's deactivate all other active ones
        if (isCurrent || status === 'ACTIVE') {
            await prisma_1.prisma.academicYear.updateMany({
                where: { deleted: false },
                data: { isCurrent: false, status: 'INACTIVE' },
            });
        }
        const year = await this.repo.createYear({
            name,
            status: status || 'INACTIVE',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent: !!isCurrent,
        });
        await this.logActivity(userId, 'CREATE', 'ACADEMICS', `Created Academic Year: ${name}`, ip, ua);
        return year;
    }
    async updateYear(id, input, userId, ip, ua) {
        const year = await this.getYear(id);
        const { name, status, startDate, endDate, isCurrent } = input;
        if (isCurrent || status === 'ACTIVE') {
            await prisma_1.prisma.academicYear.updateMany({
                where: { id: { not: id }, deleted: false },
                data: { isCurrent: false, status: 'INACTIVE' },
            });
        }
        const data = {};
        if (name)
            data.name = name;
        if (status)
            data.status = status;
        if (startDate)
            data.startDate = new Date(startDate);
        if (endDate)
            data.endDate = new Date(endDate);
        if (isCurrent !== undefined)
            data.isCurrent = !!isCurrent;
        const updated = await this.repo.updateYear(id, data);
        await this.logActivity(userId, 'UPDATE', 'ACADEMICS', `Updated academic year settings for ${year.name}`, ip, ua);
        return updated;
    }
    async cloneAcademicYear(id, targetName, userId, ip, ua) {
        const sourceYear = await this.getYear(id);
        // Check if target year name already registered
        const existing = await prisma_1.prisma.academicYear.findUnique({ where: { name: targetName } });
        if (existing)
            throw new exceptions_1.BadRequestException(`Academic Year '${targetName}' already exists.`);
        // 1. Create target year
        const targetYear = await prisma_1.prisma.academicYear.create({
            data: {
                name: targetName,
                startDate: new Date(sourceYear.startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
                endDate: new Date(sourceYear.endDate.getTime() + 365 * 24 * 60 * 60 * 1000),
                status: 'INACTIVE',
                isCurrent: false,
            },
        });
        // 2. Clone Departments under source academicYear
        const departments = await prisma_1.prisma.department.findMany({
            where: { academicYearId: sourceYear.id, deleted: false },
        });
        for (const dept of departments) {
            await prisma_1.prisma.department.create({
                data: {
                    code: `${dept.code}-${targetName}`,
                    name: `${dept.name} (${targetName})`,
                    shortName: dept.shortName,
                    description: dept.description,
                    type: dept.type,
                    color: dept.color,
                    email: dept.email,
                    phone: dept.phone,
                    website: dept.website,
                    officeLocation: dept.officeLocation,
                    establishedYear: dept.establishedYear,
                    hodName: dept.hodName,
                    academicYearId: targetYear.id,
                },
            });
        }
        await this.logActivity(userId, 'CREATE', 'ACADEMICS', `Cloned Academic Year ${sourceYear.name} to ${targetName}`, ip, ua);
        return targetYear;
    }
    // ==========================================
    // 5. SEMESTERS SERVICE
    // ==========================================
    async listSemesters(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            params.departmentId = await this.getFacultyDeptId(user.id) || 'none';
        }
        return this.repo.findSemesters({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            courseId: params.courseId,
            programId: params.programId,
            academicYearId: params.academicYearId,
            departmentId: params.departmentId,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getSemester(id) {
        const sem = await this.repo.findSemesterById(id);
        if (!sem)
            throw new exceptions_1.NotFoundException('Semester not found');
        return sem;
    }
    async createSemester(input, userId, ip, ua) {
        const { number, name, startDate, endDate, status, isCurrent, credits, courseId, programId, academicYearId } = input;
        if (!number || !courseId || !programId || !academicYearId) {
            throw new exceptions_1.BadRequestException('Number, Course, Program, and Academic Year are required');
        }
        const semester = await this.repo.createSemester({
            number: parseInt(number),
            name: name || `Semester ${number}`,
            startDate: new Date(startDate || Date.now()),
            endDate: new Date(endDate || Date.now() + 150 * 24 * 60 * 60 * 1000),
            status: status || 'ACTIVE',
            isCurrent: !!isCurrent,
            credits: credits ? parseInt(credits) : 20,
            courseId,
            programId,
            academicYearId,
        });
        await this.logActivity(userId, 'CREATE', 'SEMESTERS', `Created Semester ${number} for course`, ip, ua);
        return semester;
    }
    async updateSemester(id, input, userId, ip, ua) {
        const sem = await this.getSemester(id);
        const { number, name, startDate, endDate, status, isCurrent, credits, courseId, programId, academicYearId } = input;
        const data = {};
        if (number !== undefined)
            data.number = parseInt(number);
        if (name)
            data.name = name;
        if (startDate)
            data.startDate = new Date(startDate);
        if (endDate)
            data.endDate = new Date(endDate);
        if (status)
            data.status = status;
        if (isCurrent !== undefined)
            data.isCurrent = !!isCurrent;
        if (credits !== undefined)
            data.credits = parseInt(credits);
        if (courseId)
            data.courseId = courseId;
        if (programId)
            data.programId = programId;
        if (academicYearId)
            data.academicYearId = academicYearId;
        const updated = await this.repo.updateSemester(id, data);
        await this.logActivity(userId, 'UPDATE', 'SEMESTERS', `Updated Semester details for ${sem.name}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 6. SECTIONS SERVICE
    // ==========================================
    async listSections(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            params.departmentId = await this.getFacultyDeptId(user.id) || 'none';
        }
        return this.repo.findSections({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            semesterId: params.semesterId,
            programId: params.programId,
            departmentId: params.departmentId,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getSection(id) {
        const sec = await this.repo.findSectionById(id);
        if (!sec)
            throw new exceptions_1.NotFoundException('Section not found');
        return sec;
    }
    async createSection(input, userId, ip, ua) {
        const { name, capacity, classAdvisor, room, status, semesterId, programId, departmentId } = input;
        if (!name || !semesterId || !programId || !departmentId) {
            throw new exceptions_1.BadRequestException('Name, Semester, Program, and Department are required');
        }
        const section = await this.repo.createSection({
            name,
            capacity: capacity ? parseInt(capacity) : 60,
            classAdvisor,
            room,
            status: status || 'ACTIVE',
            semesterId,
            programId,
            departmentId,
        });
        await this.logActivity(userId, 'CREATE', 'SECTIONS', `Created Section ${name}`, ip, ua);
        return section;
    }
    async updateSection(id, input, userId, ip, ua) {
        const sec = await this.getSection(id);
        const { name, capacity, classAdvisor, room, status, semesterId, programId, departmentId } = input;
        const data = {};
        if (name)
            data.name = name;
        if (capacity !== undefined)
            data.capacity = parseInt(capacity);
        if (classAdvisor !== undefined)
            data.classAdvisor = classAdvisor;
        if (room !== undefined)
            data.room = room;
        if (status)
            data.status = status;
        if (semesterId)
            data.semesterId = semesterId;
        if (programId)
            data.programId = programId;
        if (departmentId)
            data.departmentId = departmentId;
        const updated = await this.repo.updateSection(id, data);
        await this.logActivity(userId, 'UPDATE', 'SECTIONS', `Updated section details for ${sec.name}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 7. SUBJECTS SERVICE
    // ==========================================
    async listSubjects(params, user) {
        const page = Math.max(1, parseInt(params.page) || 1);
        const pageSize = Math.max(1, parseInt(params.pageSize) || 10);
        if (user && (user.role === 'HOD' || user.role === 'Faculty')) {
            params.departmentId = await this.getFacultyDeptId(user.id) || 'none';
        }
        return this.repo.findSubjects({
            page,
            pageSize,
            search: params.search,
            status: params.status,
            semesterId: params.semesterId,
            departmentId: params.departmentId,
            programId: params.programId,
            sectionId: params.sectionId,
            isCore: params.isCore === 'true' ? true : params.isCore === 'false' ? false : undefined,
            isLab: params.isLab === 'true' ? true : params.isLab === 'false' ? false : undefined,
            isElective: params.isElective === 'true' ? true : params.isElective === 'false' ? false : undefined,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
            includeArchived: params.includeArchived === 'true' || params.includeArchived === true,
        });
    }
    async getSubject(id) {
        const sub = await this.repo.findSubjectById(id);
        if (!sub)
            throw new exceptions_1.NotFoundException('Subject not found');
        return sub;
    }
    async createSubject(input, userId, ip, ua) {
        const { name, code, credits, theoryHours, practicalHours, tutorialHours, internalMarks, externalMarks, passingMarks, isElective, isLab, isCore, isSkillBased, isOpenElective, isProfessionalElective, subjectCoordinator, description, status, semesterId, departmentId, programId, sectionId } = input;
        if (!name || !code || !semesterId || !departmentId || !programId) {
            throw new exceptions_1.BadRequestException('Name, Code, Semester, Department, and Program are required');
        }
        const existing = await prisma_1.prisma.subject.findFirst({ where: { code, deleted: false } });
        if (existing)
            throw new exceptions_1.BadRequestException(`Subject Code '${code}' already registered.`);
        const subject = await this.repo.createSubject({
            name,
            code,
            credits: credits ? parseInt(credits) : 3,
            theoryHours: theoryHours ? parseInt(theoryHours) : 3,
            practicalHours: practicalHours ? parseInt(practicalHours) : 0,
            tutorialHours: tutorialHours ? parseInt(tutorialHours) : 0,
            internalMarks: internalMarks ? parseInt(internalMarks) : 40,
            externalMarks: externalMarks ? parseInt(externalMarks) : 60,
            passingMarks: passingMarks ? parseInt(passingMarks) : 40,
            isElective: !!isElective,
            isLab: !!isLab,
            isCore: isCore !== undefined ? !!isCore : true,
            isSkillBased: !!isSkillBased,
            isOpenElective: !!isOpenElective,
            isProfessionalElective: !!isProfessionalElective,
            subjectCoordinator,
            description,
            status: status || 'ACTIVE',
            semesterId,
            departmentId,
            programId,
            sectionId: sectionId || null,
        });
        await this.logActivity(userId, 'CREATE', 'SUBJECTS', `Created Subject: ${name} (${code})`, ip, ua);
        return subject;
    }
    async updateSubject(id, input, userId, ip, ua) {
        const sub = await this.getSubject(id);
        const { name, code, credits, theoryHours, practicalHours, tutorialHours, internalMarks, externalMarks, passingMarks, isElective, isLab, isCore, isSkillBased, isOpenElective, isProfessionalElective, subjectCoordinator, description, status, semesterId, departmentId, programId, sectionId } = input;
        const data = {};
        if (name)
            data.name = name;
        if (code)
            data.code = code;
        if (credits !== undefined)
            data.credits = parseInt(credits);
        if (theoryHours !== undefined)
            data.theoryHours = parseInt(theoryHours);
        if (practicalHours !== undefined)
            data.practicalHours = parseInt(practicalHours);
        if (tutorialHours !== undefined)
            data.tutorialHours = parseInt(tutorialHours);
        if (internalMarks !== undefined)
            data.internalMarks = parseInt(internalMarks);
        if (externalMarks !== undefined)
            data.externalMarks = parseInt(externalMarks);
        if (passingMarks !== undefined)
            data.passingMarks = parseInt(passingMarks);
        if (isElective !== undefined)
            data.isElective = !!isElective;
        if (isLab !== undefined)
            data.isLab = !!isLab;
        if (isCore !== undefined)
            data.isCore = !!isCore;
        if (isSkillBased !== undefined)
            data.isSkillBased = !!isSkillBased;
        if (isOpenElective !== undefined)
            data.isOpenElective = !!isOpenElective;
        if (isProfessionalElective !== undefined)
            data.isProfessionalElective = !!isProfessionalElective;
        if (subjectCoordinator !== undefined)
            data.subjectCoordinator = subjectCoordinator;
        if (description !== undefined)
            data.description = description;
        if (status)
            data.status = status;
        if (semesterId)
            data.semesterId = semesterId;
        if (departmentId)
            data.departmentId = departmentId;
        if (programId)
            data.programId = programId;
        if (sectionId !== undefined)
            data.sectionId = sectionId || null;
        const updated = await this.repo.updateSubject(id, data);
        await this.logActivity(userId, 'UPDATE', 'SUBJECTS', `Updated subject details for ${sub.code}`, ip, ua);
        return updated;
    }
    // ==========================================
    // BULK ACTIONS
    // ==========================================
    async bulkDelete(moduleKey, ids, userId, ip, ua) {
        const prismaModelName = this.getPrismaModelName(moduleKey);
        await this.repo.bulkDelete(prismaModelName, ids);
        await this.logActivity(userId, 'DELETE', moduleKey.toUpperCase(), `Bulk soft-deleted ${ids.length} records`, ip, ua);
    }
    async bulkArchive(moduleKey, ids, userId, ip, ua) {
        const prismaModelName = this.getPrismaModelName(moduleKey);
        await this.repo.bulkArchive(prismaModelName, ids);
        await this.logActivity(userId, 'UPDATE', moduleKey.toUpperCase(), `Bulk archived ${ids.length} records`, ip, ua);
    }
    async bulkRestore(moduleKey, ids, userId, ip, ua) {
        const prismaModelName = this.getPrismaModelName(moduleKey);
        await this.repo.bulkRestore(prismaModelName, ids);
        await this.logActivity(userId, 'UPDATE', moduleKey.toUpperCase(), `Bulk restored/unarchived ${ids.length} records`, ip, ua);
    }
    // ==========================================
    // ACADEMIC DASHBOARD STATS
    // ==========================================
    async getDashboardStats() {
        const [depts, progs, courses, years, sems, secs, subs] = await Promise.all([
            prisma_1.prisma.department.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.program.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.course.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.academicYear.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.semester.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.section.count({ where: { deleted: false, archived: false } }),
            prisma_1.prisma.subject.count({ where: { deleted: false, archived: false } }),
        ]);
        // Growth / Distribution calculation
        const deptsDistribution = await prisma_1.prisma.department.groupBy({
            by: ['type'],
            _count: { id: true },
            where: { deleted: false, archived: false },
        });
        const levelDistribution = await prisma_1.prisma.program.groupBy({
            by: ['level'],
            _count: { id: true },
            where: { deleted: false, archived: false },
        });
        const subjectTypes = await prisma_1.prisma.subject.groupBy({
            by: ['isCore', 'isLab', 'isElective'],
            _count: { id: true },
            where: { deleted: false, archived: false },
        });
        const recentLogs = await prisma_1.prisma.userActivityLog.findMany({
            where: { module: { in: ['DEPARTMENTS', 'PROGRAMS', 'COURSES', 'ACADEMICS', 'SEMESTERS', 'SECTIONS', 'SUBJECTS'] } },
            orderBy: { createdAt: 'desc' },
            take: 8,
            include: { user: true },
        });
        return {
            totals: { depts, progs, courses, years, sems, secs, subs },
            deptsDistribution: deptsDistribution.map((d) => ({ name: d.type, value: d._count.id })),
            levelDistribution: levelDistribution.map((l) => ({ name: l.level, value: l._count.id })),
            recentLogs: recentLogs.map((l) => ({
                id: l.id,
                user: `${l.user.firstName} ${l.user.lastName}`,
                action: l.action,
                module: l.module,
                description: l.description,
                timestamp: l.createdAt,
            })),
        };
    }
    // ==========================================
    // BULK CSV/EXCEL IMPORTS & DUPLICATES PREVIEW
    // ==========================================
    async previewImport(moduleKey, rows) {
        const report = {
            valid: [],
            duplicates: [],
            errors: [],
        };
        for (let idx = 0; idx < rows.length; idx++) {
            const row = rows[idx];
            const lineNo = idx + 1;
            try {
                if (moduleKey === 'departments') {
                    const { code, name, type, shortName } = row;
                    if (!code || !name)
                        throw new Error('Code and Name are mandatory');
                    const duplicate = await prisma_1.prisma.department.findFirst({ where: { code, deleted: false } });
                    if (duplicate) {
                        report.duplicates.push({ line: lineNo, row, message: `Department code '${code}' already exists` });
                    }
                    else {
                        report.valid.push(row);
                    }
                }
                else if (moduleKey === 'subjects') {
                    const { code, name, credits, semesterCode } = row;
                    if (!code || !name)
                        throw new Error('Code and Name are mandatory');
                    const duplicate = await prisma_1.prisma.subject.findFirst({ where: { code, deleted: false } });
                    if (duplicate) {
                        report.duplicates.push({ line: lineNo, row, message: `Subject code '${code}' already exists` });
                    }
                    else {
                        report.valid.push(row);
                    }
                }
                else {
                    // General validation check: just treat as valid if name/code is present
                    if (!row.code && !row.name)
                        throw new Error('Both Code and Name must be defined');
                    report.valid.push(row);
                }
            }
            catch (err) {
                report.errors.push({ line: lineNo, row, message: err.message });
            }
        }
        return report;
    }
    async executeImport(moduleKey, rows, userId, ip, ua) {
        let count = 0;
        // Quick and dirty bulk inserts based on model keys
        if (moduleKey === 'departments') {
            for (const row of rows) {
                await prisma_1.prisma.department.create({
                    data: {
                        code: row.code,
                        name: row.name,
                        shortName: row.shortName || null,
                        description: row.description || null,
                        type: row.type || 'Engineering',
                        status: 'ACTIVE',
                    },
                });
                count++;
            }
        }
        else if (moduleKey === 'programs') {
            const defaultDept = await prisma_1.prisma.department.findFirst({ where: { deleted: false } });
            if (!defaultDept)
                throw new exceptions_1.BadRequestException('Create at least one Department before importing programs');
            for (const row of rows) {
                await prisma_1.prisma.program.create({
                    data: {
                        code: row.code,
                        name: row.name,
                        duration: parseInt(row.duration) || 4,
                        level: row.level || 'UG',
                        credits: parseInt(row.credits) || 160,
                        departmentId: defaultDept.id,
                        status: 'ACTIVE',
                    },
                });
                count++;
            }
        }
        else if (moduleKey === 'subjects') {
            const defaultSem = await prisma_1.prisma.semester.findFirst({ where: { deleted: false } });
            const defaultDept = await prisma_1.prisma.department.findFirst({ where: { deleted: false } });
            const defaultProg = await prisma_1.prisma.program.findFirst({ where: { deleted: false } });
            if (!defaultSem || !defaultDept || !defaultProg) {
                throw new exceptions_1.BadRequestException('Academics tables (Semesters, Depts, Programs) must be seeded first');
            }
            for (const row of rows) {
                await prisma_1.prisma.subject.create({
                    data: {
                        code: row.code,
                        name: row.name,
                        credits: parseInt(row.credits) || 3,
                        theoryHours: parseInt(row.theoryHours) || 3,
                        practicalHours: parseInt(row.practicalHours) || 0,
                        tutorialHours: parseInt(row.tutorialHours) || 0,
                        semesterId: defaultSem.id,
                        departmentId: defaultDept.id,
                        programId: defaultProg.id,
                        status: 'ACTIVE',
                    },
                });
                count++;
            }
        }
        else {
            throw new exceptions_1.BadRequestException(`Import not implemented for module: ${moduleKey}`);
        }
        await this.logActivity(userId, 'CREATE', moduleKey.toUpperCase(), `Imported ${count} records via file upload`, ip, ua);
        return { importedCount: count };
    }
    // ==========================================
    // HELPERS
    // ==========================================
    getPrismaModelName(moduleKey) {
        switch (moduleKey) {
            case 'departments': return 'department';
            case 'programs': return 'program';
            case 'courses': return 'course';
            case 'years': return 'academicYear';
            case 'semesters': return 'semester';
            case 'sections': return 'section';
            case 'subjects': return 'subject';
            default: throw new Error(`Invalid academics module key: ${moduleKey}`);
        }
    }
    async logActivity(userId, action, module, description, ip, ua) {
        try {
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId,
                    action,
                    module,
                    description,
                    ipAddress: ip || null,
                    userAgent: ua || null,
                },
            });
        }
        catch (err) {
            console.error('Failed to write activity log:', err);
        }
    }
}
exports.AcademicsService = AcademicsService;
//# sourceMappingURL=academics.service.js.map