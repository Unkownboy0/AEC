"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class WorkflowService {
    /**
     * Submit a new student leave/document request
     */
    async createRequest(userEmail, type, title, reason, startDateStr, endDateStr, attachments) {
        // Find student matching this email or user email
        const student = await prisma_1.prisma.student.findFirst({
            where: { email: userEmail, deleted: false },
            include: { user: true }
        });
        if (!student) {
            throw new exceptions_1.NotFoundException('Student profile not found for this user session');
        }
        const startDate = startDateStr ? new Date(startDateStr) : null;
        const endDate = endDateStr ? new Date(endDateStr) : null;
        const request = await prisma_1.prisma.workflowRequest.create({
            data: {
                studentId: student.id,
                type,
                title,
                reason,
                startDate,
                endDate,
                status: 'PENDING',
                currentStep: 'MENTOR',
                attachments: attachments || '[]',
            },
        });
        // Create history trace
        await prisma_1.prisma.workflowHistory.create({
            data: {
                requestId: request.id,
                stage: 'STUDENT',
                action: 'SUBMIT',
                comment: `Submitted ${type} request: ${title}`,
                actionById: student.userId || 'STUDENT',
                actionByName: `${student.firstName} ${student.lastName}`,
            },
        });
        // Notify assigned mentor
        if (student.mentorId) {
            const mentor = await prisma_1.prisma.faculty.findUnique({ where: { id: student.mentorId } });
            if (mentor) {
                await this.sendNotification(`New ${type} Request: ${student.firstName} ${student.lastName}`, `Student ${student.firstName} ${student.lastName} (${student.admissionNo}) has submitted a new ${type} request: "${title}". Please review and action in your Mentor Workspace.`, 'EMAIL');
            }
        }
        return request;
    }
    /**
     * List requests filtered by user role and context
     */
    async listRequests(userEmail, userRole, status) {
        const filters = {};
        if (status) {
            filters.status = status;
        }
        if (userRole === 'Student') {
            const student = await prisma_1.prisma.student.findFirst({ where: { email: userEmail } });
            if (!student)
                return [];
            filters.studentId = student.id;
            return prisma_1.prisma.workflowRequest.findMany({
                where: filters,
                include: { student: true, history: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (userRole === 'Parent') {
            const students = await prisma_1.prisma.student.findMany({ where: { parentEmail: userEmail } });
            const studentIds = students.map(s => s.id);
            filters.studentId = { in: studentIds };
            return prisma_1.prisma.workflowRequest.findMany({
                where: filters,
                include: { student: true, history: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (userRole === 'Faculty') {
            // Find faculty advisor
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { email: userEmail } });
            if (!faculty)
                return [];
            filters.student = { mentorId: faculty.id };
            filters.currentStep = 'MENTOR';
            return prisma_1.prisma.workflowRequest.findMany({
                where: filters,
                include: { student: true, history: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (userRole === 'HOD') {
            // Find HOD faculty
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { email: userEmail } });
            if (!faculty)
                return [];
            filters.student = { departmentId: faculty.departmentId };
            filters.currentStep = 'HOD';
            return prisma_1.prisma.workflowRequest.findMany({
                where: filters,
                include: { student: true, history: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        if (userRole === 'Principal' || userRole === 'Academic Dean' || userRole === 'Super Admin') {
            // Principal/Dean/Super Admin can see everything or what is at their steps
            if (userRole === 'Academic Dean') {
                filters.currentStep = 'DEAN';
            }
            else if (userRole === 'Principal') {
                filters.currentStep = 'PRINCIPAL';
            }
            return prisma_1.prisma.workflowRequest.findMany({
                where: filters,
                include: { student: true, history: true },
                orderBy: { createdAt: 'desc' }
            });
        }
        return [];
    }
    /**
     * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
     */
    async takeAction(requestId, userEmail, userRole, action, comment) {
        const request = await prisma_1.prisma.workflowRequest.findUnique({
            where: { id: requestId },
            include: { student: { include: { department: true } } }
        });
        if (!request) {
            throw new exceptions_1.NotFoundException('Workflow request not found');
        }
        // Verify auth role matches step
        if (request.currentStep === 'MENTOR' && userRole !== 'Faculty' && userRole !== 'Super Admin') {
            throw new exceptions_1.UnauthorizedException('Only the assigned Mentor/Faculty can action this request');
        }
        if (request.currentStep === 'MENTOR' && userRole === 'Faculty') {
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { email: userEmail } });
            if (!faculty || request.student.mentorId !== faculty.id) {
                throw new exceptions_1.UnauthorizedException('You are not the assigned mentor for this student');
            }
        }
        if (request.currentStep === 'HOD' && userRole !== 'HOD' && userRole !== 'Super Admin') {
            throw new exceptions_1.UnauthorizedException('Only the Department HOD can action this request');
        }
        let nextStep = request.currentStep;
        let nextStatus = request.status;
        // Resolve user profile for logging name
        const user = await prisma_1.prisma.user.findFirst({ where: { email: userEmail } });
        const actorName = user ? `${user.firstName} ${user.lastName}` : userRole;
        const actorId = user ? user.id : 'SYSTEM';
        if (action === 'REJECT') {
            nextStatus = 'REJECTED';
        }
        else if (action === 'CLARIFICATION') {
            nextStatus = 'CLARIFICATION_REQUESTED';
        }
        else if (action === 'FORWARD' || action === 'APPROVE') {
            if (request.currentStep === 'MENTOR') {
                nextStep = 'HOD';
                nextStatus = 'PENDING';
            }
            else if (request.currentStep === 'HOD') {
                // Can directly approve or forward to Dean/Principal if required
                if (action === 'FORWARD') {
                    nextStep = 'DEAN';
                    nextStatus = 'PENDING';
                }
                else {
                    nextStatus = 'APPROVED';
                }
            }
            else if (request.currentStep === 'DEAN') {
                if (action === 'FORWARD') {
                    nextStep = 'PRINCIPAL';
                    nextStatus = 'PENDING';
                }
                else {
                    nextStatus = 'APPROVED';
                }
            }
            else if (request.currentStep === 'PRINCIPAL') {
                nextStatus = 'APPROVED';
            }
        }
        const updatedRequest = await prisma_1.prisma.workflowRequest.update({
            where: { id: requestId },
            data: {
                status: nextStatus,
                currentStep: nextStep,
            },
        });
        // Write history log
        await prisma_1.prisma.workflowHistory.create({
            data: {
                requestId,
                stage: request.currentStep,
                action,
                comment: comment || `Actioned by ${userRole}`,
                actionById: actorId,
                actionByName: actorName,
            },
        });
        // Send notifications to appropriate roles/parties
        if (nextStatus === 'PENDING') {
            if (nextStep === 'HOD') {
                // Find HOD of the student's department
                const hodRole = await prisma_1.prisma.role.findFirst({ where: { name: 'HOD' } });
                const departmentHod = hodRole ? await prisma_1.prisma.faculty.findFirst({
                    where: {
                        departmentId: request.student.departmentId,
                        user: { roleId: hodRole.id }
                    }
                }) : null;
                if (departmentHod) {
                    await this.sendNotification(`Request Pending HOD Approval: ${request.student.firstName} ${request.student.lastName}`, `A ${request.type} request "${request.title}" from ${request.student.firstName} ${request.student.lastName} is pending your approval.`, 'EMAIL');
                }
            }
            else if (nextStep === 'DEAN') {
                // Notify Academic Dean
                await this.sendNotification(`Request Pending Dean Approval: ${request.student.firstName} ${request.student.lastName}`, `A ${request.type} request "${request.title}" from ${request.student.firstName} ${request.student.lastName} is pending your approval.`, 'EMAIL');
            }
            else if (nextStep === 'PRINCIPAL') {
                // Notify Principal
                await this.sendNotification(`Request Pending Principal Approval: ${request.student.firstName} ${request.student.lastName}`, `A ${request.type} request "${request.title}" from ${request.student.firstName} ${request.student.lastName} is pending your approval.`, 'EMAIL');
            }
        }
        else {
            // Status is APPROVED, REJECTED, or CLARIFICATION_REQUESTED
            // Notify the student
            await this.sendNotification(`Request Status Update: ${request.title}`, `Your ${request.type} request has been ${nextStatus.replace('_', ' ').toLowerCase()} by ${actorName}.`, 'EMAIL');
        }
        return updatedRequest;
    }
    /**
     * Helper to dispatch system notification and log to console
     */
    async sendNotification(title, content, type = 'EMAIL') {
        await prisma_1.prisma.systemNotification.create({
            data: {
                title,
                content,
                type,
                status: 'SENT',
            }
        });
        console.log(`📣 [NOTIFICATION DISPATCHED] ${title}: ${content}`);
    }
}
exports.WorkflowService = WorkflowService;
//# sourceMappingURL=workflow.service.js.map