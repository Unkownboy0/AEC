export declare class RolesService {
    /**
     * List all roles with user counts and permissions
     */
    listRoles(params: any): Promise<({
        _count: {
            users: number;
        };
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
    })[]>;
    /**
     * Get single role details
     */
    getRole(id: string): Promise<{
        _count: {
            users: number;
        };
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
    }>;
    /**
     * Create a custom role
     */
    createRole(data: any, createdBy: string): Promise<{
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
    }>;
    /**
     * Update role details
     */
    updateRole(id: string, data: any, updatedBy: string): Promise<{
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
    }>;
    /**
     * Delete a role
     */
    deleteRole(id: string, deletedBy: string): Promise<{
        success: boolean;
    }>;
    /**
     * Clone permissions and details of a role
     */
    cloneRole(id: string, data: {
        name: string;
        description?: string;
    }, createdBy: string): Promise<{
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
    }>;
    /**
     * Get all system permissions
     */
    listPermissions(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        action: string;
        module: string;
        description: string | null;
    }[]>;
    /**
     * Sync permission list for a role
     */
    syncPermissions(roleId: string, permissionIds: string[]): Promise<{
        success: boolean;
    }>;
    /**
     * Get users belonging to a role
     */
    getRoleUsers(roleId: string, params: any): Promise<{
        users: {
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
        }[];
        totalCount: number;
        page: number;
        pageSize: number;
    }>;
    /**
     * Bulk assign users to a role
     */
    bulkAssignUsers(roleId: string, userIds: string[]): Promise<{
        success: boolean;
    }>;
    /**
     * Unassign user (transfers them to Student baseline role)
     */
    unassignUser(roleId: string, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Templates CRUD
     */
    listTemplates(): Promise<({
        permissions: {
            permissionId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    })[]>;
    getTemplate(id: string): Promise<{
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
            permissionId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    createTemplate(data: any): Promise<{
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
            permissionId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    updateTemplate(id: string, data: any): Promise<{
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
            permissionId: string;
            templateId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
    }>;
    applyTemplate(templateId: string, roleId: string): Promise<{
        success: boolean;
    }>;
    private static globalPermissionVersion;
    static getPermissionVersion(): number;
    static bumpPermissionVersion(): number;
    /**
     * Get current matrix permission version timestamp
     */
    getMatrixVersion(): Promise<{
        version: number;
    }>;
    /**
     * Simulate target role view for Super Admin
     */
    simulateRole(targetRoleName: string, requestingUser: any): Promise<{
        simulationMode: boolean;
        originalRole: any;
        simulatedRole: string;
        permissions: string[];
        simulatedUser: {
            id: any;
            email: any;
            role: string;
            permissions: string[];
        };
    }>;
    /**
     * Bulk role assignment & department transfer
     */
    bulkOperation(data: {
        userIds: string[];
        targetRoleId?: string;
        departmentId?: string;
    }): Promise<{
        success: boolean;
        count: number;
    }>;
}
