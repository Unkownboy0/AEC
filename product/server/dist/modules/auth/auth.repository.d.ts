export declare class AuthRepository {
    /**
     * Find a user by email, eager loading role and permissions via explicit RolePermission join
     */
    findByEmail(email: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    action: string;
                    module: string;
                    description: string | null;
                };
            } & {
                roleId: string;
                createdAt: Date;
                permissionId: string;
            })[];
        } & {
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
        student: {
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
        } | null;
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
        } | null;
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
    }) | null>;
    /**
     * Find a user by ID, eager loading role and permissions via explicit RolePermission join
     */
    findById(id: string): Promise<({
        role: {
            permissions: ({
                permission: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    action: string;
                    module: string;
                    description: string | null;
                };
            } & {
                roleId: string;
                createdAt: Date;
                permissionId: string;
            })[];
        } & {
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
    }) | null>;
    /**
     * Increment failed login attempts and optionally lock the account
     */
    incrementFailedAttempts(userId: string, count: number, lockedUntil: Date | null): Promise<{
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
     * Reset failed login attempts after successful login
     */
    resetFailedAttempts(userId: string): Promise<{
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
     * Update password hash for a user
     */
    updatePassword(userId: string, passwordHash: string): Promise<{
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
     * Create a new user session
     */
    createSession(data: {
        userId: string;
        refreshToken: string;
        expiresAt: Date;
        ipAddress?: string;
        userAgent?: string;
        device?: string;
        browser?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        refreshToken: string;
        ipAddress: string | null;
        userAgent: string | null;
        device: string | null;
        browser: string | null;
        expiresAt: Date;
    }>;
    /**
     * Find user session by refresh token
     */
    findSession(refreshToken: string): Promise<({
        user: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        refreshToken: string;
        ipAddress: string | null;
        userAgent: string | null;
        device: string | null;
        browser: string | null;
        expiresAt: Date;
    }) | null>;
    /**
     * Revoke a specific session by refresh token
     */
    deleteSession(refreshToken: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        refreshToken: string;
        ipAddress: string | null;
        userAgent: string | null;
        device: string | null;
        browser: string | null;
        expiresAt: Date;
    } | null>;
    /**
     * Revoke all sessions for a specific user
     */
    deleteAllSessions(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * Create a password reset token
     */
    createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        used: boolean;
    }>;
    /**
     * Find an active password reset token
     */
    findResetToken(token: string): Promise<({
        user: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        used: boolean;
    }) | null>;
    /**
     * Mark a password reset token as used
     */
    markResetTokenAsUsed(token: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        used: boolean;
    }>;
    /**
     * Create a login history record
     */
    createLoginHistory(data: {
        userId: string;
        ipAddress?: string;
        userAgent?: string;
        device?: string;
        browser?: string;
        status: string;
    }): Promise<{
        status: string;
        id: string;
        createdAt: Date;
        userId: string;
        ipAddress: string | null;
        userAgent: string | null;
        device: string | null;
        browser: string | null;
        loginTime: Date;
        logoutTime: Date | null;
    }>;
    /**
     * Update logout time for the most recent login history record of a user
     */
    updateLastLogoutTime(userId: string): Promise<void>;
}
