import { RequesterIdentity } from '../security/student-access.service';
export declare class UsersService {
    private repo;
    /**
     * List users
     */
    listUsers(params: any, requester: RequesterIdentity): Promise<{
        users: ({
            role: {
                status: string;
                id: string;
                departmentId: string | null;
                dashboardConfig: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                icon: string;
                roleCode: string | null;
                color: string;
                priority: number;
                hierarchy: number;
                isSystem: boolean;
                sidebarConfig: string | null;
                moduleAccess: string | null;
                approvalLevels: string | null;
                reportAccess: string | null;
                workspaceAccess: string | null;
                notificationSettings: string | null;
                searchScope: string | null;
                createdBy: string | null;
            };
        } & {
            status: string;
            designation: string | null;
            digitalSignature: string | null;
            id: string;
            email: string;
            passwordHash: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            departmentId: string | null;
            reportingManagerId: string | null;
            workspaces: string | null;
            activeWorkspace: string | null;
            approvalAuthority: boolean;
            dashboardConfig: string | null;
            notificationPreferences: string | null;
            gender: string | null;
            dob: Date | null;
            bloodGroup: string | null;
            qrCode: string | null;
            aadhaarNumber: string | null;
            emergencyContact: string | null;
            qualification: string | null;
            experience: string | null;
            skills: string | null;
            certificates: string | null;
            profileCompletion: number;
            joiningDate: Date | null;
            accountStatus: string;
            loginStatus: string;
            activityTimeline: string | null;
            designationId: string | null;
            parentRoleId: string | null;
            roleId: string;
            lockedUntil: Date | null;
            failedLoginAttempts: number;
            forcePasswordChange: boolean;
            profilePhoto: string | null;
            passwordChangedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            username: string | null;
        })[];
        totalCount: number;
    }>;
    /**
     * Get user by ID, Email, or Username
     */
    getUserById(id: string, requester: RequesterIdentity): Promise<{
        user: {
            id: string;
            email: string;
            username: string | null;
            firstName: string;
            lastName: string;
            profilePhoto: any;
            role: string;
            status: string;
            onlineStatus: string;
            phone: string;
            dob: string;
            gender: string;
            bloodGroup: string;
            emergencyContact: string;
            joiningDate: string;
            departmentName: string;
            departmentCode: string;
            designation: string;
            qualification: string;
            experience: string;
            officeRoom: any;
            reportingOfficer: string;
        };
        studentRecord: {
            admissionNo: any;
            status: string;
            program: {
                code: string;
            };
            department: {
                name: string;
                code: string;
            };
            attendancePercentage: any;
            gpa: any;
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
        } | {
            admissionNo: string;
            status: string;
            department: {
                name: string;
                code: string;
            };
            attendancePercentage: number;
            gpa: string;
        } | null;
        facultyRecord: {
            employeeId: string;
            department: {
                name: string;
                code: string;
            };
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
        } | {
            employeeId: string;
            designation: string;
            department: {
                name: string;
                code: string;
            };
        } | null;
        leaveRequests: {
            id: any;
            requestNumber: any;
            title: any;
            category: any;
            startDate: string;
            endDate: string;
            status: any;
        }[];
        coursesEnrolled: {
            code: any;
            name: any;
            credits: any;
            type: string;
        }[];
        departmentHod: {
            name: string;
            email: string | null;
        } | null;
        departmentTree: {
            role: string;
            name: string;
            path: string;
        }[];
        assignedTasks: never[];
        auditLogs: never[];
    }>;
    /**
     * Create a new user with automatic Username & Password generation
     */
    createUser(input: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        generatedUsername: any;
        temporaryPassword: any;
        role: {
            status: string;
            id: string;
            departmentId: string | null;
            dashboardConfig: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            icon: string;
            roleCode: string | null;
            color: string;
            priority: number;
            hierarchy: number;
            isSystem: boolean;
            sidebarConfig: string | null;
            moduleAccess: string | null;
            approvalLevels: string | null;
            reportAccess: string | null;
            workspaceAccess: string | null;
            notificationSettings: string | null;
            searchScope: string | null;
            createdBy: string | null;
        };
        status: string;
        designation: string | null;
        digitalSignature: string | null;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        departmentId: string | null;
        reportingManagerId: string | null;
        workspaces: string | null;
        activeWorkspace: string | null;
        approvalAuthority: boolean;
        dashboardConfig: string | null;
        notificationPreferences: string | null;
        gender: string | null;
        dob: Date | null;
        bloodGroup: string | null;
        qrCode: string | null;
        aadhaarNumber: string | null;
        emergencyContact: string | null;
        qualification: string | null;
        experience: string | null;
        skills: string | null;
        certificates: string | null;
        profileCompletion: number;
        joiningDate: Date | null;
        accountStatus: string;
        loginStatus: string;
        activityTimeline: string | null;
        designationId: string | null;
        parentRoleId: string | null;
        roleId: string;
        lockedUntil: Date | null;
        failedLoginAttempts: number;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
        passwordChangedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
    }>;
    /**
     * Regenerate user temporary credentials (Admin functionality)
     */
    regenerateCredentials(id: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        username: string | null;
        role: string;
        departmentId: string | null;
        temporaryPassword: string;
        forcePasswordChange: boolean;
    }>;
    /**
     * Unlock user account (Admin functionality)
     */
    unlockUserAccount(id: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        status: string;
        message: string;
    }>;
    /**
     * Update user details
     */
    updateUser(id: string, input: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        role: {
            status: string;
            id: string;
            departmentId: string | null;
            dashboardConfig: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            icon: string;
            roleCode: string | null;
            color: string;
            priority: number;
            hierarchy: number;
            isSystem: boolean;
            sidebarConfig: string | null;
            moduleAccess: string | null;
            approvalLevels: string | null;
            reportAccess: string | null;
            workspaceAccess: string | null;
            notificationSettings: string | null;
            searchScope: string | null;
            createdBy: string | null;
        };
    } & {
        status: string;
        designation: string | null;
        digitalSignature: string | null;
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        departmentId: string | null;
        reportingManagerId: string | null;
        workspaces: string | null;
        activeWorkspace: string | null;
        approvalAuthority: boolean;
        dashboardConfig: string | null;
        notificationPreferences: string | null;
        gender: string | null;
        dob: Date | null;
        bloodGroup: string | null;
        qrCode: string | null;
        aadhaarNumber: string | null;
        emergencyContact: string | null;
        qualification: string | null;
        experience: string | null;
        skills: string | null;
        certificates: string | null;
        profileCompletion: number;
        joiningDate: Date | null;
        accountStatus: string;
        loginStatus: string;
        activityTimeline: string | null;
        designationId: string | null;
        parentRoleId: string | null;
        roleId: string;
        lockedUntil: Date | null;
        failedLoginAttempts: number;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
        passwordChangedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        username: string | null;
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
                hodUserId: string | null;
                hodName: string | null;
            };
        } & {
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
