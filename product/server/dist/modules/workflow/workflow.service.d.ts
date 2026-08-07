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
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string | null;
        attachments: string;
        reason: string;
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
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        facultyId: string | null;
        classAdvisorId: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string | null;
        attachments: string;
        reason: string;
        currentStep: string;
        facultyRequesterId: string | null;
    } | {
        status: string;
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        facultyId: string;
        hodId: string | null;
        startDate: Date;
        endDate: Date;
        attachmentUrl: string | null;
        reason: string;
        requestNumber: string;
        leaveType: string;
        totalDays: number;
        substitutions: string;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        principalId: string | null;
        principalApprovedAt: Date | null;
        principalRemarks: string | null;
        isActingPrincipal: boolean;
    } | {
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
        hodId: string | null;
        startDate: Date;
        endDate: Date;
        studentId: string;
        attachmentUrl: string | null;
        isEmergency: boolean;
        reason: string;
        rejectedAt: Date | null;
        requestNumber: string;
        totalDays: number;
        hodApprovedAt: Date | null;
        hodRemarks: string | null;
        requestCategory: string | null;
        durationType: string | null;
        eventName: string | null;
        eventLocation: string | null;
        studentStatus: string | null;
        mentorStatus: string | null;
        hodStatus: string | null;
        finalStatus: string | null;
        workflowStatus: string | null;
        studentActionRequired: boolean;
        mentorApprovedAt: Date | null;
        mentorRemarks: string | null;
        forwardedToHodAt: Date | null;
        approvedAt: Date | null;
        cancelledAt: Date | null;
        attendanceUpdated: boolean;
    }>;
    /**
     * Cancel pending request by student owner
     */
    cancelRequest(requestId: string, userEmail: string): Promise<{
        type: string;
        status: string;
        id: string;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        mentorId: string | null;
        facultyId: string | null;
        classAdvisorId: string | null;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string | null;
        attachments: string;
        reason: string;
        currentStep: string;
        facultyRequesterId: string | null;
    }>;
    /**
     * Helper to dispatch system notification and log to console
     */
    private sendNotification;
}
