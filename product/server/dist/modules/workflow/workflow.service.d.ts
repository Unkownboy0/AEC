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
    listRequests(userEmail: string, userRole: string, status?: string): Promise<({
        student: ({
            department: {
                code: string;
                type: string;
                status: string;
                id: string;
                email: string | null;
                phone: string | null;
                createdAt: Date;
                updatedAt: Date;
                documents: string;
                academicYearId: string | null;
                archived: boolean;
                archivedAt: Date | null;
                deleted: boolean;
                deletedAt: Date | null;
                name: string;
                description: string | null;
                color: string;
                shortName: string | null;
                logo: string | null;
                banner: string | null;
                website: string | null;
                officeLocation: string | null;
                establishedYear: number | null;
                hodId: string | null;
                hodName: string | null;
            };
            semester: {
                number: number;
                status: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                academicYearId: string;
                programId: string;
                courseId: string;
                archived: boolean;
                archivedAt: Date | null;
                deleted: boolean;
                deletedAt: Date | null;
                name: string;
                startDate: Date;
                endDate: Date;
                isCurrent: boolean;
                credits: number;
            };
            section: {
                status: string;
                id: string;
                departmentId: string;
                createdAt: Date;
                updatedAt: Date;
                programId: string;
                semesterId: string;
                archived: boolean;
                archivedAt: Date | null;
                deleted: boolean;
                deletedAt: Date | null;
                name: string;
                capacity: number;
                classAdvisor: string | null;
                room: string | null;
            };
        } & {
            status: string;
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            phone: string | null;
            departmentId: string;
            gender: string;
            dob: Date;
            bloodGroup: string | null;
            createdAt: Date;
            updatedAt: Date;
            admissionNo: string;
            dateOfAdmission: Date;
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
            programDepartmentId: string | null;
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
            facultyId: string | null;
            classAdvisorId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
        }) | null;
        history: {
            id: string;
            createdAt: Date;
            action: string;
            requestId: string;
            comment: string | null;
            stage: string;
            actionById: string;
            actionByName: string;
        }[];
    } & {
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
    })[]>;
    /**
     * Action a request (APPROVE, REJECT, FORWARD, CLARIFICATION)
     */
    takeAction(requestId: string, userEmail: string, userRole: string, action: 'APPROVE' | 'REJECT' | 'CLARIFICATION' | 'FORWARD', comment?: string): Promise<{
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
