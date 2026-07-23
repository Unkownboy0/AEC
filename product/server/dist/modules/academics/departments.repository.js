"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class DepartmentsRepository {
    /**
     * List departments with filters, search, and pagination
     */
    async findAll(params) {
        const { page, pageSize, search, type, status, showDeleted = false, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * pageSize;
        const where = {};
        // Filter soft deletes unless explicitly showing them
        if (!showDeleted) {
            where.deleted = false;
        }
        else {
            where.deleted = true;
        }
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { code: { contains: search } },
                { shortName: { contains: search } },
            ];
        }
        if (type) {
            where.type = type;
        }
        if (status) {
            where.status = status;
        }
        const [departments, totalCount] = await Promise.all([
            prisma_1.prisma.department.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    _count: {
                        select: {
                            programs: { where: { deleted: false } },
                            courses: { where: { deleted: false } },
                            sections: { where: { deleted: false } },
                            subjects: { where: { deleted: false } }
                        }
                    }
                }
            }),
            prisma_1.prisma.department.count({ where }),
        ]);
        return { departments, totalCount };
    }
    /**
     * Find a department by ID
     */
    async findById(id) {
        return prisma_1.prisma.department.findUnique({
            where: { id },
            include: {
                programs: { where: { deleted: false } },
                courses: { where: { deleted: false } },
                _count: {
                    select: {
                        programs: { where: { deleted: false } },
                        courses: { where: { deleted: false } },
                        sections: { where: { deleted: false } },
                        subjects: { where: { deleted: false } }
                    }
                }
            }
        });
    }
    /**
     * Find a department by code
     */
    async findByCode(code) {
        return prisma_1.prisma.department.findUnique({
            where: { code }
        });
    }
    /**
     * Create a department
     */
    async create(data) {
        return prisma_1.prisma.department.create({
            data
        });
    }
    /**
     * Update a department
     */
    async update(id, data) {
        return prisma_1.prisma.department.update({
            where: { id },
            data
        });
    }
    /**
     * Soft delete a department
     */
    async softDelete(id) {
        return prisma_1.prisma.department.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date()
            }
        });
    }
    /**
     * Restore a soft deleted department
     */
    async restore(id) {
        return prisma_1.prisma.department.update({
            where: { id },
            data: {
                deleted: false,
                deletedAt: null
            }
        });
    }
    /**
     * Bulk soft delete
     */
    async bulkSoftDelete(ids) {
        return prisma_1.prisma.department.updateMany({
            where: { id: { in: ids } },
            data: {
                deleted: true,
                deletedAt: new Date()
            }
        });
    }
    /**
     * Bulk archive status
     */
    async bulkArchive(ids) {
        return prisma_1.prisma.department.updateMany({
            where: { id: { in: ids } },
            data: {
                status: 'ARCHIVED',
                archived: true,
                archivedAt: new Date()
            }
        });
    }
}
exports.DepartmentsRepository = DepartmentsRepository;
//# sourceMappingURL=departments.repository.js.map