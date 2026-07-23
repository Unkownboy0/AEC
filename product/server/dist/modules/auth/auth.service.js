"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const auth_repository_1 = require("./auth.repository");
const env_1 = require("../../config/env");
const uaParser_1 = require("../../utils/uaParser");
const security_1 = require("../../utils/security");
const exceptions_1 = require("../../utils/exceptions");
class AuthService {
    repo = new auth_repository_1.AuthRepository();
    /**
     * Login user, create session, log success/failure
     */
    async login(input, ipAddress, userAgent) {
        const { email, password, rememberMe } = input;
        const ua = (0, uaParser_1.parseUserAgent)(userAgent);
        const user = await this.repo.findByEmail(email);
        if (!user || user.status !== 'ACTIVE') {
            // Create failure log
            if (user) {
                await this.repo.createLoginHistory({
                    userId: user.id,
                    ipAddress,
                    userAgent,
                    device: ua.device,
                    browser: ua.browser,
                    status: 'FAILED',
                });
            }
            throw new exceptions_1.UnauthorizedException('Invalid email or password');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.repo.createLoginHistory({
                userId: user.id,
                ipAddress,
                userAgent,
                device: ua.device,
                browser: ua.browser,
                status: 'FAILED',
            });
            throw new exceptions_1.UnauthorizedException('Invalid email or password');
        }
        // Flatten permissions
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        // Create session duration
        const sessionDays = rememberMe ? 30 : 7;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + sessionDays);
        // Generate token payloads
        const accessPayload = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            permissions,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_SECRET, {
            expiresIn: '15m',
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, { expiresIn: `${sessionDays}d` });
        // Store Session
        await this.repo.createSession({
            userId: user.id,
            refreshToken,
            expiresAt,
            ipAddress,
            userAgent,
            device: ua.device,
            browser: ua.browser,
        });
        // Create success history log
        await this.repo.createLoginHistory({
            userId: user.id,
            ipAddress,
            userAgent,
            device: ua.device,
            browser: ua.browser,
            status: 'SUCCESS',
        });
        const menus = await security_1.SecurityHelper.getPermittedMenus(permissions, user.role.name);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role.name,
                profilePhoto: user.profilePhoto,
                permissions,
                menus,
                forcePasswordChange: user.forcePasswordChange,
            },
        };
    }
    /**
     * Issue new access token using valid refresh token
     */
    async refresh(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_SECRET);
            const session = await this.repo.findSession(refreshToken);
            if (!session || session.expiresAt < new Date()) {
                if (session) {
                    await this.repo.deleteSession(refreshToken);
                }
                throw new exceptions_1.UnauthorizedException('Session expired or revoked');
            }
            const user = await this.repo.findById(session.userId);
            if (!user || user.status !== 'ACTIVE') {
                throw new exceptions_1.UnauthorizedException('User account inactive');
            }
            const permissions = user.role.permissions.map((rp) => rp.permission.name);
            const accessPayload = {
                id: user.id,
                email: user.email,
                role: user.role.name,
                permissions,
            };
            const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_SECRET, {
                expiresIn: '15m',
            });
            return { accessToken };
        }
        catch (error) {
            throw new exceptions_1.UnauthorizedException('Invalid refresh token');
        }
    }
    /**
     * Revoke single session
     */
    async logout(refreshToken) {
        const session = await this.repo.findSession(refreshToken);
        if (session) {
            await this.repo.deleteSession(refreshToken);
            await this.repo.updateLastLogoutTime(session.userId);
        }
    }
    /**
     * Revoke all sessions for a user
     */
    async logoutAll(userId) {
        await this.repo.deleteAllSessions(userId);
        await this.repo.updateLastLogoutTime(userId);
    }
    /**
     * Get currently logged-in user profile
     */
    async getMe(userId) {
        const user = await this.repo.findById(userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new exceptions_1.NotFoundException('User profile not found');
        }
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        const menus = await security_1.SecurityHelper.getPermittedMenus(permissions, user.role.name);
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role.name,
            profilePhoto: user.profilePhoto,
            permissions,
            menus,
            forcePasswordChange: user.forcePasswordChange,
        };
    }
    /**
     * Change password for logged-in user
     */
    async changePassword(userId, input) {
        const { currentPassword, newPassword } = input;
        const user = await this.repo.findById(userId);
        if (!user) {
            throw new exceptions_1.NotFoundException('User not found');
        }
        const isPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new exceptions_1.BadRequestException('Incorrect current password');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await this.repo.updatePassword(userId, passwordHash);
        // Auto logout on all other devices on security credential changes
        await this.repo.deleteAllSessions(userId);
    }
    /**
     * Forgot password: create reset token and mock mail log
     */
    async forgotPassword(email) {
        const user = await this.repo.findByEmail(email);
        if (!user) {
            // Standard security best practice: do not leak if user exists or not.
            // We generate a dummy response for external observers, but internally we do not write DB rows.
            return { resetToken: 'mock-token-dispatched' };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour token validity
        await this.repo.createPasswordResetToken(user.id, resetToken, expiresAt);
        console.log(`✉️ [SMTP MOCK] Password reset link sent to ${email}: http://localhost:5173/reset-password?token=${resetToken}`);
        return { resetToken };
    }
    /**
     * Reset password using token
     */
    async resetPassword(input) {
        const { token, newPassword } = input;
        const dbToken = await this.repo.findResetToken(token);
        if (!dbToken || dbToken.used || dbToken.expiresAt < new Date()) {
            throw new exceptions_1.BadRequestException('Reset token is invalid or has expired');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await this.repo.updatePassword(dbToken.userId, passwordHash);
        await this.repo.markResetTokenAsUsed(token);
        // Terminate all sessions since security details updated
        await this.repo.deleteAllSessions(dbToken.userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map