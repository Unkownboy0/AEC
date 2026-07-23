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
            roleId: string;
            lockedUntil: Date | null;
            forcePasswordChange: boolean;
            profilePhoto: string | null;
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
        roleId: string;
        lockedUntil: Date | null;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
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
        roleId: string;
        lockedUntil: Date | null;
        forcePasswordChange: boolean;
        profilePhoto: string | null;
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
    bulkImport(rows: any[], triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        successCount: number;
        failCount: number;
        errors: string[];
    }>;
    /**
     * Update profile (contact info, emergency details, and base64 photo)
     */
    updateProfile(userId: string, input: any, ip?: string, ua?: string): Promise<{
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
    }>;
}
