"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const prisma_1 = require("../../lib/prisma");
class AuthRepository {
    /**
     * Find a user by email, eager loading role and permissions via explicit RolePermission join
     */
    async findByEmail(email) {
        return prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { student: { admissionNo: email, deleted: false } },
                    { faculty: { employeeId: email, deleted: false } },
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
            },
        });
    }
    /**
     * Find a user by ID, eager loading role and permissions via explicit RolePermission join
     */
    async findById(id) {
        return prisma_1.prisma.user.findUnique({
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
            },
        });
    }
    /**
     * Increment failed login attempts and optionally lock the account
     */
    async incrementFailedAttempts(userId, count, lockedUntil) {
        return prisma_1.prisma.user.update({
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
    async resetFailedAttempts(userId) {
        return prisma_1.prisma.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
    }
    /**
     * Update password hash for a user
     */
    async updatePassword(userId, passwordHash) {
        return prisma_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash, forcePasswordChange: false, passwordChangedAt: new Date() },
        });
    }
    /**
     * Create a new user session
     */
    async createSession(data) {
        return prisma_1.prisma.userSession.create({
            data,
        });
    }
    /**
     * Find user session by refresh token
     */
    async findSession(refreshToken) {
        return prisma_1.prisma.userSession.findUnique({
            where: { refreshToken },
            include: { user: true },
        });
    }
    /**
     * Revoke a specific session by refresh token
     */
    async deleteSession(refreshToken) {
        return prisma_1.prisma.userSession.delete({
            where: { refreshToken },
        }).catch(() => null); // Silently catch if already deleted
    }
    /**
     * Revoke all sessions for a specific user
     */
    async deleteAllSessions(userId) {
        return prisma_1.prisma.userSession.deleteMany({
            where: { userId },
        });
    }
    /**
     * Create a password reset token
     */
    async createPasswordResetToken(userId, token, expiresAt) {
        // Delete any old tokens first
        await prisma_1.prisma.passwordResetToken.deleteMany({
            where: { userId },
        });
        return prisma_1.prisma.passwordResetToken.create({
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
    async findResetToken(token) {
        return prisma_1.prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });
    }
    /**
     * Mark a password reset token as used
     */
    async markResetTokenAsUsed(token) {
        return prisma_1.prisma.passwordResetToken.update({
            where: { token },
            data: { used: true },
        });
    }
    /**
     * Create a login history record
     */
    async createLoginHistory(data) {
        return prisma_1.prisma.loginHistory.create({
            data,
        });
    }
    /**
     * Update logout time for the most recent login history record of a user
     */
    async updateLastLogoutTime(userId) {
        const lastHistory = await prisma_1.prisma.loginHistory.findFirst({
            where: { userId, status: 'SUCCESS', logoutTime: null },
            orderBy: { loginTime: 'desc' },
        });
        if (lastHistory) {
            await prisma_1.prisma.loginHistory.update({
                where: { id: lastHistory.id },
                data: { logoutTime: new Date() },
            });
        }
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map