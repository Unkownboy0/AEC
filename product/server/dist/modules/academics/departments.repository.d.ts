export declare class DepartmentsRepository {
    /**
     * List departments with filters, search, and pagination
     */
    findAll(params: {
        page: number;
        pageSize: number;
        search?: string;
        type?: string;
        status?: string;
        showDeleted?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        departments: ({
            _count: {
                programs: number;
                courses: number;
                sections: number;
                subjects: number;
            };
        } & {
            code: string;
            type: string;
            status: string;
            id: string;
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            color: string;
            shortName: string | null;
            logo: string | null;
            banner: string | null;
            phone: string | null;
            website: string | null;
            officeLocation: string | null;
            establishedYear: number | null;
            hodId: string | null;
            hodName: string | null;
            documents: string;
            academicYearId: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
        })[];
        totalCount: number;
    }>;
    /**
     * Find a department by ID
     */
    findById(id: string): Promise<({
        _count: {
            programs: number;
            courses: number;
            sections: number;
            subjects: number;
        };
        programs: {
            code: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
            duration: number;
            level: string;
            credits: number;
            coordinator: string | null;
            departmentId: string;
        }[];
        courses: {
            code: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            archived: boolean;
            archivedAt: Date | null;
            deleted: boolean;
            deletedAt: Date | null;
            duration: number;
            credits: number;
            coordinator: string | null;
            departmentId: string;
            regulation: string;
            courseOutcomes: string;
            programId: string;
        }[];
    } & {
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    }) | null>;
    /**
     * Find a department by code
     */
    findByCode(code: string): Promise<{
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    } | null>;
    /**
     * Create a department
     */
    create(data: any): Promise<{
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    }>;
    /**
     * Update a department
     */
    update(id: string, data: any): Promise<{
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    }>;
    /**
     * Soft delete a department
     */
    softDelete(id: string): Promise<{
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    }>;
    /**
     * Restore a soft deleted department
     */
    restore(id: string): Promise<{
        code: string;
        type: string;
        status: string;
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        color: string;
        shortName: string | null;
        logo: string | null;
        banner: string | null;
        phone: string | null;
        website: string | null;
        officeLocation: string | null;
        establishedYear: number | null;
        hodId: string | null;
        hodName: string | null;
        documents: string;
        academicYearId: string | null;
        archived: boolean;
        archivedAt: Date | null;
        deleted: boolean;
        deletedAt: Date | null;
    }>;
    /**
     * Bulk soft delete
     */
    bulkSoftDelete(ids: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * Bulk archive status
     */
    bulkArchive(ids: string[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
