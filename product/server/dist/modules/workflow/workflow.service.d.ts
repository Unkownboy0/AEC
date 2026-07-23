export declare class WorkflowService {
    /**
     * Submit a new student leave/document request
     */
    createRequest(userEmail: string, type: string, title: string, reason: string, startDateStr?: string, endDateStr?: string, attachments?: string): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string;
        reason: string;
        currentStep: string;
        attachments: string;
    }>;
    /**
     * List requests filtered by user role and context
     */
    listRequests(userEmail: string, userRole: string, status?: string): Promise<({
        student: {
            status: string;
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            createdAt: Date;
            updatedAt: Date;
            admissionNo: string;
            phone: string | null;
            dob: Date;
            dateOfAdmission: Date;
            gender: string;
            bloodGroup: string | null;
            religion: string | null;
            category: string | null;
            medicalDetails: string | null;
            scholarship: string | null;
            parentName: string;
            parentPhone: string;
            parentEmail: string | null;
            parentOccupation: string | null;
            currentAddress: string;
            permanentAddress: string;
            documents: string;
            timeline: string;
            promoted: boolean;
            preferredName: string | null;
            altPhone: string | null;
            city: string | null;
            district: string | null;
            state: string | null;
            country: string | null;
            pinCode: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelation: string | null;
            linkedin: string | null;
            github: string | null;
            portfolio: string | null;
            technicalSkills: string | null;
            softSkills: string | null;
            languagesKnown: string | null;
            certifications: string | null;
            resumeUrl: string | null;
            careerObjective: string | null;
            areasOfInterest: string | null;
            academicYearId: string;
            departmentId: string;
            programId: string;
            courseId: string;
            semesterId: string;
            sectionId: string;
            hostelId: string | null;
            roomNo: string | null;
            transportRouteId: string | null;
            transportStopId: string | null;
            userId: string | null;
            mentorId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
        };
        history: {
            id: string;
            createdAt: Date;
            action: string;
            stage: string;
            comment: string | null;
            actionById: string;
            actionByName: string;
            requestId: string;
        }[];
    } & {
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string;
        reason: string;
        currentStep: string;
        attachments: string;
    })[]>;
    /**
     * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
     */
    takeAction(requestId: string, userEmail: string, userRole: string, action: 'APPROVE' | 'REJECT' | 'CLARIFICATION' | 'FORWARD', comment?: string): Promise<{
        type: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date | null;
        endDate: Date | null;
        title: string;
        studentId: string;
        reason: string;
        currentStep: string;
        attachments: string;
    }>;
    /**
     * Helper to dispatch system notification and log to console
     */
    private sendNotification;
}
