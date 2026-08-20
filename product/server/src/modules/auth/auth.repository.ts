import { prisma } from '../../lib/prisma';

export class AuthRepository {
  /**
   * Find a user by email, eager loading role and permissions via explicit RolePermission join
   */
  async findByEmail(identifier: string) {
    const clean = (identifier || '').trim();
    if (!clean) return null;
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: clean, mode: 'insensitive' } },
          { username: { equals: clean, mode: 'insensitive' } },
          { student: { admissionNo: { equals: clean, mode: 'insensitive' }, deleted: false } },
          { faculty: { employeeId: { equals: clean, mode: 'insensitive' }, deleted: false } },
        ],
      },

      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        student: true,
        faculty: true,
        profileImageFile: true,
      },
    });
  }

  /**
   * Find a user by ID, eager loading role and permissions via explicit RolePermission join
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        profileImageFile: true,
      },
    });
  }

  /**
   * Increment failed login attempts and optionally lock the account
   */
  async incrementFailedAttempts(userId: string, count: number, lockedUntil: Date | null) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: count,
        ...(lockedUntil ? { lockedUntil } : {}),
      },
    });
  }

  /**
   * Reset failed login attempts after successful login
   */
  async resetFailedAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  /**
   * Update password hash for a user
   */
  async updatePassword(userId: string, passwordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash, forcePasswordChange: false, passwordChangedAt: new Date() },
    });
  }

  /**
   * Create a new user session
   */
  async createSession(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    browser?: string;
  }) {
    return prisma.userSession.create({
      data,
    });
  }

  /**
   * Find user session by refresh token
   */
  async findSession(refreshToken: string) {
    return prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });
  }

  /**
   * Revoke a specific session by refresh token
   */
  async deleteSession(refreshToken: string) {
    return prisma.userSession.delete({
      where: { refreshToken },
    }).catch(() => null); // Silently catch if already deleted
  }

  /**
   * Revoke all sessions for a specific user
   */
  async deleteAllSessions(userId: string) {
    return prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  /**
   * Create a password reset token
   */
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    // Delete any old tokens first
    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    return prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find an active password reset token
   */
  async findResetToken(token: string) {
    return prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Mark a password reset token as used
   */
  async markResetTokenAsUsed(token: string) {
    return prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    });
  }

  /**
   * Create a login history record
   */
  async createLoginHistory(data: {
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    browser?: string;
    status: string;
  }) {
    return prisma.loginHistory.create({
      data,
    });
  }

  /**
   * Update logout time for the most recent login history record of a user
   */
  async updateLastLogoutTime(userId: string) {
    const lastHistory = await prisma.loginHistory.findFirst({
      where: { userId, status: 'SUCCESS', logoutTime: null },
      orderBy: { loginTime: 'desc' },
    });

    if (lastHistory) {
      await prisma.loginHistory.update({
        where: { id: lastHistory.id },
        data: { logoutTime: new Date() },
      });
    }
  }
}
