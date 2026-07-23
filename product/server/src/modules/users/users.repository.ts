import { prisma } from '../../lib/prisma';

export class UsersRepository {
  /**
   * List users with pagination, sorting, search string and filters
   */
  async findAll(params: {
    page: number;
    pageSize: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, pageSize, search, role, status, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = { name: role };
    }

    if (status) {
      where.status = status;
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);

    return { users, totalCount };
  }

  /**
   * Create a user record
   */
  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    status: string;
    roleId: string;
  }) {
    return prisma.user.create({
      data,
      include: { role: true },
    });
  }

  /**
   * Update a user record (standard fields only)
   */
  async update(id: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    status?: string;
    roleId?: string;
    phone?: string;
  }) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  /**
   * Update any user field including passwordHash, forcePasswordChange, phone, etc.
   * Used by admin IAM actions (password reset, phone update, etc.)
   */
  async updateFull(id: string, data: Record<string, any>) {
    return prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  /**
   * Delete a user record
   */
  async delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Update password for user
   */
  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Find user details by id
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }
}
