export declare class UsersRepository {
    /**
     * List users with pagination, sorting, search string and filters
     */
    findAll(params: {
        page: number;
        pageSize: number;
        search?: string;
        role?: string;
        status?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
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
     * Create a user record
     */
    create(data: {
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        status: string;
        roleId: string;
    }): Promise<{
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
     * Update a user record (standard fields only)
     */
    update(id: string, data: {
        email?: string;
        firstName?: string;
        lastName?: string;
        status?: string;
        roleId?: string;
        phone?: string;
    }): Promise<{
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
     * Update any user field including passwordHash, forcePasswordChange, phone, etc.
     * Used by admin IAM actions (password reset, phone update, etc.)
     */
    updateFull(id: string, data: Record<string, any>): Promise<{
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
     * Delete a user record
     */
    delete(id: string): Promise<{
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
     * Update password for user
     */
    updatePassword(id: string, passwordHash: string): Promise<{
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
     * Find user details by id
     */
    findById(id: string): Promise<({
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
    }) | null>;
}
