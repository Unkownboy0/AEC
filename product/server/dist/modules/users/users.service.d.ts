export declare class UsersService {
    private repo;
    /**
     * List users
     */
    listUsers(params: any): Promise<{
        users: ({
            role: {
                status: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                icon: string;
                color: string;
                priority: number;
                hierarchy: number;
                isSystem: boolean;
                createdBy: string | null;
            };
        } & {
            status: string;
            id: string;
            email: string;
            passwordHash: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            roleId: string;
            lockedUntil: Date | null;
            failedLoginAttempts: number;
            forcePasswordChange: boolean;
            profilePhoto: string | null;
            passwordChangedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        totalCount: number;
    }>;
    /**
     * Create a new user
     */
    createUser(input: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        role: {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            icon: string;
            color: string;
            priority: number;
            hierarchy: number;
            isSystem: boolean;
            createdBy: string | null;
        };
    } & {
        status: string;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        roleId: string;
        lockedUntil: Date | null;
        failedLoginAttempts: number;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
        passwordChangedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Update user details
     */
    updateUser(id: string, input: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        role: {
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            icon: string;
            color: string;
            priority: number;
            hierarchy: number;
            isSystem: boolean;
            createdBy: string | null;
        };
    } & {
        status: string;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        roleId: string;
        lockedUntil: Date | null;
        failedLoginAttempts: number;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
        passwordChangedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Delete user
     */
    deleteUser(id: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<void>;
    /**
     * Reset user password
     */
    resetUserPassword(id: string, newPassword: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<void>;
    /**
     * Bulk CSV Import
     */
    /**
     * Bulk CSV/Excel Import with Auto Department Mapping
     */
    bulkImport(rows: any[], triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        successCount: number;
        failCount: number;
        errors: string[];
    }>;
    /**
     * Update profile (contact info, emergency details, and base64 photo)
     */
    updateProfile(userId: string, input: any, ip?: string, ua?: string): Promise<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        profilePhoto: string | null;
        status: string;
        role: string;
        faculty: ({
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
        } & {
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
        }) | null;
    }>;
    /**
     * Enterprise Username & Password Auto-Generator
     */
    generateCredentials(input: {
        firstName: string;
        email?: string;
        phone?: string;
        roleName: string;
        regOrEmpNo?: string;
        departmentCode?: string;
    }): Promise<{
        suggestedUsername: string;
        generatedPassword: string;
        emailSuggestion: string;
    }>;
    /**
     * Enterprise User Directory KPI Statistics (Calculated dynamically)
     */
    getDirectoryStats(): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        pendingActivation: number;
        students: number;
        faculty: number;
        mentors: number;
        hods: number;
        deans: number;
        vicePrincipal: number;
        principal: number;
        parents: number;
        staff: number;
        admins: number;
        recentlyAdded: number;
    }>;
    /**
     * Assign Subjects to Faculty
     */
    assignSubjects(input: {
        userId: string;
        departmentId?: string;
        semesterId?: string;
        sectionId?: string;
        subjectNames?: string[];
    }, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        status: string;
        message: string;
    }>;
    /**
     * Assign Mentor to Student Batch
     */
    assignMentor(input: {
        facultyId: string;
        departmentId?: string;
        sectionId?: string;
        studentBatch?: string;
    }, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        status: string;
        message: string;
    }>;
}
