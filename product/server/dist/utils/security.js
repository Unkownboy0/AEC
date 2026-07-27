"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHelper = void 0;
exports.auditLog = auditLog;
exports.auditRequest = auditRequest;
const prisma_1 = require("../lib/prisma");
const exceptions_1 = require("./exceptions");
async function auditLog(params) {
    try {
        await prisma_1.prisma.securityAuditLog.create({ data: params });
    }
    catch (_) {
        // Audit failures must never block the request
    }
}
async function auditRequest(req, action, module, description, targetId, targetType, statusCode = 200) {
    const user = req.user;
    await auditLog({
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.role,
        action,
        module,
        targetId,
        targetType,
        description,
        statusCode,
        ipAddress: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent'],
    });
}
// ============================================================
// SECURITY CONTEXT HELPER
// ============================================================
class SecurityHelper {
    /**
     * Resolve faculty record matching userId (cached-style per request)
     */
    static async getFacultyRecord(userId) {
        return prisma_1.prisma.faculty.findFirst({ where: { userId } });
    }
    /**
     * Resolve student record matching userId
     */
    static async getStudentRecord(userId) {
        return prisma_1.prisma.student.findFirst({ where: { userId } });
    }
    /**
     * Deny access and emit audit log
     */
    static async deny(req, module, reason) {
        const user = req.user;
        await auditLog({
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            action: 'DENIED',
            module,
            description: reason,
            statusCode: 403,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
        });
        throw new exceptions_1.ForbiddenException(reason);
    }
    /**
     * Verify HOD scope: HOD can only write to their own department
     */
    static async verifyWriteAccess(req, targetDepartmentId) {
        const user = req.user;
        if (!user)
            throw new exceptions_1.ForbiddenException('Authentication required');
        if (user.role === 'Super Admin' || user.role === 'Principal' || user.role === 'Vice Principal' || user.role === 'Academic Dean')
            return;
        if (user.role === 'HOD') {
            const faculty = await this.getFacultyRecord(user.id);
            if (!faculty || faculty.departmentId !== targetDepartmentId) {
                await this.deny(req, 'DEPARTMENT', `HOD access denied: target department (${targetDepartmentId}) is not your assigned department`);
            }
            return;
        }
        await this.deny(req, 'DEPARTMENT', 'Write access to department data is not permitted for your role');
    }
    /**
     * Verify faculty can only write marks/attendance for subjects they are assigned to
     */
    static async verifyFacultySubjectAccess(req, subjectId, sectionId) {
        const user = req.user;
        if (!user)
            throw new exceptions_1.ForbiddenException('Authentication required');
        if (['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD'].includes(user.role))
            return;
        if (user.role === 'Faculty') {
            const faculty = await this.getFacultyRecord(user.id);
            if (!faculty)
                await this.deny(req, 'FACULTY', 'Faculty profile not found');
            // Check via SubjectAssignment
            const assignment = await prisma_1.prisma.subjectAssignment.findFirst({
                where: {
                    facultyId: faculty.id,
                    subjectId,
                    ...(sectionId ? { sectionId } : {}),
                },
            });
            // Also check via timetable slots
            const slot = await prisma_1.prisma.timetableSlot.findFirst({
                where: {
                    facultyId: faculty.id,
                    subjectId,
                    ...(sectionId ? { sectionId } : {}),
                },
            });
            if (!assignment && !slot) {
                await this.deny(req, 'SUBJECT', `Faculty is not assigned to subject ${subjectId}`);
            }
            return;
        }
        await this.deny(req, 'SUBJECT', 'Subject access not permitted for your role');
    }
    /**
     * Verify student can only access their own record
     */
    static async verifyStudentOwnRecord(req, studentId) {
        const user = req.user;
        if (!user)
            throw new exceptions_1.ForbiddenException('Authentication required');
        if (['Super Admin', 'Principal', 'Vice Principal', 'Academic Dean', 'HOD', 'Faculty'].includes(user.role))
            return;
        if (user.role === 'Student') {
            const student = await this.getStudentRecord(user.id);
            if (!student || student.id !== studentId) {
                await this.deny(req, 'STUDENT', 'Access denied: Students can only access their own record');
            }
            return;
        }
        if (user.role === 'Parent') {
            // Parent can see only their children
            const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email } });
            if (!children.find(c => c.id === studentId)) {
                await this.deny(req, 'STUDENT', 'Access denied: Parents can only access their child\'s record');
            }
            return;
        }
    }
    /**
     * Apply database query-level isolation filters in-place based on user role
     */
    static async applySecurityFilters(user, where, modelKey) {
        if (['Super Admin', 'Principal', 'Vice Principal'].includes(user.role))
            return;
        let faculty = null;
        if (['HOD', 'Faculty', 'Academic Dean'].includes(user.role)) {
            faculty = await this.getFacultyRecord(user.id);
        }
        let student = null;
        if (['Student', 'Parent'].includes(user.role)) {
            student = user.role === 'Student'
                ? await this.getStudentRecord(user.id)
                : await prisma_1.prisma.student.findFirst({ where: { parentEmail: user.email } });
        }
        switch (modelKey) {
            case 'students':
                if (user.role === 'Student') {
                    where.id = student?.id ?? 'non-existent';
                }
                else if (user.role === 'Parent') {
                    const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email }, select: { id: true } });
                    where.id = { in: children.map(c => c.id) };
                }
                else if (user.role === 'HOD') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (user.role === 'Academic Dean') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (user.role === 'Faculty') {
                    if (where.mentorId) {
                        where.mentorId = faculty?.id ?? 'non-existent';
                        delete where.sectionId;
                    }
                    else if (where.departmentId) {
                        where.departmentId = faculty?.departmentId ?? 'non-existent';
                        delete where.sectionId;
                    }
                    else {
                        const assignments = await prisma_1.prisma.subjectAssignment.findMany({ where: { facultyId: faculty?.id ?? 'non-existent' }, select: { sectionId: true } });
                        const slots = await prisma_1.prisma.timetableSlot.findMany({ where: { facultyId: faculty?.id ?? 'non-existent' }, select: { sectionId: true } });
                        const sectionIds = Array.from(new Set([...assignments.map(a => a.sectionId), ...slots.map(s => s.sectionId)]));
                        where.sectionId = { in: sectionIds };
                    }
                }
                break;
            case 'faculties':
                if (user.role === 'Faculty') {
                    where.id = faculty?.id ?? 'non-existent';
                }
                else if (user.role === 'HOD') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (user.role === 'Academic Dean') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (['Student', 'Parent'].includes(user.role)) {
                    where.departmentId = student?.departmentId ?? 'non-existent';
                }
                break;
            case 'attendance':
                if (user.role === 'Student') {
                    where.studentId = student?.id ?? 'non-existent';
                }
                else if (user.role === 'Parent') {
                    const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email }, select: { id: true } });
                    where.studentId = { in: children.map(c => c.id) };
                }
                else if (user.role === 'HOD') {
                    where.student = { departmentId: faculty?.departmentId ?? 'non-existent' };
                }
                else if (user.role === 'Faculty') {
                    where.facultyId = faculty?.id ?? 'non-existent';
                }
                break;
            case 'marks':
                if (user.role === 'Student') {
                    where.studentId = student?.id ?? 'non-existent';
                }
                else if (user.role === 'Parent') {
                    const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email }, select: { id: true } });
                    where.studentId = { in: children.map(c => c.id) };
                }
                else if (user.role === 'HOD') {
                    where.student = { departmentId: faculty?.departmentId ?? 'non-existent' };
                }
                else if (user.role === 'Faculty') {
                    const assignments = await prisma_1.prisma.subjectAssignment.findMany({ where: { facultyId: faculty?.id ?? 'non-existent' }, select: { subjectId: true } });
                    const slots = await prisma_1.prisma.timetableSlot.findMany({ where: { facultyId: faculty?.id ?? 'non-existent' }, select: { subjectId: true } });
                    const subjectIds = Array.from(new Set([...assignments.map(a => a.subjectId), ...slots.map(s => s.subjectId)]));
                    where.subjectId = { in: subjectIds };
                }
                break;
            case 'feeBills':
                if (user.role === 'Student') {
                    where.studentId = student?.id ?? 'non-existent';
                }
                else if (user.role === 'Parent') {
                    const children = await prisma_1.prisma.student.findMany({ where: { parentEmail: user.email }, select: { id: true } });
                    where.studentId = { in: children.map(c => c.id) };
                }
                else if (['Faculty', 'HOD'].includes(user.role)) {
                    // Faculty/HOD cannot access financial ledger
                    where.studentId = 'non-existent';
                }
                break;
            case 'exams':
                if (['Student', 'Parent'].includes(user.role)) {
                    if (student) {
                        where.courseId = student.courseId;
                        where.semesterId = student.semesterId;
                    }
                    else {
                        where.id = 'non-existent';
                    }
                }
                else if (user.role === 'HOD') {
                    where.course = { departmentId: faculty?.departmentId ?? 'non-existent' };
                }
                else if (user.role === 'Faculty') {
                    where.coordinator = { id: faculty?.id ?? 'non-existent' };
                }
                break;
            case 'academics':
                if (user.role === 'HOD') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (user.role === 'Faculty') {
                    where.departmentId = faculty?.departmentId ?? 'non-existent';
                }
                else if (['Student', 'Parent'].includes(user.role)) {
                    where.departmentId = student?.departmentId ?? 'non-existent';
                }
                break;
        }
    }
    /**
     * Build menu filter from permission list using DB
     */
    static async getPermittedMenus(permissions, role) {
        if (role === 'Student') {
            return [
                { name: 'Dashboard', path: '/student/dashboard', icon: 'LayoutDashboard', componentKey: 'student_dashboard', order: 1 },
                { name: 'My Profile', path: '/student/profile', icon: 'User', componentKey: 'student_profile', order: 2 },
                { name: 'Digital ID Card', path: '/student/id-card', icon: 'CreditCard', componentKey: 'student_id_card', order: 3 },
                { name: 'Syllabus', path: '/student/syllabus', icon: 'BookOpen', componentKey: 'student_syllabus', parentPath: '/student/academics', order: 4 },
                { name: 'Timetable', path: '/student/timetable', icon: 'Clock', componentKey: 'student_timetable', parentPath: '/student/academics', order: 5 },
                { name: 'Attendance', path: '/student/attendance', icon: 'CheckCircle', componentKey: 'student_attendance', parentPath: '/student/academics', order: 6 },
                { name: 'Homework', path: '/student/homework', icon: 'FileText', componentKey: 'student_homework', parentPath: '/student/academics', order: 7 },
                { name: 'Assignments', path: '/student/assignments', icon: 'ClipboardList', componentKey: 'student_assignments', parentPath: '/student/academics', order: 8 },
                { name: 'Quiz', path: '/student/quiz', icon: 'HelpCircle', componentKey: 'student_quiz', parentPath: '/student/academics', order: 9 },
                { name: 'Examinations', path: '/student/examinations', icon: 'FileSpreadsheet', componentKey: 'student_examinations', parentPath: '/student/academics', order: 10 },
                { name: 'Results', path: '/student/results', icon: 'Award', componentKey: 'student_results', parentPath: '/student/academics', order: 11 },
                { name: 'Leave & OD', path: '/student/leave-od', icon: 'CalendarDays', componentKey: 'student_leave_od', order: 12 },
                { name: 'AI Academic Assistant', path: '/student/ai-assistant', icon: 'Cpu', componentKey: 'student_ai_assistant', order: 13 },
                { name: 'Placements', path: '/student/placements', icon: 'Briefcase', componentKey: 'student_placements', parentPath: '/student/career', order: 14 },
                { name: 'Internship', path: '/student/internship', icon: 'FileCode', componentKey: 'student_internship', parentPath: '/student/career', order: 15 },
                { name: 'Resume Builder', path: '/student/resume-builder', icon: 'FilePlus', componentKey: 'student_resume_builder', parentPath: '/student/career', order: 16 },
                { name: 'Career Dashboard', path: '/student/career-dashboard', icon: 'TrendingUp', componentKey: 'student_career_dashboard', parentPath: '/student/career', order: 17 },
                { name: 'Library', path: '/student/library', icon: 'Book', componentKey: 'student_library', order: 18 },
                { name: 'Hostel', path: '/student/hostel', icon: 'Home', componentKey: 'student_hostel', order: 19 },
                { name: 'Transport', path: '/student/transport', icon: 'Truck', componentKey: 'student_transport', order: 20 },
                { name: 'Portfolio', path: '/student/portfolio', icon: 'FolderGit', componentKey: 'student_portfolio', order: 21 },
                { name: 'Skills & Certifications', path: '/student/skills', icon: 'BadgeCheck', componentKey: 'student_skills', order: 22 },
                { name: 'Clubs & Events', path: '/student/clubs', icon: 'Compass', componentKey: 'student_clubs', order: 23 },
                { name: 'Documents', path: '/student/documents', icon: 'FolderOpen', componentKey: 'student_documents', order: 24 },
                { name: 'Circulars', path: '/student/circulars', icon: 'Bell', componentKey: 'student_circulars', order: 25 },
                { name: 'Advisor Chat', path: '/student/advisor-chat', icon: 'MessageSquare', componentKey: 'student_advisor_chat', order: 26 },
                { name: 'Notifications', path: '/student/notifications', icon: 'Inbox', componentKey: 'student_notifications', order: 27 },
                { name: 'Calendar', path: '/student/calendar', icon: 'Calendar', componentKey: 'student_calendar', order: 28 },
                { name: 'Gamification Arena', path: '/student/gamification', icon: 'Sparkles', componentKey: 'student_gamification', order: 29 },
                { name: 'Certificate Requests', path: '/student/certificates', icon: 'Award', componentKey: 'student_certificates', order: 30 },
            ];
        }
        if (role === 'Faculty') {
            try {
                const menuList = [];
                // 1. Dashboard
                menuList.push({ name: 'Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 });
                // 2. My Profile
                menuList.push({ name: 'My Profile', path: '/?tab=profile', icon: 'User', componentKey: 'dashboard', order: 2 });
                // 3. Assigned Subjects
                if (permissions.some(p => p.startsWith('subjects:') || p.startsWith('academics:') || p.startsWith('faculty:'))) {
                    menuList.push({ name: 'Assigned Subjects', path: '/?tab=subjects', icon: 'BookOpen', componentKey: 'dashboard', order: 3 });
                }
                // 4. My Timetable
                if (permissions.some(p => p.startsWith('timetable:') || p.startsWith('academics:') || p.startsWith('faculty:'))) {
                    menuList.push({ name: 'My Timetable', path: '/?tab=timetable', icon: 'Clock', componentKey: 'dashboard', order: 4 });
                }
                // 5. Attendance Management
                if (permissions.some(p => p.startsWith('attendance:'))) {
                    menuList.push({ name: 'Attendance Management', path: '/?tab=attendance', icon: 'CheckCircle', componentKey: 'dashboard', order: 5 });
                }
                // 6. Homework & Assignments
                if (permissions.some(p => p.startsWith('assignments:'))) {
                    menuList.push({ name: 'Homework & Assignments', path: '/?tab=assignments', icon: 'FileText', componentKey: 'dashboard', order: 6 });
                }
                // 7. Grading & Marks Entry (Grading)
                if (permissions.some(p => p.startsWith('marks:') || p.startsWith('assignments:'))) {
                    menuList.push({ name: 'Grading', path: '/?tab=marks', icon: 'FileSpreadsheet', componentKey: 'dashboard', order: 7 });
                }
                // 8. Class Students
                if (permissions.some(p => p.startsWith('students:') || p.startsWith('faculty:'))) {
                    menuList.push({ name: 'Class Students', path: '/?tab=students_list', icon: 'Users', componentKey: 'dashboard', order: 8 });
                }
                // 9. Mentor Workspace
                if (permissions.some(p => p.startsWith('mentor:') || p.startsWith('leaves:') || p.startsWith('attendance:'))) {
                    menuList.push({ name: 'Mentor Workspace', path: '/?tab=mentor_workspace', icon: 'Shield', componentKey: 'dashboard', order: 9 });
                }
                // 10. Student Leave / OD Requests
                menuList.push({ name: 'Student Leave / OD Requests', path: '/?tab=leave_requests', icon: 'FileText', componentKey: 'dashboard', order: 10 });
                // 11. Advisor Messaging
                menuList.push({ name: 'Advisor Messaging', path: '/?tab=messages', icon: 'MessageSquare', componentKey: 'dashboard', order: 11 });
                // 12. Placement & Internship Requests
                if (permissions.some(p => p.startsWith('placements:') || p.startsWith('students:'))) {
                    menuList.push({ name: 'Placement & Internship Requests', path: '/?tab=internships', icon: 'Briefcase', componentKey: 'dashboard', order: 12 });
                }
                // 13. Announcements & Circulars
                if (permissions.some(p => p.startsWith('notifications:'))) {
                    menuList.push({ name: 'Announcements', path: '/?tab=announcements', icon: 'Megaphone', componentKey: 'dashboard', order: 13 });
                    menuList.push({ name: 'Circulars', path: '/faculty/circulars', icon: 'Bell', componentKey: 'faculty_circulars', order: 14 });
                }
                // 14. Documents
                if (permissions.some(p => p.startsWith('files:'))) {
                    menuList.push({ name: 'Documents', path: '/?tab=research', icon: 'FolderOpen', componentKey: 'dashboard', order: 15 });
                }
                // 15. Reports
                if (permissions.some(p => p.startsWith('reports:'))) {
                    menuList.push({ name: 'Reports', path: '/?tab=reports', icon: 'FileBarChart', componentKey: 'dashboard', order: 16 });
                }
                // 16. My Leave / OD Requests (Faculty's own leave applications)
                menuList.push({ name: 'My Leave / OD Requests', path: '/?tab=leaves', icon: 'CalendarOff', componentKey: 'dashboard', order: 17 });
                // 17. AI Teaching Assistant
                menuList.push({ name: 'AI Teaching Assistant', path: '/?tab=ai_assistant', icon: 'Cpu', componentKey: 'dashboard', order: 18 });
                return menuList;
            }
            catch (e) {
                // Fallback Faculty menu if anything crashes
                return [
                    { name: 'Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                    { name: 'My Profile', path: '/?tab=profile', icon: 'User', componentKey: 'dashboard', order: 2 },
                    { name: 'Assigned Subjects', path: '/?tab=subjects', icon: 'BookOpen', componentKey: 'dashboard', order: 3 },
                    { name: 'My Timetable', path: '/?tab=timetable', icon: 'Clock', componentKey: 'dashboard', order: 4 },
                    { name: 'Attendance Management', path: '/?tab=attendance', icon: 'CheckCircle', componentKey: 'dashboard', order: 5 },
                    { name: 'Homework & Assignments', path: '/?tab=assignments', icon: 'FileText', componentKey: 'dashboard', order: 6 },
                    { name: 'Grading', path: '/?tab=marks', icon: 'FileSpreadsheet', componentKey: 'dashboard', order: 7 },
                    { name: 'Class Students', path: '/?tab=students_list', icon: 'Users', componentKey: 'dashboard', order: 8 },
                    { name: 'Mentor Workspace', path: '/?tab=mentor_workspace', icon: 'Shield', componentKey: 'dashboard', order: 9 },
                    { name: 'Student Leave / OD Requests', path: '/?tab=leave_requests', icon: 'FileText', componentKey: 'dashboard', order: 10 },
                    { name: 'Advisor Messaging', path: '/?tab=messages', icon: 'MessageSquare', componentKey: 'dashboard', order: 11 },
                    { name: 'My Leave / OD Requests', path: '/?tab=leaves', icon: 'CalendarOff', componentKey: 'dashboard', order: 12 },
                    { name: 'Circulars', path: '/faculty/circulars', icon: 'Bell', componentKey: 'faculty_circulars', order: 13 },
                    { name: 'Reports', path: '/?tab=reports', icon: 'FileBarChart', componentKey: 'dashboard', order: 14 },
                ];
            }
        }
        if (role === 'HOD') {
            try {
                const menuList = [];
                // 1. Dashboard
                menuList.push({ name: 'Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 });
                // 2. My Profile — dedicated page
                menuList.push({ name: 'My Profile', path: '/hod/profile', icon: 'User', componentKey: 'hod_profile', order: 2 });
                // 3. Department Overview — dedicated executive dashboard
                menuList.push({ name: 'Department Overview', path: '/hod/department-overview', icon: 'Layers', componentKey: 'department_overview', order: 3 });
                // 4. Department Students
                if (permissions.some(p => p.startsWith('students:'))) {
                    menuList.push({ name: 'Department Students', path: '/?tab=students', icon: 'Users', componentKey: 'dashboard', order: 4 });
                }
                // 5. Department Faculty
                if (permissions.some(p => p.startsWith('faculty:'))) {
                    menuList.push({ name: 'Department Faculty', path: '/?tab=faculty', icon: 'UserCheck', componentKey: 'dashboard', order: 5 });
                }
                // 6. Mentor Management
                if (permissions.some(p => p.startsWith('mentor:'))) {
                    menuList.push({ name: 'Mentor Management', path: '/?tab=mentor_management', icon: 'Shield', componentKey: 'dashboard', order: 6 });
                }
                // 7. Student Assignment
                if (permissions.some(p => p.startsWith('assignments:'))) {
                    menuList.push({ name: 'Student Assignment', path: '/?tab=allocations', icon: 'Cpu', componentKey: 'dashboard', order: 7 });
                }
                // 8. Department Attendance — unique page with defaulters & analytics
                if (permissions.some(p => p.startsWith('attendance:'))) {
                    menuList.push({ name: 'Department Attendance', path: '/hod/attendance', icon: 'CalendarDays', componentKey: 'department_attendance', order: 8 });
                }
                // 9. Department Timetable
                if (permissions.some(p => p.startsWith('timetable:') || p.startsWith('academics:'))) {
                    menuList.push({ name: 'Department Timetable', path: '/hod/timetable', icon: 'Clock', componentKey: 'timetable_engine', order: 9 });
                }
                // 10. Department Subjects — unique page: subject list, faculty mapping, credits
                if (permissions.some(p => p.startsWith('subjects:') || p.startsWith('academics:'))) {
                    menuList.push({ name: 'Department Subjects', path: '/hod/subjects', icon: 'BookOpen', componentKey: 'department_subjects', order: 10 });
                }
                // 11. Department Results — unique page: pass/fail, grade distribution
                if (permissions.some(p => p.startsWith('results:') || p.startsWith('marks:'))) {
                    menuList.push({ name: 'Department Results', path: '/hod/department-results', icon: 'Award', componentKey: 'department_results', order: 11 });
                }
                // 12. Academic Performance — unique page: CGPA, backlogs, top/weak students
                if (permissions.some(p => p.startsWith('results:') || p.startsWith('marks:') || p.startsWith('students:'))) {
                    menuList.push({ name: 'Academic Performance', path: '/hod/academic-performance', icon: 'TrendingUp', componentKey: 'academic_performance', order: 12 });
                }
                // 13. Faculty Performance — unique page: workload, feedback, publications
                if (permissions.some(p => p.startsWith('faculty:') || p.startsWith('reports:'))) {
                    menuList.push({ name: 'Faculty Performance', path: '/hod/faculty-performance', icon: 'BarChart2', componentKey: 'faculty_performance', order: 13 });
                }
                // 14. Leave & OD Approvals
                menuList.push({ name: 'Leave & OD Approvals', path: '/?tab=workflows', icon: 'ShieldAlert', componentKey: 'dashboard', order: 14 });
                // 15. Complaints Monitoring
                if (permissions.some(p => p.startsWith('support:'))) {
                    menuList.push({ name: 'Complaints Monitoring', path: '/?tab=complaints_monitoring', icon: 'AlertTriangle', componentKey: 'dashboard', order: 15 });
                }
                // 16. Circulars & Announcements — unique page with image/PDF upload, publish/draft/archive
                menuList.push({ name: 'Circulars & Announcements', path: '/hod/circulars', icon: 'Send', componentKey: 'hod_circulars', order: 16 });
                // 17. Reports & Analytics — unique page with export center
                if (permissions.some(p => p.startsWith('reports:') || p.startsWith('attendance:') || p.startsWith('marks:'))) {
                    menuList.push({ name: 'Reports & Analytics', path: '/hod/reports', icon: 'FileBarChart', componentKey: 'department_reports', order: 17 });
                }
                return menuList;
            }
            catch (e) {
                // Fallback HOD menu if anything crashes — safe defaults with unique routes
                return [
                    { name: 'Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                    { name: 'My Profile', path: '/hod/profile', icon: 'User', componentKey: 'hod_profile', order: 2 },
                    { name: 'Department Overview', path: '/hod/department-overview', icon: 'Layers', componentKey: 'department_overview', order: 3 },
                    { name: 'Department Students', path: '/?tab=students', icon: 'Users', componentKey: 'dashboard', order: 4 },
                    { name: 'Department Faculty', path: '/?tab=faculty', icon: 'UserCheck', componentKey: 'dashboard', order: 5 },
                    { name: 'Department Attendance', path: '/hod/attendance', icon: 'CalendarDays', componentKey: 'department_attendance', order: 6 },
                    { name: 'Department Timetable', path: '/hod/timetable', icon: 'Clock', componentKey: 'timetable_engine', order: 7 },
                    { name: 'Department Subjects', path: '/hod/subjects', icon: 'BookOpen', componentKey: 'department_subjects', order: 8 },
                    { name: 'Department Results', path: '/hod/department-results', icon: 'Award', componentKey: 'department_results', order: 9 },
                    { name: 'Academic Performance', path: '/hod/academic-performance', icon: 'TrendingUp', componentKey: 'academic_performance', order: 10 },
                    { name: 'Faculty Performance', path: '/hod/faculty-performance', icon: 'BarChart2', componentKey: 'faculty_performance', order: 11 },
                    { name: 'Leave & OD Approvals', path: '/?tab=workflows', icon: 'ShieldAlert', componentKey: 'dashboard', order: 12 },
                    { name: 'Circulars & Announcements', path: '/hod/circulars', icon: 'Send', componentKey: 'hod_circulars', order: 13 },
                    { name: 'Reports & Analytics', path: '/hod/reports', icon: 'FileBarChart', componentKey: 'department_reports', order: 14 },
                ];
            }
        }
        // ── Principal ─────────────────────────────────────────────────────────────
        if (role === 'Principal') {
            return [
                { name: 'Executive Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                { name: 'Institution Analytics', path: '/?tab=analytics', icon: 'BarChart2', componentKey: 'dashboard', order: 2 },
                { name: 'All Departments', path: '/?tab=departments', icon: 'Building', componentKey: 'dashboard', order: 3 },
                { name: 'Faculty Overview', path: '/?tab=faculty', icon: 'UserCheck', componentKey: 'dashboard', order: 4 },
                { name: 'Student Overview', path: '/?tab=students', icon: 'Users', componentKey: 'dashboard', order: 5 },
                { name: 'Academic Programs', path: '/?tab=academics', icon: 'GraduationCap', componentKey: 'dashboard', order: 6 },
                { name: 'Examination Board', path: '/?tab=exams', icon: 'FileSpreadsheet', componentKey: 'dashboard', order: 7 },
                { name: 'Fee & Finance', path: '/?tab=fees', icon: 'Landmark', componentKey: 'dashboard', order: 8 },
                { name: 'Leave Approvals', path: '/?tab=leave_approvals', icon: 'ShieldAlert', componentKey: 'dashboard', order: 9 },
                { name: 'Placements', path: '/?tab=placements', icon: 'Briefcase', componentKey: 'dashboard', order: 10 },
                { name: 'Complaints Board', path: '/?tab=complaints', icon: 'AlertTriangle', componentKey: 'dashboard', order: 11 },
                { name: 'Campus Activities', path: '/?tab=campus_life', icon: 'Compass', componentKey: 'dashboard', order: 12 },
                { name: 'Reports & Analytics', path: '/?tab=reports', icon: 'FileBarChart', componentKey: 'dashboard', order: 13 },
                { name: 'Notifications', path: '/?tab=notifications', icon: 'Bell', componentKey: 'dashboard', order: 14 },
            ];
        }
        // ── Vice Principal ─────────────────────────────────────────────────────────
        if (role === 'Vice Principal') {
            return [
                { name: 'VP Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                { name: 'Operations Monitor', path: '/?tab=operations', icon: 'Activity', componentKey: 'dashboard', order: 2 },
                { name: 'Department Control', path: '/?tab=departments', icon: 'Building', componentKey: 'dashboard', order: 3 },
                { name: 'Faculty Management', path: '/?tab=faculty', icon: 'UserCheck', componentKey: 'dashboard', order: 4 },
                { name: 'Student Affairs', path: '/?tab=students', icon: 'Users', componentKey: 'dashboard', order: 5 },
                { name: 'Attendance Overview', path: '/?tab=attendance', icon: 'CalendarDays', componentKey: 'dashboard', order: 6 },
                { name: 'Leave Approvals', path: '/?tab=leave_approvals', icon: 'ShieldAlert', componentKey: 'dashboard', order: 7 },
                { name: 'Examination Control', path: '/?tab=exams', icon: 'FileSpreadsheet', componentKey: 'dashboard', order: 8 },
                { name: 'Placements', path: '/?tab=placements', icon: 'Briefcase', componentKey: 'dashboard', order: 9 },
                { name: 'Grievances & Complaints', path: '/?tab=complaints', icon: 'AlertTriangle', componentKey: 'dashboard', order: 10 },
                { name: 'Campus Activities', path: '/?tab=campus_life', icon: 'Compass', componentKey: 'dashboard', order: 11 },
                { name: 'Reports', path: '/?tab=reports', icon: 'FileBarChart', componentKey: 'dashboard', order: 12 },
                { name: 'Audit & Escalations', path: '/?tab=audit', icon: 'Shield', componentKey: 'dashboard', order: 13 },
                { name: 'Notifications', path: '/?tab=notifications', icon: 'Bell', componentKey: 'dashboard', order: 14 },
            ];
        }
        // ── Academic Dean ──────────────────────────────────────────────────────────
        if (role === 'Academic Dean') {
            return [
                { name: 'Academic Dashboard', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                { name: 'Curriculum Overview', path: '/?tab=curriculum', icon: 'BookOpen', componentKey: 'dashboard', order: 2 },
                { name: 'Academic Programs', path: '/?tab=academics', icon: 'GraduationCap', componentKey: 'dashboard', order: 3 },
                { name: 'Department Reports', path: '/?tab=departments', icon: 'Building', componentKey: 'dashboard', order: 4 },
                { name: 'Faculty Oversight', path: '/?tab=faculty', icon: 'UserCheck', componentKey: 'dashboard', order: 5 },
                { name: 'Student Performance', path: '/?tab=students', icon: 'Users', componentKey: 'dashboard', order: 6 },
                { name: 'Attendance Analytics', path: '/?tab=attendance', icon: 'CalendarDays', componentKey: 'dashboard', order: 7 },
                { name: 'Timetable Engine', path: '/hod/timetable', icon: 'Clock', componentKey: 'timetable_engine', order: 8 },
                { name: 'Examination Board', path: '/?tab=exams', icon: 'FileSpreadsheet', componentKey: 'dashboard', order: 9 },
                { name: 'Research & Portfolio', path: '/?tab=research', icon: 'Trophy', componentKey: 'dashboard', order: 10 },
                { name: 'Placements', path: '/?tab=placements', icon: 'Briefcase', componentKey: 'dashboard', order: 11 },
                { name: 'Leave Approvals', path: '/?tab=leave_approvals', icon: 'ShieldAlert', componentKey: 'dashboard', order: 12 },
                { name: 'Reports & Analytics', path: '/?tab=reports', icon: 'FileBarChart', componentKey: 'dashboard', order: 13 },
                { name: 'Notifications', path: '/?tab=notifications', icon: 'Bell', componentKey: 'dashboard', order: 14 },
            ];
        }
        // ── Admission Dean ─────────────────────────────────────────────────────────
        if (role === 'Admission Dean') {
            return [
                { name: 'Admission Overview', path: '/?tab=overview', icon: 'LayoutDashboard', componentKey: 'dashboard', order: 1 },
                { name: 'Candidate Screening', path: '/?tab=applications', icon: 'Users', componentKey: 'dashboard', order: 2 },
                { name: 'Faculty Leave & OD Approvals', path: '/?tab=faculty_leaves', icon: 'FileText', componentKey: 'dashboard', order: 3 },
                { name: 'Seat Allocations', path: '/?tab=seats', icon: 'Layers', componentKey: 'dashboard', order: 4 },
                { name: 'Scholarships & Waivers', path: '/?tab=scholarships', icon: 'Award', componentKey: 'dashboard', order: 5 },
                { name: 'Admission CRM', path: '/?tab=enquiries', icon: 'UserPlus', componentKey: 'dashboard', order: 6 },
                { name: 'Counselling Rounds', path: '/?tab=counselling', icon: 'Calendar', componentKey: 'dashboard', order: 7 },
                { name: 'Fee Ledger', path: '/?tab=payments', icon: 'DollarSign', componentKey: 'dashboard', order: 8 },
            ];
        }
        // Super Admin sees everything
        if (role === 'Super Admin' || permissions.includes('*:*') || permissions.includes('*')) {
            return prisma_1.prisma.menuItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
        }
        // Collect all permissionRequired values
        const all = await prisma_1.prisma.menuItem.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
        return all.filter(item => {
            if (!item.permissionRequired)
                return true; // Public menu items
            const [mod, act] = item.permissionRequired.split(':');
            // Check direct match, module wildcard, or manage bypass
            return (permissions.includes(item.permissionRequired) ||
                permissions.includes(`${mod}:*`) ||
                permissions.includes(`${mod}:manage`) ||
                (act === 'read' && (permissions.includes(`${mod}:view`) || permissions.includes(`${mod}:read`))));
        });
    }
}
exports.SecurityHelper = SecurityHelper;
//# sourceMappingURL=security.js.map