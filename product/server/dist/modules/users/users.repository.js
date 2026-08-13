"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class UsersRepository {
    /**
     * List users with pagination, sorting, search string and filters
     */
    async findAll(params) {
        const { page, pageSize, search, role, status, sortBy = 'createdAt', sortOrder = 'desc', scopeWhere } = params;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { username: { contains: search } },
            ];
        }
        if (role) {
            where.role = { name: { equals: role, mode: 'insensitive' } };
        }
        if (status) {
            where.status = status;
        }
        if (scopeWhere) {
            where.AND = [scopeWhere];
        }
        const [users, totalCount] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    role: true,
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        return { users, totalCount };
    }
    /**
     * Create a user record
     */
    async create(data) {
        return prisma_1.prisma.user.create({
            data,
            include: { role: true },
        });
    }
    /**
     * Update a user record (standard fields only)
     */
    async update(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }
    /**
     * Update any user field including passwordHash, forcePasswordChange, phone, etc.
     * Used by admin IAM actions (password reset, phone update, etc.)
     */
    async updateFull(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }
    /**
     * Delete a user record
     */
    async delete(id) {
        return prisma_1.prisma.user.delete({
            where: { id },
        });
    }
    /**
     * Update password for user
     */
    async updatePassword(id, passwordHash) {
        return prisma_1.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
    }
    /**
     * Find user details by id
     */
    async findById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
    }
}
exports.UsersRepository = UsersRepository;
//# sourceMappingURL=users.repository.js.map