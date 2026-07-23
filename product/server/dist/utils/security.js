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