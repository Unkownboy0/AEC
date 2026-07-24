export interface UserPayload {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}
interface AuditParams {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    module: string;
    targetId?: string;
    targetType?: string;
    description: string;
    statusCode?: number;
    ipAddress?: string;
    userAgent?: string;
}
export declare function auditLog(params: AuditParams): Promise<void>;
export declare function auditRequest(req: any, action: string, module: string, description: string, targetId?: string, targetType?: string, statusCode?: number): Promise<void>;
export declare class SecurityHelper {
    /**
     * Resolve faculty record matching userId (cached-style per request)
     */
    static getFacultyRecord(userId: string): Promise<{
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
    } | null>;
    /**
     * Resolve student record matching userId
     */
    static getStudentRecord(userId: string): Promise<{
        status: string;
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        admissionNo: string;
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
    } | null>;
    /**
     * Deny access and emit audit log
     */
    static deny(req: any, module: string, reason: string): Promise<never>;
    /**
     * Verify HOD scope: HOD can only write to their own department
     */
    static verifyWriteAccess(req: any, targetDepartmentId: string): Promise<void>;
    /**
     * Verify faculty can only write marks/attendance for subjects they are assigned to
     */
    static verifyFacultySubjectAccess(req: any, subjectId: string, sectionId?: string): Promise<void>;
    /**
     * Verify student can only access their own record
     */
    static verifyStudentOwnRecord(req: any, studentId: string): Promise<void>;
    /**
     * Apply database query-level isolation filters in-place based on user role
     */
    static applySecurityFilters(user: UserPayload, where: any, modelKey: 'students' | 'faculties' | 'attendance' | 'marks' | 'feeBills' | 'exams' | 'academics'): Promise<void>;
    /**
     * Build menu filter from permission list using DB
     */
    static getPermittedMenus(permissions: string[], role: string): Promise<any[]>;
}
export {};
