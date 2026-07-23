"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnterpriseController = void 0;
const enterprise_service_1 = require("./enterprise.service");
const security_1 = require("../../utils/security");
const prisma_1 = require("../../lib/prisma");
const idcard_pdf_1 = require("../../utils/idcard.pdf");
const attendance_pdf_1 = require("../../utils/attendance.pdf");
class EnterpriseController {
    service = new enterprise_service_1.EnterpriseService();
    // ==========================================
    // STUDENTS
    // ==========================================
    listStudents = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listStudents(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getStudent = async (req, res, next) => {
        try {
            const data = await this.service.getStudent(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    downloadIdCardPdf = async (req, res, next) => {
        try {
            const user = req.user;
            const studentId = req.params.id;
            // 1. Authenticated User & Role verification
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required.'
                });
            }
            // 2. Student & Parent Ownership Verification (Zero Trust)
            if (user.role === 'Student') {
                const studentRecord = await security_1.SecurityHelper.getStudentRecord(user.id);
                if (!studentRecord || studentRecord.id !== studentId) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Access denied: Students can only download their own ID card.'
                    });
                }
            }
            else if (user.role === 'Parent') {
                const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email } });
                if (!children.find(c => c.id === studentId)) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Access denied: Parents can only download their child\'s ID card.'
                    });
                }
            }
            else if (!['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD', 'Faculty'].includes(user.role)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied: Unauthorized role for downloading student credentials.'
                });
            }
            // 3. Fetch Full Student Data with relations
            const student = await this.service.getStudent(studentId);
            if (!student) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Student profile not found.'
                });
            }
            // 4. Fetch System Settings for College Info
            const dbSettings = await prisma_1.prisma.systemSetting.findMany();
            const settings = {};
            dbSettings.forEach((item) => {
                settings[item.key] = item.value;
            });
            // 5. Derive Register Number, Roll Number, and Validity Suffix
            const year = student.dateOfAdmission ? new Date(student.dateOfAdmission).getFullYear() : 2026;
            const yearSuffix = String(year).slice(-2);
            const deptCode = student.department?.code || 'CSE';
            const seq = student.admissionNo.replace(/^\D+/g, '') || '001';
            const sequence = seq.slice(-3);
            const registerNo = `${yearSuffix}${deptCode}${sequence}`;
            const rollNo = `${yearSuffix}${deptCode}${sequence}`;
            const duration = student.program?.duration || 4;
            const validUntil = `${year} - ${year + duration}`;
            // 6. Generate the high-resolution PDF
            const doc = await (0, idcard_pdf_1.buildStudentIDCardPDF)({
                student,
                settings,
                registerNo,
                rollNo,
                validUntil
            });
            // 7. Write to Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: user.id,
                    action: 'DOWNLOAD',
                    module: 'STUDENTS',
                    description: `Downloaded student ID card PDF for: ${student.firstName} ${student.lastName} (${student.admissionNo})`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            // 8. Stream PDF to response
            const filename = `${student.firstName}_${registerNo}_IDCard.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);
            doc.end();
        }
        catch (error) {
            next(error);
        }
    };
    downloadAttendancePdf = async (req, res, next) => {
        try {
            const user = req.user;
            const studentId = req.params.id;
            if (!user) {
                return res.status(401).json({ status: 'error', message: 'Authentication required.' });
            }
            // Student/Parent Ownership Check (Zero Trust)
            if (user.role === 'Student') {
                const studentRecord = await security_1.SecurityHelper.getStudentRecord(user.id);
                if (!studentRecord || studentRecord.id !== studentId) {
                    return res.status(403).json({ status: 'error', message: 'Access denied: Students can only download their own attendance report.' });
                }
            }
            else if (user.role === 'Parent') {
                const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email } });
                if (!children.find(c => c.id === studentId)) {
                    return res.status(403).json({ status: 'error', message: "Access denied: Parents can only download their child's attendance report." });
                }
            }
            else if (!['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD', 'Faculty'].includes(user.role)) {
                return res.status(403).json({ status: 'error', message: 'Access denied: Unauthorized role for downloading attendance reports.' });
            }
            // Fetch student details
            const student = await this.service.getStudent(studentId);
            if (!student) {
                return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
            }
            // Fetch attendance records from database
            const attendanceRecords = await prisma_1.prisma.attendance.findMany({
                where: { studentId, deleted: false },
                include: { subject: true, faculty: true },
                orderBy: { date: 'asc' }
            });
            // System settings
            const dbSettings = await prisma_1.prisma.systemSetting.findMany();
            const settings = {};
            dbSettings.forEach(item => {
                settings[item.key] = item.value;
            });
            // Register / Roll numbers
            const year = student.dateOfAdmission ? new Date(student.dateOfAdmission).getFullYear() : 2026;
            const yearSuffix = String(year).slice(-2);
            const deptCode = student.department?.code || 'CSE';
            const seq = student.admissionNo.replace(/^\D+/g, '') || '001';
            const sequence = seq.slice(-3);
            const registerNo = `${yearSuffix}${deptCode}${sequence}`;
            const rollNo = `${yearSuffix}${deptCode}${sequence}`;
            // Generate the A4 PDF
            const pdfBuffer = await (0, attendance_pdf_1.generateAttendanceReportPdf)({
                student,
                attendanceRecords,
                settings,
                registerNo,
                rollNo
            });
            // Write to Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: user.id,
                    action: 'DOWNLOAD',
                    module: 'STUDENTS',
                    description: `Downloaded attendance report PDF for: ${student.firstName} ${student.lastName} (${student.admissionNo})`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            // Send response
            const filename = `${student.firstName}_${registerNo}_Attendance_Report.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.status(200).send(pdfBuffer);
        }
        catch (error) {
            next(error);
        }
    };
    createStudent = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createStudent(req.body, user.id, req.ip, req.headers['user-agent']);
            await (0, security_1.auditRequest)(req, 'CREATE', 'STUDENTS', `Admitted Student: ${data.firstName} ${data.lastName} (${data.admissionNo})`, data.id, 'Student');
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateStudent = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateStudent(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            await (0, security_1.auditRequest)(req, 'UPDATE', 'STUDENTS', `Updated Student profile for: ${data.firstName} ${data.lastName}`, data.id, 'Student');
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteStudent = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('students', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            await (0, security_1.auditRequest)(req, 'DELETE', 'STUDENTS', `Deleted Student profile with ID: ${req.params.id}`, req.params.id, 'Student');
            res.status(200).json({ status: 'success', message: 'Student profile deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // FACULTY
    // ==========================================
    listFaculties = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listFaculties(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getFaculty = async (req, res, next) => {
        try {
            const data = await this.service.getFaculty(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createFaculty = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createFaculty(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateFaculty = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateFaculty(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteFaculty = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('faculty', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Faculty profile deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // ATTENDANCE
    // ==========================================
    listAttendances = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listAttendances(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    recordAttendance = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.recordAttendance(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    recordBulkAttendance = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.recordBulkAttendance(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // EXAMS
    // ==========================================
    listExams = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listExams(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getExam = async (req, res, next) => {
        try {
            const data = await this.service.getExam(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createExam = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createExam(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateExam = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateExam(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteExam = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('exams', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Exam deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // MARKS
    // ==========================================
    listMarks = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listMarks(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    recordMark = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.recordMark(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // FEES
    // ==========================================
    listFeeCategories = async (req, res, next) => {
        try {
            const result = await this.service.listFeeCategories(req.query);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    createFeeCategory = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createFeeCategory(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    listFeeBills = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listFeeBills(req.query, user);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    createFeeBill = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createFeeBill(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    recordPayment = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.recordPayment(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // LIBRARY
    // ==========================================
    listLibraryBooks = async (req, res, next) => {
        try {
            const result = await this.service.listLibraryBooks(req.query);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getLibraryBook = async (req, res, next) => {
        try {
            const data = await this.service.getLibraryBook(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createLibraryBook = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createLibraryBook(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateLibraryBook = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateLibraryBook(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteLibraryBook = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('library', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Book deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // TRANSPORT
    // ==========================================
    listTransportRoutes = async (req, res, next) => {
        try {
            const result = await this.service.listTransportRoutes(req.query);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getTransportRoute = async (req, res, next) => {
        try {
            const data = await this.service.getTransportRoute(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createTransportRoute = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createTransportRoute(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateTransportRoute = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateTransportRoute(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteTransportRoute = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('transport', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Transport Route deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // HOSTEL
    // ==========================================
    listHostels = async (req, res, next) => {
        try {
            const result = await this.service.listHostels(req.query);
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getHostel = async (req, res, next) => {
        try {
            const data = await this.service.getHostel(req.params.id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createHostel = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createHostel(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateHostel = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateHostel(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteHostel = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('hostel', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Hostel Building deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // TICKETS
    // ==========================================
    listTickets = async (req, res, next) => {
        try {
            const user = req.user;
            const result = await this.service.listTickets({ ...req.query, user });
            res.status(200).json({ status: 'success', data: result.items, totalCount: result.totalCount });
        }
        catch (error) {
            next(error);
        }
    };
    getTicket = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.getTicket(req.params.id, user);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createTicket = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.createTicket(req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    updateTicket = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.service.updateTicket(req.params.id, req.body, user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteTicket = async (req, res, next) => {
        try {
            const user = req.user;
            await this.service.bulkDelete('tickets', [req.params.id], user.id, req.ip, req.headers['user-agent']);
            res.status(200).json({ status: 'success', message: 'Support Ticket deleted' });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // BULK ACTIONS
    // ==========================================
    bulkAction = async (req, res, next) => {
        try {
            const { moduleKey, action, ids } = req.body;
            const user = req.user;
            if (action === 'delete') {
                await this.service.bulkDelete(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
            }
            else if (action === 'archive') {
                await this.service.bulkArchive(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
            }
            else if (action === 'restore') {
                await this.service.bulkRestore(moduleKey, ids, user.id, req.ip, req.headers['user-agent']);
            }
            else if (action === 'assign-mentor') {
                const { mentorId } = req.body;
                await this.service.bulkAssignMentor(ids, mentorId, user.id, req.ip, req.headers['user-agent']);
            }
            res.status(200).json({ status: 'success', message: `Bulk ${action} executed` });
        }
        catch (error) {
            next(error);
        }
    };
    // ==========================================
    // INTERNSHIPS & DOCUMENTS
    // ==========================================
    listInternships = async (req, res, next) => {
        try {
            const user = req.user;
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
            if (!student) {
                return res.status(403).json({ status: 'error', message: 'Only students can access internships.' });
            }
            const list = await prisma_1.prisma.internship.findMany({
                where: { studentId: student.id },
                include: { documents: true },
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json({ status: 'success', data: list });
        }
        catch (error) {
            next(error);
        }
    };
    createInternship = async (req, res, next) => {
        try {
            const { company, duration, credits } = req.body;
            const user = req.user;
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
            if (!student) {
                return res.status(403).json({ status: 'error', message: 'Only students can file internship requests.' });
            }
            const record = await prisma_1.prisma.internship.create({
                data: {
                    company,
                    duration,
                    credits: parseInt(credits) || 2,
                    studentId: student.id,
                    status: 'PENDING'
                }
            });
            res.status(201).json({ status: 'success', data: record });
        }
        catch (error) {
            next(error);
        }
    };
    uploadInternshipDocument = async (req, res, next) => {
        try {
            const { id: internshipId } = req.params;
            const { documentType, fileName, fileUrl, fileSize, fileType } = req.body;
            const user = req.user;
            const student = await prisma_1.prisma.student.findFirst({ where: { userId: user.id, deleted: false } });
            if (!student) {
                return res.status(403).json({ status: 'error', message: 'Only students can upload documents.' });
            }
            const internship = await prisma_1.prisma.internship.findUnique({ where: { id: internshipId } });
            if (!internship) {
                return res.status(404).json({ status: 'error', message: 'Internship record not found.' });
            }
            // Security check: ensure student owns this internship record
            if (internship.studentId !== student.id) {
                return res.status(403).json({ status: 'error', message: 'You do not own this internship record.' });
            }
            const doc = await prisma_1.prisma.internshipDocument.create({
                data: {
                    documentType,
                    fileName,
                    fileUrl,
                    fileSize: parseInt(fileSize) || 0,
                    fileType,
                    uploadedBy: `${student.firstName} ${student.lastName}`,
                    internshipId,
                    studentId: student.id,
                    verificationStatus: 'PENDING'
                }
            });
            res.status(201).json({ status: 'success', data: doc });
        }
        catch (error) {
            next(error);
        }
    };
    listAllInternshipDocuments = async (req, res, next) => {
        try {
            const user = req.user;
            // Placement Officer, HOD, Mentor, Authorized Faculty, Dean access
            const allowedRoles = ['Super Admin', 'Principal', 'Vice Principal', 'HOD', 'Faculty', 'Academic Dean'];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ status: 'error', message: 'Access denied: Placement Cell or authorized faculty only.' });
            }
            // If Faculty, filter by department or mentor
            const where = {};
            if (user.role === 'Faculty' || user.role === 'HOD') {
                const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id, deleted: false } });
                if (faculty) {
                    where.student = { departmentId: faculty.departmentId };
                }
            }
            const docs = await prisma_1.prisma.internshipDocument.findMany({
                where,
                include: {
                    student: { select: { firstName: true, lastName: true, admissionNo: true } },
                    internship: true
                },
                orderBy: { uploadedAt: 'desc' }
            });
            res.status(200).json({ status: 'success', data: docs });
        }
        catch (error) {
            next(error);
        }
    };
    verifyInternshipDocument = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body; // VERIFIED, REJECTED
            const user = req.user;
            const allowedRoles = ['Super Admin', 'Principal', 'Vice Principal', 'HOD', 'Faculty', 'Academic Dean'];
            if (!allowedRoles.includes(user.role)) {
                return res.status(403).json({ status: 'error', message: 'Access denied.' });
            }
            const doc = await prisma_1.prisma.internshipDocument.update({
                where: { id },
                data: { verificationStatus: status }
            });
            res.status(200).json({ status: 'success', data: doc });
        }
        catch (error) {
            next(error);
        }
    };
    assignStudentsToMentor = async (req, res, next) => {
        try {
            const user = req.user;
            const { studentIds } = req.body;
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                return res.status(400).json({ status: 'error', message: 'studentIds array is required' });
            }
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (!faculty) {
                return res.status(403).json({ status: 'error', message: 'Faculty profile not found' });
            }
            const assignedStudents = [];
            for (const studentId of studentIds) {
                const student = await prisma_1.prisma.student.findUnique({
                    where: { id: studentId },
                    include: { mentor: true }
                });
                if (!student || student.deleted)
                    continue;
                if (student.departmentId !== faculty.departmentId) {
                    continue;
                }
                if (student.status !== 'ACTIVE') {
                    continue;
                }
                const isReassignment = !!student.mentorId && student.mentorId !== faculty.id;
                await prisma_1.prisma.mentorAssignment.updateMany({
                    where: { studentId, status: 'ACTIVE' },
                    data: { status: 'HISTORIC' }
                });
                await prisma_1.prisma.student.update({
                    where: { id: studentId },
                    data: { mentorId: faculty.id }
                });
                await prisma_1.prisma.mentorAssignment.create({
                    data: {
                        mentorId: faculty.id,
                        studentId,
                        departmentId: student.departmentId,
                        programId: student.programId,
                        semesterId: student.semesterId,
                        sectionId: student.sectionId,
                        academicYearId: student.academicYearId,
                        assignedBy: user.id,
                        status: 'ACTIVE'
                    }
                });
                await prisma_1.prisma.systemNotification.create({
                    data: {
                        title: isReassignment ? 'Mentor Changed' : 'Mentor Assigned',
                        content: `You have been assigned to Mentor ${faculty.firstName} ${faculty.lastName}.`,
                        type: 'ANNOUNCEMENT',
                        status: 'SENT'
                    }
                });
                await prisma_1.prisma.securityAuditLog.create({
                    data: {
                        action: isReassignment ? 'MENTOR_CHANGED' : 'MENTOR_ASSIGNMENT',
                        module: 'STUDENTS',
                        description: `${isReassignment ? 'Reassigned' : 'Assigned'} student ${student.firstName} ${student.lastName} to Mentor ${faculty.firstName} ${faculty.lastName}`,
                        userId: user.id,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent']
                    }
                });
                assignedStudents.push(`${student.firstName} ${student.lastName}`);
            }
            if (assignedStudents.length > 0) {
                await prisma_1.prisma.systemNotification.create({
                    data: {
                        title: 'Student Assigned',
                        content: `Successfully assigned ${assignedStudents.length} student(s) to your mentorship.`,
                        type: 'ANNOUNCEMENT',
                        status: 'SENT'
                    }
                });
            }
            res.status(200).json({
                status: 'success',
                message: 'Students assigned successfully.',
                data: assignedStudents
            });
        }
        catch (error) {
            next(error);
        }
    };
    removeStudentFromMentor = async (req, res, next) => {
        try {
            const user = req.user;
            const { studentId } = req.body;
            if (!studentId) {
                return res.status(400).json({ status: 'error', message: 'studentId is required' });
            }
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (!faculty) {
                return res.status(403).json({ status: 'error', message: 'Faculty profile not found' });
            }
            const student = await prisma_1.prisma.student.findUnique({ where: { id: studentId } });
            if (!student || student.deleted) {
                return res.status(404).json({ status: 'error', message: 'Student not found' });
            }
            if (student.mentorId !== faculty.id) {
                return res.status(400).json({ status: 'error', message: 'Student is not assigned to you' });
            }
            await prisma_1.prisma.student.update({
                where: { id: studentId },
                data: { mentorId: null }
            });
            await prisma_1.prisma.mentorAssignment.updateMany({
                where: { studentId, mentorId: faculty.id, status: 'ACTIVE' },
                data: { status: 'HISTORIC' }
            });
            await prisma_1.prisma.systemNotification.create({
                data: {
                    title: 'Mentor Removed',
                    content: `Your assignment to Mentor ${faculty.firstName} ${faculty.lastName} has been removed.`,
                    type: 'ANNOUNCEMENT',
                    status: 'SENT'
                }
            });
            await prisma_1.prisma.systemNotification.create({
                data: {
                    title: 'Student Removed',
                    content: `Removed student ${student.firstName} ${student.lastName} from your mentorship.`,
                    type: 'ANNOUNCEMENT',
                    status: 'SENT'
                }
            });
            await prisma_1.prisma.securityAuditLog.create({
                data: {
                    action: 'MENTOR_REMOVED',
                    module: 'STUDENTS',
                    description: `Removed student ${student.firstName} ${student.lastName} from Mentor ${faculty.firstName} ${faculty.lastName} workspace`,
                    userId: user.id,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            res.status(200).json({
                status: 'success',
                message: 'Mentorship assignment removed successfully.'
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.EnterpriseController = EnterpriseController;
//# sourceMappingURL=enterprise.controller.js.map