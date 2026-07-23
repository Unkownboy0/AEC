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
    }>;
    /**
     * Create a custom role
     */
    createRole(data: any, createdBy: string): Promise<{
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
    }>;
    /**
     * Update role details
     */
    updateRole(id: string, data: any, updatedBy: string): Promise<{
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
    }>;
    /**
     * Get all system permissions
     */
    listPermissions(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
            id: string;
            email: string;
            passwordHash: string;
            firstName: string;
            lastName: string;
            roleId: string;
            lockedUntil: Date | null;
            forcePasswordChange: boolean;
            profilePhoto: string | null;
            createdAt: Date;
            updatedAt: Date;
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
}
