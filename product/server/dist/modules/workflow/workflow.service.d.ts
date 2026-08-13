export declare class WorkflowService {
    /**
     * Submit a new student leave/document request
     */
    createRequest(userEmail: string, type: string, title: string, reason: string, startDateStr?: string, endDateStr?: string, attachments?: string): Promise<{
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        facultyId: string | null;
        classAdvisorId: string | null;
        studentId: string | null;
        reason: string;
        startDate: Date | null;
        endDate: Date | null;
        attachments: string;
        title: string;
        currentStep: string;
        facultyRequesterId: string | null;
    }>;
    /**
     * List requests filtered by user role and context
     */
    listRequests(userEmail: string, rawRole: any, status?: string): Promise<any[]>;
    /**
     * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
     */
    takeAction(requestId: string, userEmail: string, rawRole: any, action: 'APPROVE' | 'REJECT' | 'CLARIFICATION' | 'FORWARD', comment?: string): Promise<{
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        emergencyContact: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        description: string | null;
        startTime: string | null;
        endTime: string | null;
        priority: string | null;
        studentId: string;
        hodId: string | null;
        requestNumber: string;
        requestCategory: string | null;
        reason: string;
        startDate: Date;
        endDate: Date;
        durationType: string | null;
        totalDays: number;
        eventName: string | null;
        eventLocation: string | null;
        attachmentUrl: string | null;
        studentStatus: string | null;
        mentorStatus: string | null;
        hodStatus: string | null;
        finalStatus: string | null;
        workflowStatus: string | null;
        isEmergency: boolean;
        studentActionRequired: boolean;
        mentorApprovedAt: Date | null;
        mentorRemarks: string | null;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        forwardedToHodAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        cancelledAt: Date | null;
        attendanceUpdated: boolean;
    } | {
        status: string;
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        facultyId: string;
        hodId: string | null;
        requestNumber: string;
        reason: string;
        startDate: Date;
        endDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        leaveType: string;
        substitutions: string;
        principalId: string | null;
        principalApprovedAt: Date | null;
        principalRemarks: string | null;
        isActingPrincipal: boolean;
    } | {
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        facultyId: string | null;
        classAdvisorId: string | null;
        studentId: string | null;
        reason: string;
        startDate: Date | null;
        endDate: Date | null;
        attachments: string;
        title: string;
        currentStep: string;
        facultyRequesterId: string | null;
    }>;
    /**
     * Cancel pending request by student owner
     */
    cancelRequest(requestId: string, userEmail: string): Promise<{
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        emergencyContact: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        description: string | null;
        startTime: string | null;
        endTime: string | null;
        priority: string | null;
        studentId: string;
        hodId: string | null;
        requestNumber: string;
        requestCategory: string | null;
        reason: string;
        startDate: Date;
        endDate: Date;
        durationType: string | null;
        totalDays: number;
        eventName: string | null;
        eventLocation: string | null;
        attachmentUrl: string | null;
        studentStatus: string | null;
        mentorStatus: string | null;
        hodStatus: string | null;
        finalStatus: string | null;
        workflowStatus: string | null;
        isEmergency: boolean;
        studentActionRequired: boolean;
        mentorApprovedAt: Date | null;
        mentorRemarks: string | null;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        forwardedToHodAt: Date | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        cancelledAt: Date | null;
        attendanceUpdated: boolean;
    } | {
        status: string;
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        facultyId: string;
        hodId: string | null;
        requestNumber: string;
        reason: string;
        startDate: Date;
        endDate: Date;
        totalDays: number;
        attachmentUrl: string | null;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        leaveType: string;
        substitutions: string;
        principalId: string | null;
        principalApprovedAt: Date | null;
        principalRemarks: string | null;
        isActingPrincipal: boolean;
    } | {
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        facultyId: string | null;
        classAdvisorId: string | null;
        studentId: string | null;
        reason: string;
        startDate: Date | null;
        endDate: Date | null;
        attachments: string;
        title: string;
        currentStep: string;
        facultyRequesterId: string | null;
    }>;
    /**
     * Helper to dispatch system notification and log to console
     */
    private sendNotification;
}
