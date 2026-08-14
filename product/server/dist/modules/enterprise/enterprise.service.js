"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseService = void 0;
const enterprise_repository_1 = require("./enterprise.repository");
const prisma_1 = require("../../lib/prisma");
const socket_1 = require("../../lib/socket");
const exceptions_1 = require("../../utils/exceptions");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const student_access_service_1 = require("../security/student-access.service");
const notification_service_1 = require("../notifications/notification.service");
class EnterpriseService {
    repo = new enterprise_repository_1.EnterpriseRepository();
    // ==========================================
    // 1. STUDENTS
    // ==========================================
    async listStudents(params, user) {
        if (!user)
            return this.repo.findStudents(params);
        const scopeWhere = await student_access_service_1.StudentAccessService.visibleStudentWhere(user);
        return this.repo.findStudents({ ...params, scopeWhere });
    }
    async getStudent(id) {
        const student = await this.repo.findStudentById(id);
        if (!student)
            throw new exceptions_1.NotFoundException('Student profile not found');
        return student;
    }
    async createStudent(input, userId, ip, ua) {
        const { admissionNo, firstName, lastName, email, phone, dob, dateOfAdmission, gender, bloodGroup, religion, category, parentName, parentPhone, parentEmail, parentOccupation, currentAddress, permanentAddress, scholarship, academicYearId, departmentId, programId, courseId, semesterId, sectionId, hostelId, roomNo, transportRouteId, transportStopId, mentorId, facultyId, classAdvisorId } = input;
        if (!email) {
            throw new exceptions_1.BadRequestException('Official Email ID is required for credentials generation.');
        }
        if (!phone) {
            throw new exceptions_1.BadRequestException('Registered Mobile Number is required for password generation.');
        }
        if (!admissionNo || !firstName || !lastName || !parentName || !parentPhone || !academicYearId || !departmentId || !programId || !courseId || !semesterId || !sectionId) {
            throw new exceptions_1.BadRequestException('Admission Details, Full Name, Parent Details, and Academic Mapping are required');
        }
        const existing = await prisma_1.prisma.student.findFirst({ where: { admissionNo, deleted: false } });
        if (existing)
            throw new exceptions_1.BadRequestException(`Admission Number '${admissionNo}' is already registered`);
        const emailExists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (emailExists)
            throw new exceptions_1.BadRequestException(`Official Email ID '${email}' is already registered by another user.`);
        const phoneExists = await prisma_1.prisma.student.findFirst({ where: { phone, deleted: false } });
        if (phoneExists)
            throw new exceptions_1.BadRequestException(`Mobile Number '${phone}' is already registered by another student.`);
        // 1. Get or create Student role
        let studentRole = await prisma_1.prisma.role.findFirst({ where: { name: 'Student' } });
        if (!studentRole) {
            studentRole = await prisma_1.prisma.role.create({
                data: { name: 'Student', description: 'Student Access Role', color: '#3b82f6', icon: 'GraduationCap' }
            });
        }
        // 2. Resolve email/username identifier
        const userEmail = email;
        // 3. Check if user already exists
        let userRecord = await prisma_1.prisma.user.findUnique({ where: { email: userEmail } });
        if (!userRecord) {
            const passwordHash = await bcryptjs_1.default.hash(phone, 10);
            userRecord = await prisma_1.prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash,
                    firstName,
                    lastName,
                    status: 'ACTIVE',
                    roleId: studentRole.id,
                    forcePasswordChange: true
                }
            });
        }
        // Fetch the semester to check its number
        const semester = await prisma_1.prisma.semester.findUnique({
            where: { id: semesterId }
        });
        const semNumber = semester ? semester.number : 1;
        let operationalDeptId = departmentId; // default
        const programDeptId = departmentId; // permanent selected engineering branch
        if (semNumber === 1 || semNumber === 2) {
            // Must be academically managed under Science & Humanities (S&H)
            let snhDept = await prisma_1.prisma.department.findFirst({
                where: {
                    OR: [
                        { code: 'SNH' },
                        { code: 'S&H' },
                        { name: { contains: 'Humanities' } }
                    ]
                }
            });
            if (!snhDept) {
                snhDept = await prisma_1.prisma.department.create({
                    data: {
                        name: 'Science & Humanities',
                        code: 'SNH',
                        shortName: 'S&H',
                        description: 'Department of Science and Humanities (First Year)',
                        type: 'Engineering',
                        color: '#7C3AED',
                        establishedYear: 2010
                    }
                });
            }
            operationalDeptId = snhDept.id;
        }
        // AUTO ASSIGNMENT: Automatically assign Mentor, Faculty, and Class Advisor mappings
        let resolvedFacultyId = facultyId || mentorId || null;
        if (!resolvedFacultyId) {
            const defaultFaculty = await prisma_1.prisma.faculty.findFirst({
                where: { departmentId: operationalDeptId, deleted: false }
            });
            if (defaultFaculty) {
                resolvedFacultyId = defaultFaculty.id;
            }
        }
        const resolvedMentorId = resolvedFacultyId; // Sync mentorId with facultyId
        const resolvedClassAdvisorId = classAdvisorId || resolvedFacultyId;
        const student = await this.repo.createStudent({
            admissionNo,
            firstName,
            lastName,
            email,
            phone,
            dob: new Date(dob),
            dateOfAdmission: new Date(dateOfAdmission),
            gender,
            bloodGroup,
            religion,
            category,
            parentName,
            parentPhone,
            parentEmail,
            parentOccupation,
            currentAddress,
            permanentAddress,
            scholarship,
            academicYearId,
            departmentId: operationalDeptId,
            programDepartmentId: programDeptId,
            programId,
            courseId,
            semesterId,
            sectionId,
            hostelId: hostelId || null,
            roomNo: roomNo || null,
            transportRouteId: transportRouteId || null,
            transportStopId: transportStopId || null,
            userId: userRecord.id,
            mentorId: resolvedMentorId,
            facultyId: resolvedFacultyId,
            classAdvisorId: resolvedClassAdvisorId,
        });
        // Create Mentor Assignment log if mentor resolved
        if (resolvedMentorId) {
            await prisma_1.prisma.mentorAssignment.create({
                data: {
                    mentorId: resolvedMentorId,
                    studentId: student.id,
                    departmentId: student.departmentId,
                    programId: student.programId,
                    semesterId: student.semesterId,
                    sectionId: student.sectionId,
                    academicYearId: student.academicYearId,
                    assignedBy: userId,
                    status: 'ACTIVE'
                }
            });
        }
        await this.logActivity(userId, 'CREATE', 'STUDENTS', `Admitted Student: ${firstName} ${lastName} (${admissionNo})`, ip, ua);
        return student;
    }
    async updateStudent(id, input, userId, ip, ua) {
        const student = await this.getStudent(id);
        const { firstName, lastName, email, phone, dob, dateOfAdmission, gender, bloodGroup, religion, category, parentName, parentPhone, parentEmail, parentOccupation, currentAddress, permanentAddress, scholarship, academicYearId, departmentId, programId, courseId, semesterId, sectionId, hostelId, roomNo, transportRouteId, transportStopId, promoted, status, mentorId, facultyId, classAdvisorId } = input;
        const data = {};
        if (firstName)
            data.firstName = firstName;
        if (lastName)
            data.lastName = lastName;
        if (email !== undefined)
            data.email = email;
        if (phone !== undefined)
            data.phone = phone;
        if (dob)
            data.dob = new Date(dob);
        if (dateOfAdmission)
            data.dateOfAdmission = new Date(dateOfAdmission);
        if (gender)
            data.gender = gender;
        if (bloodGroup !== undefined)
            data.bloodGroup = bloodGroup;
        if (religion !== undefined)
            data.religion = religion;
        if (category !== undefined)
            data.category = category;
        if (parentName)
            data.parentName = parentName;
        if (parentPhone)
            data.parentPhone = parentPhone;
        if (parentEmail !== undefined)
            data.parentEmail = parentEmail;
        if (parentOccupation !== undefined)
            data.parentOccupation = parentOccupation;
        if (currentAddress)
            data.currentAddress = currentAddress;
        if (permanentAddress)
            data.permanentAddress = permanentAddress;
        if (scholarship !== undefined)
            data.scholarship = scholarship;
        if (academicYearId)
            data.academicYearId = academicYearId;
        if (programId)
            data.programId = programId;
        if (courseId)
            data.courseId = courseId;
        if (semesterId)
            data.semesterId = semesterId;
        if (sectionId)
            data.sectionId = sectionId;
        // Resolve S&H and Program Department logic dynamically
        const targetSemesterId = semesterId || student.semesterId;
        const semRecord = await prisma_1.prisma.semester.findUnique({
            where: { id: targetSemesterId }
        });
        const semNumber = semRecord ? semRecord.number : 1;
        const programDeptId = departmentId || student.programDepartmentId || student.departmentId;
        if (semNumber === 1 || semNumber === 2) {
            let snhDept = await prisma_1.prisma.department.findFirst({
                where: {
                    OR: [
                        { code: 'SNH' },
                        { code: 'S&H' },
                        { name: { contains: 'Humanities' } }
                    ]
                }
            });
            if (!snhDept) {
                snhDept = await prisma_1.prisma.department.create({
                    data: {
                        name: 'Science & Humanities',
                        code: 'SNH',
                        shortName: 'S&H',
                        description: 'Department of Science and Humanities (First Year)',
                        type: 'Engineering',
                        color: '#7C3AED',
                        establishedYear: 2010
                    }
                });
            }
            data.departmentId = snhDept.id;
            data.programDepartmentId = programDeptId;
        }
        else {
            data.departmentId = programDeptId;
            data.programDepartmentId = programDeptId;
            // Promotion automation: S&H -> Original branch
            const currentSemester = await prisma_1.prisma.semester.findUnique({
                where: { id: student.semesterId }
            });
            if (currentSemester && (currentSemester.number === 1 || currentSemester.number === 2)) {
                // Auto assign department mentor
                const newMentor = await prisma_1.prisma.faculty.findFirst({
                    where: { departmentId: programDeptId, deleted: false }
                });
                if (newMentor) {
                    data.mentorId = newMentor.id;
                    data.facultyId = newMentor.id;
                    data.classAdvisorId = newMentor.id;
                }
            }
        }
        if (hostelId !== undefined)
            data.hostelId = hostelId || null;
        if (roomNo !== undefined)
            data.roomNo = roomNo || null;
        if (transportRouteId !== undefined)
            data.transportRouteId = transportRouteId || null;
        if (transportStopId !== undefined)
            data.transportStopId = transportStopId || null;
        if (promoted !== undefined)
            data.promoted = !!promoted;
        if (status)
            data.status = status;
        if (classAdvisorId !== undefined) {
            data.classAdvisorId = classAdvisorId || null;
        }
        const resolvedFacultyId = facultyId !== undefined ? facultyId : (mentorId !== undefined ? mentorId : undefined);
        if (resolvedFacultyId !== undefined) {
            const actualFacultyId = resolvedFacultyId || null;
            data.facultyId = actualFacultyId;
            data.mentorId = actualFacultyId; // Sync mentorId with facultyId
            if (actualFacultyId !== student.facultyId) {
                // Mark existing assignments as historic
                await prisma_1.prisma.mentorAssignment.updateMany({
                    where: { studentId: id, status: 'ACTIVE' },
                    data: { status: 'HISTORIC' }
                });
                if (actualFacultyId) {
                    await prisma_1.prisma.mentorAssignment.create({
                        data: {
                            mentorId: actualFacultyId,
                            studentId: id,
                            departmentId: departmentId || student.departmentId,
                            programId: programId || student.programId,
                            semesterId: semesterId || student.semesterId,
                            sectionId: sectionId || student.sectionId,
                            academicYearId: academicYearId || student.academicYearId,
                            assignedBy: userId,
                            status: 'ACTIVE'
                        }
                    });
                }
            }
        }
        const updated = await this.repo.updateStudent(id, data);
        await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Updated Student profile for ${student.admissionNo}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 2. FACULTY
    // ==========================================
    async listFaculties(params, user) {
        return this.repo.findFaculties(params, user);
    }
    async getFaculty(id) {
        const faculty = await this.repo.findFacultyById(id);
        if (!faculty)
            throw new exceptions_1.NotFoundException('Faculty profile not found');
        return faculty;
    }
    async createFaculty(input, userId, ip, ua) {
        const { employeeId, firstName, lastName, email, phone, dob, dateOfJoining, designation, qualification, experience, departmentId, status, subjectMappings } = input;
        if (!email) {
            throw new exceptions_1.BadRequestException('Official Email ID is required for credentials generation.');
        }
        if (!phone) {
            throw new exceptions_1.BadRequestException('Registered Mobile Number is required for password generation.');
        }
        if (!employeeId || !firstName || !lastName || !designation || !qualification || !departmentId) {
            throw new exceptions_1.BadRequestException('All key details (employeeId, name, email, phone, designation, qualification, and departmentId) are required');
        }
        const existing = await prisma_1.prisma.faculty.findFirst({ where: { employeeId, deleted: false } });
        if (existing)
            throw new exceptions_1.BadRequestException(`Employee ID '${employeeId}' is already registered`);
        const emailExists = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (emailExists)
            throw new exceptions_1.BadRequestException(`Official Email ID '${email}' is already registered by another user.`);
        const phoneExists = await prisma_1.prisma.faculty.findFirst({ where: { phone, deleted: false } });
        if (phoneExists)
            throw new exceptions_1.BadRequestException(`Mobile Number '${phone}' is already registered by another faculty member.`);
        // 1. Resolve role name based on designation
        let targetRoleName = 'Faculty';
        const des = designation.toUpperCase();
        if (des.includes('HOD') || des.includes('HEAD')) {
            targetRoleName = 'HOD';
        }
        else if (des.includes('ACADEMIC DEAN') || des.includes('DEAN OF ACADEMICS')) {
            targetRoleName = 'Academic Dean';
        }
        else if (des.includes('ADMISSION DEAN') || des.includes('DEAN OF ADMISSIONS') || des.includes('DEAN (ADMISSIONS)')) {
            targetRoleName = 'Admission Dean';
        }
        else if (des.includes('VICE PRINCIPAL') || des.includes('VP')) {
            targetRoleName = 'Vice Principal';
        }
        else if (des.includes('PRINCIPAL')) {
            targetRoleName = 'Principal';
        }
        let facultyRole = await prisma_1.prisma.role.findFirst({ where: { name: targetRoleName } });
        if (!facultyRole) {
            facultyRole = await prisma_1.prisma.role.findFirst({ where: { name: 'Faculty' } });
            if (!facultyRole) {
                facultyRole = await prisma_1.prisma.role.create({
                    data: { name: 'Faculty', description: 'Faculty Access Role', color: '#10b981', icon: 'UserCheck' }
                });
            }
        }
        // 2. Resolve email/username identifier
        const userEmail = email;
        // 3. Check if user already exists
        let userRecord = await prisma_1.prisma.user.findUnique({ where: { email: userEmail } });
        if (!userRecord) {
            const passwordHash = await bcryptjs_1.default.hash(phone, 10);
            userRecord = await prisma_1.prisma.user.create({
                data: {
                    email: userEmail,
                    passwordHash,
                    firstName,
                    lastName,
                    status: 'ACTIVE',
                    roleId: facultyRole.id,
                    forcePasswordChange: true
                }
            });
        }
        const faculty = await this.repo.createFaculty({
            employeeId,
            firstName,
            lastName,
            email,
            phone,
            dob: new Date(dob),
            dateOfJoining: new Date(dateOfJoining),
            designation,
            qualification,
            experience: experience ? parseInt(experience) : 0,
            departmentId,
            status: status || 'ACTIVE',
            subjectMappings: subjectMappings || '[]',
            userId: userRecord.id,
        });
        await this.logActivity(userId, 'CREATE', 'FACULTY', `Registered Faculty: ${firstName} ${lastName} (${employeeId})`, ip, ua);
        return faculty;
    }
    async updateFaculty(id, input, userId, ip, ua) {
        const faculty = await this.getFaculty(id);
        const { firstName, lastName, email, phone, dob, dateOfJoining, designation, qualification, experience, departmentId, status, subjectMappings } = input;
        const data = {};
        if (firstName)
            data.firstName = firstName;
        if (lastName)
            data.lastName = lastName;
        if (email)
            data.email = email;
        if (phone)
            data.phone = phone;
        if (dob)
            data.dob = new Date(dob);
        if (dateOfJoining)
            data.dateOfJoining = new Date(dateOfJoining);
        if (designation)
            data.designation = designation;
        if (qualification)
            data.qualification = qualification;
        if (experience !== undefined)
            data.experience = parseInt(experience);
        if (departmentId)
            data.departmentId = departmentId;
        if (status)
            data.status = status;
        if (subjectMappings !== undefined)
            data.subjectMappings = subjectMappings;
        const updated = await this.repo.updateFaculty(id, data);
        await this.logActivity(userId, 'UPDATE', 'FACULTY', `Updated Faculty profile for ${faculty.employeeId}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 3. ATTENDANCE
    // ==========================================
    async listAttendances(params, user) {
        return this.repo.findAttendances(params, user);
    }
    async recordAttendance(input, userId, ip, ua) {
        const { date, status, type, remarks, studentId, facultyId, subjectId } = input;
        if (!date || !status)
            throw new exceptions_1.BadRequestException('Date and Status are required');
        // Security Check: Limit regular faculty to assigned subjects only
        if (subjectId) {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId } });
            if (faculty) {
                const userRecord = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
                const isAcademicStaffOrAdmin = userRecord && ['SuperAdmin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(userRecord.role.name);
                if (!isAcademicStaffOrAdmin) {
                    const assignment = await prisma_1.prisma.subjectAssignment.findFirst({
                        where: { facultyId: faculty.id, subjectId }
                    });
                    if (!assignment) {
                        throw new exceptions_1.BadRequestException('Security Alert: You are not assigned to record attendance for this subject.');
                    }
                }
            }
        }
        const attendance = await this.repo.createAttendance({
            date: new Date(date),
            status,
            type: type || 'DAILY',
            remarks,
            studentId: studentId || null,
            facultyId: facultyId || null,
            subjectId: subjectId || null,
        });
        const targetType = studentId ? 'Student' : 'Faculty';
        await this.logActivity(userId, 'CREATE', 'ATTENDANCE', `Recorded ${type || 'DAILY'} Attendance for ${targetType} - Status: ${status}`, ip, ua);
        const departmentId = studentId ? (await prisma_1.prisma.student.findUnique({ where: { id: studentId }, select: { departmentId: true } }))?.departmentId : facultyId ? (await prisma_1.prisma.faculty.findUnique({ where: { id: facultyId }, select: { departmentId: true } }))?.departmentId : null;
        (0, socket_1.broadcastRBACUpdate)({ type: 'ATTENDANCE_UPDATED', payload: { departmentId, subjectId, recordedAt: new Date().toISOString() } });
        return attendance;
    }
    async recordBulkAttendance(input, userId, ip, ua) {
        const { date, type, subjectId, records } = input;
        if (!date || !records || !Array.isArray(records))
            throw new exceptions_1.BadRequestException('Date and records array are required');
        // Security Check: Limit regular faculty to assigned subjects only
        if (subjectId) {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId } });
            if (faculty) {
                const userRecord = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
                const isAcademicStaffOrAdmin = userRecord && ['SuperAdmin', 'HOD', 'Academic Dean', 'Principal', 'Vice Principal'].includes(userRecord.role.name);
                if (!isAcademicStaffOrAdmin) {
                    const assignment = await prisma_1.prisma.subjectAssignment.findFirst({
                        where: { facultyId: faculty.id, subjectId }
                    });
                    if (!assignment) {
                        throw new exceptions_1.BadRequestException('Security Alert: You are not assigned to record attendance for this subject.');
                    }
                }
            }
        }
        let count = 0;
        for (const r of records) {
            await this.repo.createAttendance({
                date: new Date(date),
                status: r.status, // PRESENT, ABSENT, LATE
                type: type || 'DAILY',
                remarks: r.remarks || null,
                studentId: r.studentId || null,
                facultyId: r.facultyId || null,
                subjectId: subjectId || null,
            });
            count++;
        }
        await this.logActivity(userId, 'CREATE', 'ATTENDANCE', `Recorded bulk attendance for ${count} students`, ip, ua);
        const firstStudentId = records.find((record) => record.studentId)?.studentId;
        const departmentId = firstStudentId ? (await prisma_1.prisma.student.findUnique({ where: { id: firstStudentId }, select: { departmentId: true } }))?.departmentId : null;
        (0, socket_1.broadcastRBACUpdate)({ type: 'ATTENDANCE_UPDATED', payload: { departmentId, subjectId, count, recordedAt: new Date().toISOString() } });
        return { count };
    }
    // ==========================================
    // 4. EXAMS
    // ==========================================
    async listExams(params, user) {
        return this.repo.findExams(params, user);
    }
    async getExam(id) {
        const exam = await this.repo.findExamById(id);
        if (!exam)
            throw new exceptions_1.NotFoundException('Exam not found');
        return exam;
    }
    async createExam(input, userId, ip, ua) {
        const { name, type, startDate, endDate, status, schedule, hallAllocation, invigilators, academicYearId, courseId, semesterId, facultyId } = input;
        if (!name || !startDate || !endDate || !academicYearId || !courseId || !semesterId) {
            throw new exceptions_1.BadRequestException('Name, Date limits, Academic Year, Course, and Semester are required');
        }
        const exam = await this.repo.createExam({
            name,
            type: type || 'INTERNAL',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: status || 'DRAFT',
            schedule: schedule || '[]',
            hallAllocation: hallAllocation || '[]',
            invigilators: invigilators || '[]',
            academicYearId,
            courseId,
            semesterId,
            facultyId: facultyId || null,
        });
        await this.logActivity(userId, 'CREATE', 'EXAMS', `Created exam schedule: ${name}`, ip, ua);
        return exam;
    }
    async updateExam(id, input, userId, ip, ua) {
        const exam = await this.getExam(id);
        const { name, type, startDate, endDate, status, schedule, hallAllocation, invigilators, academicYearId, courseId, semesterId, facultyId } = input;
        const data = {};
        if (name)
            data.name = name;
        if (type)
            data.type = type;
        if (startDate)
            data.startDate = new Date(startDate);
        if (endDate)
            data.endDate = new Date(endDate);
        if (status)
            data.status = status;
        if (schedule !== undefined)
            data.schedule = schedule;
        if (hallAllocation !== undefined)
            data.hallAllocation = hallAllocation;
        if (invigilators !== undefined)
            data.invigilators = invigilators;
        if (academicYearId)
            data.academicYearId = academicYearId;
        if (courseId)
            data.courseId = courseId;
        if (semesterId)
            data.semesterId = semesterId;
        if (facultyId !== undefined)
            data.facultyId = facultyId || null;
        const updated = await this.repo.updateExam(id, data);
        await this.logActivity(userId, 'UPDATE', 'EXAMS', `Updated exam details for ${exam.name}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 5. MARKS
    // ==========================================
    async listMarks(params, user) {
        return this.repo.findMarks(params, user);
    }
    async recordMark(input, userId, activeRole, ip, ua) {
        const { internalMarks, externalMarks, practicalMarks, examId, studentId, subjectId, status } = input;
        if (!examId || !studentId || !subjectId)
            throw new exceptions_1.BadRequestException('Exam, Student, and Subject mappings are required');
        const values = [internalMarks, externalMarks, practicalMarks].map((value) => Number(value || 0));
        if (values.some((value) => !Number.isInteger(value) || value < 0))
            throw new exceptions_1.BadRequestException('Marks must be non-negative whole numbers');
        const [internal, external, practical] = values;
        const requestedStatus = String(status || 'DRAFT').toUpperCase();
        if (!['DRAFT', 'SUBMITTED'].includes(requestedStatus))
            throw new exceptions_1.BadRequestException('Marks can only be saved as draft or submitted through this endpoint');
        const role = String(activeRole || '').toUpperCase().replace(/[\s_-]+/g, '');
        if (role === 'FACULTY') {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId, deleted: false }, select: { id: true } });
            if (!faculty)
                throw new exceptions_1.UnauthorizedException('Faculty profile not found');
            const assignment = await prisma_1.prisma.subjectAssignment.findFirst({ where: { facultyId: faculty.id, subjectId } });
            if (!assignment)
                throw new exceptions_1.UnauthorizedException('You are not assigned to enter marks for this subject');
        }
        const existing = await prisma_1.prisma.mark.findUnique({ where: { examId_studentId_subjectId: { examId, studentId, subjectId } } });
        if (existing && ['LOCKED', 'PUBLISHED'].includes(existing.status))
            throw new exceptions_1.BadRequestException('Locked or published marks require an authorized correction workflow');
        const total = internal + external + practical;
        const mark = await prisma_1.prisma.mark.upsert({
            where: { examId_studentId_subjectId: { examId, studentId, subjectId } },
            update: {
                internalMarks: internal, externalMarks: external, practicalMarks: practical,
                grade: 'PENDING', gpa: 0, cgpa: 0, status: requestedStatus,
            },
            create: {
                internalMarks: internal, externalMarks: external, practicalMarks: practical,
                grade: 'PENDING', gpa: 0, cgpa: 0, status: requestedStatus,
                examId,
                studentId,
                subjectId,
            },
        });
        await this.logActivity(userId, 'CREATE', 'MARKS', `Saved student exam marks as ${requestedStatus} - Total: ${total}; grade calculation pending configured regulation`, ip, ua);
        return mark;
    }
    // ==========================================
    // 6. FEES
    // ==========================================
    async listFeeCategories(params) {
        return this.repo.findFeeCategories(params);
    }
    async createFeeCategory(input, userId, ip, ua) {
        const { name, description, amount } = input;
        if (!name || !amount)
            throw new exceptions_1.BadRequestException('Name and billing Amount are required');
        const category = await this.repo.createFeeCategory({
            name,
            description,
            amount: parseFloat(amount),
        });
        await this.logActivity(userId, 'CREATE', 'FEES', `Created Fee Category: ${name}`, ip, ua);
        return category;
    }
    async listFeeBills(params, user) {
        return this.repo.findFeeBills(params, user);
    }
    async createFeeBill(input, userId, ip, ua) {
        const { studentId, categoryId, scholarshipDiscount, fine, paidAmount, billingDate, dueDate, status } = input;
        if (!studentId || !categoryId || !billingDate || !dueDate)
            throw new exceptions_1.BadRequestException('Student, Category, and Dates are required');
        const cat = await prisma_1.prisma.feeCategory.findUnique({ where: { id: categoryId } });
        if (!cat)
            throw new exceptions_1.NotFoundException('Fee category not found');
        const amount = cat.amount;
        const bill = await this.repo.createFeeBill({
            amount,
            scholarshipDiscount: parseFloat(scholarshipDiscount) || 0.0,
            fine: parseFloat(fine) || 0.0,
            paidAmount: parseFloat(paidAmount) || 0.0,
            status: status || 'PENDING',
            billingDate: new Date(billingDate),
            dueDate: new Date(dueDate),
            studentId,
            categoryId,
        });
        await this.logActivity(userId, 'CREATE', 'FEES', `Billed Tuition fees for student`, ip, ua);
        return bill;
    }
    async recordPayment(id, input, userId, ip, ua) {
        const bill = await prisma_1.prisma.feeBill.findUnique({ where: { id } });
        if (!bill)
            throw new exceptions_1.NotFoundException('Fee bill not found');
        const { payAmount, paymentMode = 'Cash' } = input;
        if (!payAmount)
            throw new exceptions_1.BadRequestException('Payment amount is required');
        const newPaidAmount = bill.paidAmount + parseFloat(payAmount);
        let newStatus = 'PARTIAL';
        const totalPayable = bill.amount + bill.fine - bill.scholarshipDiscount;
        if (newPaidAmount >= totalPayable) {
            newStatus = 'PAID';
        }
        // Append to payment history
        const history = JSON.parse(bill.paymentHistory || '[]');
        history.push({
            date: new Date(),
            amount: parseFloat(payAmount),
            mode: paymentMode,
            receivedBy: userId,
        });
        const updated = await prisma_1.prisma.feeBill.update({
            where: { id },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus,
                paymentHistory: JSON.stringify(history),
            },
        });
        await this.logActivity(userId, 'UPDATE', 'FEES', `Recorded payment of $${payAmount} - Status: ${newStatus}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 7. LIBRARY
    // ==========================================
    async listLibraryBooks(params) {
        return this.repo.findLibraryBooks(params);
    }
    async getLibraryBook(id) {
        const book = await this.repo.findLibraryBookById(id);
        if (!book)
            throw new exceptions_1.NotFoundException('Book not found');
        return book;
    }
    async createLibraryBook(input, userId, ip, ua) {
        const { title, isbn, category, author, publisher, totalCopies, location } = input;
        if (!title || !isbn || !category || !author || !publisher) {
            throw new exceptions_1.BadRequestException('Title, ISBN, Category, Author, and Publisher are required');
        }
        const book = await this.repo.createLibraryBook({
            title,
            isbn,
            category,
            author,
            publisher,
            totalCopies: parseInt(totalCopies) || 1,
            availableCopies: parseInt(totalCopies) || 1,
            location,
        });
        await this.logActivity(userId, 'CREATE', 'LIBRARY', `Cataloged Book: ${title} (${isbn})`, ip, ua);
        return book;
    }
    async updateLibraryBook(id, input, userId, ip, ua) {
        const book = await this.getLibraryBook(id);
        const { title, isbn, category, author, publisher, totalCopies, location } = input;
        const data = {};
        if (title)
            data.title = title;
        if (isbn)
            data.isbn = isbn;
        if (category)
            data.category = category;
        if (author)
            data.author = author;
        if (publisher)
            data.publisher = publisher;
        if (totalCopies !== undefined) {
            data.totalCopies = parseInt(totalCopies);
            // Recalculate available copies based on issued delta
            const delta = parseInt(totalCopies) - book.totalCopies;
            data.availableCopies = Math.max(0, book.availableCopies + delta);
        }
        if (location !== undefined)
            data.location = location;
        const updated = await this.repo.updateLibraryBook(id, data);
        await this.logActivity(userId, 'UPDATE', 'LIBRARY', `Updated library catalog for ${book.title}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 8. TRANSPORT ROUTES
    // ==========================================
    async listTransportRoutes(params) {
        return this.repo.findTransportRoutes(params);
    }
    async getTransportRoute(id) {
        const route = await this.repo.findTransportRouteById(id);
        if (!route)
            throw new exceptions_1.NotFoundException('Route not found');
        return route;
    }
    async createTransportRoute(input, userId, ip, ua) {
        const { routeName, vehicleNo, driverName, driverPhone, monthlyFee, stops } = input;
        if (!routeName || !vehicleNo || !driverName || !driverPhone) {
            throw new exceptions_1.BadRequestException('Route Name, Vehicle details, and Driver details are required');
        }
        const route = await this.repo.createTransportRoute({
            routeName,
            vehicleNo,
            driverName,
            driverPhone,
            monthlyFee: parseFloat(monthlyFee) || 0.0,
            stops: stops || '[]',
        });
        await this.logActivity(userId, 'CREATE', 'TRANSPORT', `Mapped Transport Route: ${routeName}`, ip, ua);
        return route;
    }
    async updateTransportRoute(id, input, userId, ip, ua) {
        const route = await this.getTransportRoute(id);
        const { routeName, vehicleNo, driverName, driverPhone, monthlyFee, stops } = input;
        const data = {};
        if (routeName)
            data.routeName = routeName;
        if (vehicleNo)
            data.vehicleNo = vehicleNo;
        if (driverName)
            data.driverName = driverName;
        if (driverPhone)
            data.driverPhone = driverPhone;
        if (monthlyFee !== undefined)
            data.monthlyFee = parseFloat(monthlyFee);
        if (stops !== undefined)
            data.stops = stops;
        const updated = await this.repo.updateTransportRoute(id, data);
        await this.logActivity(userId, 'UPDATE', 'TRANSPORT', `Updated Route details for ${route.routeName}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 9. HOSTELS
    // ==========================================
    async listHostels(params) {
        return this.repo.findHostels(params);
    }
    async getHostel(id) {
        const hostel = await this.repo.findHostelById(id);
        if (!hostel)
            throw new exceptions_1.NotFoundException('Hostel building not found');
        return hostel;
    }
    async createHostel(input, userId, ip, ua) {
        const { name, type, description, rooms } = input;
        if (!name)
            throw new exceptions_1.BadRequestException('Hostel Name is required');
        const hostel = await this.repo.createHostel({
            name,
            type: type || 'BOYS',
            description,
            rooms: rooms || '[]',
        });
        await this.logActivity(userId, 'CREATE', 'HOSTEL', `Registered Hostel Building: ${name}`, ip, ua);
        return hostel;
    }
    async updateHostel(id, input, userId, ip, ua) {
        const hostel = await this.getHostel(id);
        const { name, type, description, rooms } = input;
        const data = {};
        if (name)
            data.name = name;
        if (type)
            data.type = type;
        if (description !== undefined)
            data.description = description;
        if (rooms !== undefined)
            data.rooms = rooms;
        const updated = await this.repo.updateHostel(id, data);
        await this.logActivity(userId, 'UPDATE', 'HOSTEL', `Updated building details for ${hostel.name}`, ip, ua);
        return updated;
    }
    // ==========================================
    // 10. TICKETS (Support ticket system)
    // ==========================================
    async listTickets(params) {
        const { user, ...rest } = params;
        if (!user)
            throw new exceptions_1.UnauthorizedException('Authentication is required to view complaints.');
        if (user.role === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
            if (!student)
                return { items: [], totalCount: 0 };
            return this.repo.findTickets({ ...rest, studentId: student.id });
        }
        if (user.role === 'Faculty' || user.role === 'Mentor') {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id, deleted: false }, select: { id: true } });
            return this.repo.findTickets({ ...rest, facultyId: faculty?.id || '__none__' });
        }
        if (user.role === 'HOD' || user.role === 'Head of Department') {
            const departments = await prisma_1.prisma.departmentMembership.findMany({ where: { userId: user.id }, select: { departmentId: true } });
            const departmentIds = Array.from(new Set([...(user.departmentId ? [user.departmentId] : []), ...departments.map((item) => item.departmentId)]));
            return this.repo.findTickets({ ...rest, scopeWhere: { OR: [{ student: { departmentId: { in: departmentIds } } }, { faculty: { departmentId: { in: departmentIds } } }] } });
        }
        const roleCategories = { 'Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Administration & Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'ADMINISTRATION_AND_ADMISSION_DEAN': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Academic Dean': ['ACADEMIC'], 'IQAC Dean': ['IQAC'] };
        if (roleCategories[user.role]) {
            let categories = roleCategories[user.role];
            if (['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'].includes(user.role)) {
                const policy = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT' }, select: { value: true } });
                if (!['true', 'enabled', '1', 'yes'].includes(String(policy?.value || '').toLowerCase()))
                    categories = categories.filter((category) => category !== 'HOSTEL');
            }
            return this.repo.findTickets({ ...rest, scopeWhere: { ...(rest.scopeWhere || {}), category: { in: categories } } });
        }
        if (!['Principal', 'Vice Principal', 'Super Admin', 'College Admin'].includes(user.role))
            throw new exceptions_1.UnauthorizedException('Your active workspace cannot access complaints.');
        return this.repo.findTickets(rest);
    }
    async getTicket(id, user) {
        const ticket = await this.repo.findTicketById(id);
        if (!ticket)
            throw new exceptions_1.NotFoundException('Support ticket not found');
        if (user) {
            if (user.role === 'Student') {
                const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (!student || ticket.studentId !== student.id) {
                    throw new exceptions_1.UnauthorizedException('You are not authorized to view this ticket.');
                }
            }
            else {
                const allowed = await this.listTickets({ user, pageSize: 100, scopeWhere: { id: ticket.id } });
                if (!allowed.items.some((item) => item.id === ticket.id))
                    throw new exceptions_1.UnauthorizedException('Your active workspace cannot view this complaint.');
            }
        }
        return ticket;
    }
    async createTicket(input, userId, activeRole, ip, ua) {
        const { title, description, category, priority } = input;
        if (!title || !description)
            throw new exceptions_1.BadRequestException('Title and ticket Description are required');
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user)
            throw new exceptions_1.NotFoundException('User session not found');
        const role = activeRole || user.role.name;
        let studentId = null;
        let facultyId = null;
        if (role === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId } });
            if (student)
                studentId = student.id;
        }
        else if (role === 'Faculty' || role === 'Mentor' || role === 'HOD') {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId, deleted: false } });
            if (faculty)
                facultyId = faculty.id;
        }
        const normalizedCategory = String(category || 'GENERAL').trim().toUpperCase();
        const normalizedPriority = String(priority || 'MEDIUM').trim().toUpperCase();
        if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].includes(normalizedPriority))
            throw new exceptions_1.BadRequestException('Invalid complaint priority');
        let assignedToUserId = null;
        if (['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'].includes(normalizedCategory)) {
            const admissionWorkspace = await prisma_1.prisma.userWorkspace.findFirst({ where: { status: 'ACTIVE', user: { status: 'ACTIVE' }, OR: [{ workspaceCode: { in: ['ADMISSION', 'ADMINISTRATION'] } }, { roleName: { in: ['Admission Dean', 'Administration & Admission Dean'] } }] }, orderBy: { isPrimary: 'desc' }, select: { userId: true } });
            assignedToUserId = admissionWorkspace?.userId || null;
        }
        const ticket = await prisma_1.prisma.ticket.create({
            data: {
                title,
                description,
                category: normalizedCategory,
                priority: normalizedPriority,
                studentId,
                facultyId,
                assignedToUserId,
                routedAt: assignedToUserId ? new Date() : null,
                status: 'OPEN',
            },
        });
        await this.logActivity(userId, 'CREATE', 'SUPPORT', `Created support ticket: ${title}`, ip, ua);
        if (assignedToUserId)
            await notification_service_1.NotificationService.sendNotification({ recipientId: assignedToUserId, eventType: 'HOSTEL_COMPLAINT_CREATED', title: 'New hostel complaint', message: title, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: `/complaints/${ticket.id}` });
        return ticket;
    }
    async updateTicket(id, input, userId, activeRole, ip, ua) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user)
            throw new exceptions_1.NotFoundException('User session not found');
        const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new exceptions_1.NotFoundException('Support ticket not found');
        const role = activeRole || user.role.name;
        if (role === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId }, select: { id: true } });
            if (!student || ticket.studentId !== student.id)
                throw new exceptions_1.UnauthorizedException('You are not authorized to update this complaint.');
            const { replies } = input;
            const data = {};
            if (replies !== undefined)
                data.replies = replies;
            const updated = await prisma_1.prisma.ticket.update({
                where: { id },
                data
            });
            await this.logActivity(userId, 'UPDATE', 'SUPPORT', `Student added reply for ticket #${ticket.id}`, ip, ua);
            return updated;
        }
        const categoriesByRole = { 'Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Administration & Admission Dean': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'ADMINISTRATION_AND_ADMISSION_DEAN': ['HOSTEL', 'ADMINISTRATION', 'ADMIN', 'STUDENT_SERVICE', 'DOCUMENT', 'ADMISSION'], 'Academic Dean': ['ACADEMIC'], 'IQAC Dean': ['IQAC'] };
        if (['Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN'].includes(role) && ticket.category === 'HOSTEL') {
            const policy = await prisma_1.prisma.systemSetting.findUnique({ where: { key: 'HOSTEL_ADMINISTRATION_DEAN_OVERSIGHT' }, select: { value: true } });
            if (!['true', 'enabled', '1', 'yes'].includes(String(policy?.value || '').toLowerCase()))
                throw new exceptions_1.UnauthorizedException('Hostel oversight is not assigned to this workspace by institution policy.');
        }
        if (categoriesByRole[role] && !categoriesByRole[role].includes(ticket.category))
            throw new exceptions_1.UnauthorizedException('Your active workspace cannot modify this complaint.');
        const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Administration & Admission Dean', 'ADMINISTRATION_AND_ADMISSION_DEAN', 'IQAC Dean', 'Principal', 'Vice Principal', 'Super Admin', 'College Admin'].includes(role);
        if (!isDeanOrAdmin) {
            throw new exceptions_1.UnauthorizedException('Only Deans and executive administrators can modify complaints.');
        }
        const { title, description, category, priority, status, replies, assignedToUserId, resolutionRemarks } = input;
        const data = {};
        if (title)
            data.title = title;
        if (description)
            data.description = description;
        if (category)
            data.category = category;
        if (priority)
            data.priority = priority;
        if (status) {
            const normalizedStatus = String(status).toUpperCase();
            if (!['OPEN', 'PENDING', 'IN_PROGRESS', 'UNDER_INVESTIGATION', 'ESCALATED', 'RESOLVED', 'CLOSED'].includes(normalizedStatus))
                throw new exceptions_1.BadRequestException('Invalid complaint status');
            data.status = normalizedStatus;
        }
        if (replies !== undefined)
            data.replies = replies;
        if (resolutionRemarks !== undefined)
            data.resolutionRemarks = String(resolutionRemarks).trim() || null;
        if (assignedToUserId !== undefined) {
            if (assignedToUserId) {
                const assignee = await prisma_1.prisma.user.findFirst({ where: { id: String(assignedToUserId), status: 'ACTIVE' }, select: { id: true } });
                if (!assignee)
                    throw new exceptions_1.BadRequestException('Complaint assignee is invalid or inactive');
            }
            data.assignedToUserId = assignedToUserId || null;
            data.routedAt = assignedToUserId ? new Date() : null;
        }
        const updated = await prisma_1.prisma.ticket.update({
            where: { id },
            data
        });
        await this.logActivity(userId, 'UPDATE', 'SUPPORT', `Dean/Executive updated ticket #${ticket.id} details`, ip, ua);
        if (status || assignedToUserId !== undefined) {
            const reporter = ticket.studentId
                ? await prisma_1.prisma.student.findUnique({ where: { id: ticket.studentId }, select: { userId: true } })
                : ticket.facultyId
                    ? await prisma_1.prisma.faculty.findUnique({ where: { id: ticket.facultyId }, select: { userId: true } })
                    : null;
            if (reporter?.userId)
                await notification_service_1.NotificationService.sendNotification({ recipientId: reporter.userId, eventType: 'COMPLAINT_UPDATED', title: 'Complaint updated', message: `Your complaint "${ticket.title}" is now ${data.status || ticket.status}.`, relatedEntityType: 'TICKET', relatedEntityId: ticket.id, deepLinkRoute: `/complaints/${ticket.id}` });
        }
        return updated;
    }
    // ==========================================
    // BULK SERVICES
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
    async bulkAssignMentor(ids, mentorId, userId, ip, ua) {
        if (!mentorId)
            throw new exceptions_1.BadRequestException('Mentor ID is required');
        const mentor = await prisma_1.prisma.faculty.findUnique({ where: { id: mentorId } });
        if (!mentor)
            throw new exceptions_1.NotFoundException('Mentor not found');
        for (const studentId of ids) {
            const student = await prisma_1.prisma.student.findUnique({ where: { id: studentId } });
            if (!student)
                continue;
            // 1. Mark existing active mentor assignments as HISTORIC
            await prisma_1.prisma.mentorAssignment.updateMany({
                where: { studentId, status: 'ACTIVE' },
                data: { status: 'HISTORIC' }
            });
            // 2. Update Student model
            await prisma_1.prisma.student.update({
                where: { id: studentId },
                data: { mentorId }
            });
            // 3. Log Mentor Assignment History
            await prisma_1.prisma.mentorAssignment.create({
                data: {
                    mentorId,
                    studentId,
                    departmentId: student.departmentId,
                    programId: student.programId,
                    semesterId: student.semesterId,
                    sectionId: student.sectionId,
                    academicYearId: student.academicYearId,
                    assignedBy: userId,
                    status: 'ACTIVE'
                }
            });
            // 4. Notify Student
            try {
                await prisma_1.prisma.systemNotification.create({
                    data: {
                        title: 'Mentor Assigned',
                        content: `You have been assigned to Mentor ${mentor.firstName} ${mentor.lastName}.`,
                        type: 'ANNOUNCEMENT',
                        status: 'SENT'
                    }
                });
            }
            catch (err) {
                console.error('Failed to notify student', err);
            }
            // 5. Audit Log Entry
            await prisma_1.prisma.securityAuditLog.create({
                data: {
                    action: 'MENTOR_ASSIGNMENT',
                    module: 'STUDENTS',
                    description: `Assigned student ${student.firstName} ${student.lastName} (${student.admissionNo}) to Mentor ${mentor.firstName} ${mentor.lastName}`,
                    userId,
                    ipAddress: ip || null,
                    userAgent: ua || null
                }
            });
        }
        // 6. Notify Mentor
        try {
            await prisma_1.prisma.systemNotification.create({
                data: {
                    title: 'Students Assigned',
                    content: `You have been assigned ${ids.length} new student(s).`,
                    type: 'ANNOUNCEMENT',
                    status: 'SENT'
                }
            });
        }
        catch (err) {
            console.error('Failed to notify mentor', err);
        }
    }
    async bulkAssignDepartment(ids, departmentId, userId, ip, ua) {
        if (!departmentId)
            throw new exceptions_1.BadRequestException('Department ID is required');
        await prisma_1.prisma.student.updateMany({
            where: { id: { in: ids } },
            data: { departmentId }
        });
        await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Bulk assigned department to ${ids.length} students`, ip, ua);
    }
    async bulkAssignSection(ids, sectionId, userId, ip, ua) {
        if (!sectionId)
            throw new exceptions_1.BadRequestException('Section ID is required');
        await prisma_1.prisma.student.updateMany({
            where: { id: { in: ids } },
            data: { sectionId }
        });
        await this.logActivity(userId, 'UPDATE', 'STUDENTS', `Bulk assigned section to ${ids.length} students`, ip, ua);
    }
    // ==========================================
    // HELPERS
    // ==========================================
    getPrismaModelName(moduleKey) {
        switch (moduleKey) {
            case 'students': return 'student';
            case 'faculty': return 'faculty';
            case 'attendance': return 'attendance';
            case 'exams': return 'exam';
            case 'marks': return 'mark';
            case 'fee-categories': return 'feeCategory';
            case 'fee-bills': return 'feeBill';
            case 'library': return 'libraryBook';
            case 'transport': return 'transportRoute';
            case 'hostel': return 'hostelBuilding';
            case 'tickets': return 'ticket';
            default: throw new Error(`Invalid enterprise module key: ${moduleKey}`);
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
    async listCounselingRecords(user) {
        const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
        if (!faculty) {
            return prisma_1.prisma.counselingRecord.findMany({
                include: { student: true, mentor: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        return prisma_1.prisma.counselingRecord.findMany({
            where: { mentorId: faculty.id },
            include: { student: true, mentor: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createCounselingRecord(user, body) {
        const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
        const { studentId, notes, actionTaken } = body;
        if (!studentId || !notes) {
            throw new exceptions_1.BadRequestException('Student and counseling notes are required');
        }
        return prisma_1.prisma.counselingRecord.create({
            data: {
                studentId,
                mentorId: faculty ? faculty.id : (body.mentorId || 'SYSTEM'),
                notes,
                actionTaken: actionTaken || 'In Progress',
            },
            include: { student: true, mentor: true }
        });
    }
    // ==========================================
    // ENTERPRISE GLOBAL SEARCH WITH RBAC
    // ==========================================
    async globalSearch(query, user) {
        if (!query || query.trim().length < 2)
            return [];
        const q = query.trim();
        const results = [];
        const role = user.role;
        // 1. Check Search Permissions
        const canSearchEveryone = [
            'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
            'Academic Dean', 'Admission Dean', 'IQAC Dean'
        ].includes(role);
        // 2. Fetch User / Student / Faculty boundaries
        if (canSearchEveryone) {
            const [students, faculty, depts, circulars, sports] = await Promise.all([
                prisma_1.prisma.student.findMany({
                    where: {
                        OR: [
                            { firstName: { contains: q } },
                            { lastName: { contains: q } },
                            { admissionNo: { contains: q } },
                            { email: { contains: q } },
                            { phone: { contains: q } }
                        ]
                    },
                    take: 10
                }),
                prisma_1.prisma.faculty.findMany({
                    where: {
                        OR: [
                            { firstName: { contains: q } },
                            { lastName: { contains: q } },
                            { employeeId: { contains: q } },
                            { email: { contains: q } }
                        ]
                    },
                    take: 10
                }),
                prisma_1.prisma.department.findMany({
                    where: {
                        OR: [{ name: { contains: q } }, { code: { contains: q } }]
                    },
                    take: 5
                }),
                prisma_1.prisma.hodCircular.findMany({
                    where: { title: { contains: q } },
                    take: 5
                }),
                prisma_1.prisma.sportsTournament.findMany({
                    where: { title: { contains: q } },
                    take: 5
                })
            ]);
            students.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Student (${s.admissionNo})`, link: `/students?id=${s.id}` }));
            faculty.forEach(f => results.push({ id: f.id, type: 'FACULTY', title: `${f.firstName} ${f.lastName}`, subtitle: `Faculty (${f.employeeId || 'EMP'})`, link: `/faculty?id=${f.id}` }));
            depts.forEach(d => results.push({ id: d.id, type: 'DEPARTMENT', title: d.name, subtitle: `Dept Code: ${d.code}`, link: `/academics?dept=${d.id}` }));
            circulars.forEach(c => results.push({ id: c.id, type: 'CIRCULAR', title: c.title, subtitle: 'Circular', link: `/circulars` }));
            sports.forEach((sp) => results.push({ id: sp.id, type: 'SPORTS', title: sp.title, subtitle: 'Sports Event', link: `/sports` }));
        }
        else if (role === 'HOD') {
            const facultyUser = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            const deptId = facultyUser?.departmentId;
            if (deptId) {
                const [students, faculty] = await Promise.all([
                    prisma_1.prisma.student.findMany({
                        where: {
                            departmentId: deptId,
                            OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { admissionNo: { contains: q } }]
                        },
                        take: 10
                    }),
                    prisma_1.prisma.faculty.findMany({
                        where: {
                            departmentId: deptId,
                            OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { employeeId: { contains: q } }]
                        },
                        take: 10
                    })
                ]);
                students.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Dept Student (${s.admissionNo})`, link: `/students?id=${s.id}` }));
                faculty.forEach(f => results.push({ id: f.id, type: 'FACULTY', title: `${f.firstName} ${f.lastName}`, subtitle: `Dept Faculty (${f.employeeId || 'EMP'})`, link: `/faculty?id=${f.id}` }));
            }
        }
        else if (role === 'Faculty' || role === 'Mentor') {
            const facultyUser = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (facultyUser) {
                const mentees = await prisma_1.prisma.student.findMany({
                    where: {
                        OR: [{ mentorId: facultyUser.id }, { facultyId: facultyUser.id }],
                        AND: [{ OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }, { admissionNo: { contains: q } }] }]
                    },
                    take: 10
                });
                mentees.forEach(s => results.push({ id: s.id, type: 'STUDENT', title: `${s.firstName} ${s.lastName}`, subtitle: `Assigned Mentee (${s.admissionNo})`, link: `/students?id=${s.id}` }));
            }
        }
        else if (role === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
            if (student && (`${student.firstName} ${student.lastName}`.toLowerCase().includes(q.toLowerCase()) || student.admissionNo.toLowerCase().includes(q.toLowerCase()))) {
                results.push({ id: student.id, type: 'STUDENT', title: `${student.firstName} ${student.lastName}`, subtitle: `My Profile (${student.admissionNo})`, link: `/profile` });
            }
        }
        else if (role === 'Parent') {
            const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email } });
            children.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q.toLowerCase()) || c.admissionNo.toLowerCase().includes(q.toLowerCase()))
                .forEach(c => results.push({ id: c.id, type: 'STUDENT', title: `${c.firstName} ${c.lastName}`, subtitle: `Child Profile (${c.admissionNo})`, link: `/student-portal` }));
        }
        return results;
    }
}
exports.EnterpriseService = EnterpriseService;
//# sourceMappingURL=enterprise.service.js.map