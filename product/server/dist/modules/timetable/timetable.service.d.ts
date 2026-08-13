export declare class TimetableService {
    /**
     * Get timetable slots based on section, faculty, department, or student
     */
    listSlots(params: any): Promise<({
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
            credits: number;
            isCurrent: boolean;
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
        subject: {
            code: string;
            status: string;
            id: string;
            departmentId: string;
            createdAt: Date;
            updatedAt: Date;
            programId: string;
            semesterId: string;
            sectionId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
            name: string;
            description: string | null;
            isLab: boolean;
            credits: number;
            theoryHours: number;
            practicalHours: number;
            tutorialHours: number;
            internalMarks: number;
            externalMarks: number;
            passingMarks: number;
            isElective: boolean;
            isCore: boolean;
            isSkillBased: boolean;
            isOpenElective: boolean;
            isProfessionalElective: boolean;
            subjectCoordinator: string | null;
            regulationId: string | null;
            approvalStatus: string;
            assignedFacultyId: string | null;
            assignedHodId: string | null;
            assignedDeanId: string | null;
            assignedCoordinatorId: string | null;
        };
        faculty: {
            status: string;
            designation: string;
            program: string | null;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            departmentId: string;
            gender: string | null;
            dob: Date;
            bloodGroup: string | null;
            qualification: string;
            experience: number;
            createdAt: Date;
            updatedAt: Date;
            notificationPrefs: string | null;
            documents: string;
            city: string | null;
            district: string | null;
            state: string | null;
            country: string | null;
            userId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
            employeeId: string;
            dateOfJoining: Date;
            subjectMappings: string;
            maritalStatus: string | null;
            nationality: string | null;
            aadhaarNo: string | null;
            panNo: string | null;
            personalEmail: string | null;
            personalPhone: string | null;
            alternatePhone: string | null;
            emergencyName: string | null;
            emergencyPhone: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            pincode: string | null;
            employmentType: string | null;
            specialization: string | null;
            highestDegree: string | null;
            university: string | null;
            researchArea: string | null;
            facultyType: string | null;
            officeRoom: string | null;
            officeExtension: string | null;
            highestQualification: string | null;
            additionalCertifications: string | null;
            researchInterests: string | null;
            publications: string | null;
            patents: string | null;
            books: string | null;
            industryExperience: number | null;
            professionalMemberships: string | null;
            linkedinProfile: string | null;
            googleScholar: string | null;
            orcidId: string | null;
            portfolioWebsite: string | null;
        };
    } & {
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        academicYearId: string;
        semesterId: string;
        sectionId: string;
        roomNo: string;
        facultyId: string;
        subjectId: string;
        dayOfWeek: string;
        slotIndex: number;
        startTime: string;
        endTime: string;
        isLab: boolean;
    })[]>;
    /**
     * Create a new timetable slot with strict conflict checks
     */
    createSlot(input: any): Promise<{
        id: string;
        departmentId: string;
        createdAt: Date;
        updatedAt: Date;
        academicYearId: string;
        semesterId: string;
        sectionId: string;
        roomNo: string;
        facultyId: string;
        subjectId: string;
        dayOfWeek: string;
        slotIndex: number;
        startTime: string;
        endTime: string;
        isLab: boolean;
    }>;
    /**
     * Delete a timetable slot
     */
    deleteSlot(id: string): Promise<{
        success: boolean;
    }>;
    /**
     * Scheduling preview. This endpoint must never delete or mutate the live
     * timetable. A real optimizer can consume configured period/workload policy
     * later; until then we return the authoritative inputs and conflicts only.
     */
    generateAIDraft(departmentId: string, semesterId: string, academicYearId: string): Promise<{
        mode: string;
        applied: boolean;
        message: string;
        inputs: {
            subjectCount: number;
            facultyCount: number;
            sectionCount: number;
            existingSlotCount: number;
        };
        existingSlots: {
            id: string;
            sectionId: string;
            roomNo: string;
            facultyId: string;
            dayOfWeek: string;
            slotIndex: number;
        }[];
    }>;
}
