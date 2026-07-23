export declare class DepartmentsService {
    private repo;
    /**
     * List all departments
     */
    listDepartments(params: any): Promise<{
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
     * Get department details
     */
    getDepartment(id: string): Promise<{
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
    }>;
    /**
     * Create department
     */
    createDepartment(data: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
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
     * Update department
     */
    updateDepartment(id: string, data: any, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
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
     * Soft delete department
     */
    deleteDepartment(id: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Restore department
     */
    restoreDepartment(id: string, triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Bulk delete
     */
    bulkDelete(ids: string[], triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        success: boolean;
    }>;
    /**
     * Bulk archive
     */
    bulkArchive(ids: string[], triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        success: boolean;
    }>;
    /**
     * CSV / Excel bulk import validation & parsing
     */
    importDepartments(rows: any[], triggeredByUserId: string, ip?: string, ua?: string): Promise<{
        importedCount: number;
        errors: string[];
    }>;
}
