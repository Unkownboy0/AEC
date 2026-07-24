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
            isCurrent: boolean;
            credits: number;
        };
        section: {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
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
            createdAt: Date;
            updatedAt: Date;
            departmentId: string;
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
        };
        faculty: {
            status: string;
            program: string | null;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            createdAt: Date;
            updatedAt: Date;
            dob: Date;
            gender: string | null;
            bloodGroup: string | null;
            documents: string;
            city: string | null;
            district: string | null;
            state: string | null;
            country: string | null;
            departmentId: string;
            userId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
            employeeId: string;
            dateOfJoining: Date;
            designation: string;
            qualification: string;
            experience: number;
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
            notificationPrefs: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        academicYearId: string;
        departmentId: string;
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
        createdAt: Date;
        updatedAt: Date;
        academicYearId: string;
        departmentId: string;
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
     * AI Timetable Optimization Draft Generation (Mock)
     */
    generateAIDraft(departmentId: string, semesterId: string, academicYearId: string): Promise<{
        success: boolean;
        createdCount: number;
    }>;
}
