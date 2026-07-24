"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseService = void 0;
const enterprise_repository_1 = require("./enterprise.repository");
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class EnterpriseService {
    repo = new enterprise_repository_1.EnterpriseRepository();
    // ==========================================
    // 1. STUDENTS
    // ==========================================
    async listStudents(params, user) {
        return this.repo.findStudents(params, user);
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
    async recordMark(input, userId, ip, ua) {
        const { internalMarks, externalMarks, practicalMarks, examId, studentId, subjectId, status } = input;
        if (!examId || !studentId || !subjectId)
            throw new exceptions_1.BadRequestException('Exam, Student, and Subject mappings are required');
        // Simple Grade / GPA calculation
        const total = (parseInt(internalMarks) || 0) + (parseInt(externalMarks) || 0) + (parseInt(practicalMarks) || 0);
        let grade = 'F';
        let gpa = 0.0;
        if (total >= 90) {
            grade = 'S';
            gpa = 10.0;
        }
        else if (total >= 80) {
            grade = 'A';
            gpa = 9.0;
        }
        else if (total >= 70) {
            grade = 'B';
            gpa = 8.0;
        }
        else if (total >= 60) {
            grade = 'C';
            gpa = 7.0;
        }
        else if (total >= 50) {
            grade = 'D';
            gpa = 6.0;
        }
        else if (total >= 40) {
            grade = 'E';
            gpa = 5.0;
        }
        const mark = await prisma_1.prisma.mark.upsert({
            where: { examId_studentId_subjectId: { examId, studentId, subjectId } },
            update: {
                internalMarks: parseInt(internalMarks) || 0,
                externalMarks: parseInt(externalMarks) || 0,
                practicalMarks: parseInt(practicalMarks) || 0,
                grade,
                gpa,
                cgpa: gpa,
                status: status || 'DRAFT',
            },
            create: {
                internalMarks: parseInt(internalMarks) || 0,
                externalMarks: parseInt(externalMarks) || 0,
                practicalMarks: parseInt(practicalMarks) || 0,
                grade,
                gpa,
                cgpa: gpa,
                status: status || 'DRAFT',
                examId,
                studentId,
                subjectId,
            },
        });
        await this.logActivity(userId, 'CREATE', 'MARKS', `Entered student exam marks - Total: ${total} (Grade: ${grade})`, ip, ua);
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
        if (!user) {
            return this.repo.findTickets(rest);
        }
        if (user.role === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
            if (!student)
                return { items: [], totalCount: 0 };
            return this.repo.findTickets({ ...rest, studentId: student.id });
        }
        const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Principal', 'Vice Principal', 'Super Admin'].includes(user.role);
        if (!isDeanOrAdmin) {
            throw new exceptions_1.UnauthorizedException('Only Deans and executive administrators can access complaints.');
        }
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
                const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Principal', 'Vice Principal', 'Super Admin'].includes(user.role);
                if (!isDeanOrAdmin) {
                    throw new exceptions_1.UnauthorizedException('Only Deans and executive administrators can access complaints.');
                }
            }
        }
        return ticket;
    }
    async createTicket(input, userId, ip, ua) {
        const { title, description, category, priority } = input;
        if (!title || !description)
            throw new exceptions_1.BadRequestException('Title and ticket Description are required');
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user)
            throw new exceptions_1.NotFoundException('User session not found');
        let studentId = null;
        if (user.role.name === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { userId } });
            if (student)
                studentId = student.id;
        }
        const ticket = await prisma_1.prisma.ticket.create({
            data: {
                title,
                description,
                category: category || 'GENERAL',
                priority: priority || 'MEDIUM',
                studentId,
                status: 'OPEN',
            },
        });
        await this.logActivity(userId, 'CREATE', 'SUPPORT', `Created support ticket: ${title}`, ip, ua);
        return ticket;
    }
    async updateTicket(id, input, userId, ip, ua) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
        if (!user)
            throw new exceptions_1.NotFoundException('User session not found');
        const ticket = await prisma_1.prisma.ticket.findUnique({ where: { id } });
        if (!ticket)
            throw new exceptions_1.NotFoundException('Support ticket not found');
        if (user.role.name === 'Student') {
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
        const isDeanOrAdmin = ['Academic Dean', 'Admission Dean', 'Principal', 'Vice Principal', 'Super Admin'].includes(user.role.name);
        if (!isDeanOrAdmin) {
            throw new exceptions_1.UnauthorizedException('Only Deans and executive administrators can modify complaints.');
        }
        const { title, description, category, priority, status, replies } = input;
        const data = {};
        if (title)
            data.title = title;
        if (description)
            data.description = description;
        if (category)
            data.category = category;
        if (priority)
            data.priority = priority;
        if (status)
            data.status = status;
        if (replies !== undefined)
            data.replies = replies;
        const updated = await prisma_1.prisma.ticket.update({
            where: { id },
            data
        });
        await this.logActivity(userId, 'UPDATE', 'SUPPORT', `Dean/Executive updated ticket #${ticket.id} details`, ip, ua);
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
}
exports.EnterpriseService = EnterpriseService;
//# sourceMappingURL=enterprise.service.js.map