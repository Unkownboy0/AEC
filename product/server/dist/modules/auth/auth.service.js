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
const prisma_1 = require("../../lib/prisma");
const env_1 = require("../../config/env");
const uaParser_1 = require("../../utils/uaParser");
const security_1 = require("../../utils/security");
const exceptions_1 = require("../../utils/exceptions");
const workspace_access_1 = require("./workspace-access");
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const durationToMilliseconds = (value) => {
    const match = /^(\d+)(m|h|d)$/.exec(value.trim());
    if (!match)
        throw new Error(`Unsupported token duration: ${value}`);
    const amount = Number(match[1]);
    const unitMs = match[2] === 'm' ? 60_000 : match[2] === 'h' ? 3_600_000 : 86_400_000;
    return amount * unitMs;
};
const hashResetToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
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
        // ── Account Lockout Check ──
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            await this.repo.createLoginHistory({
                userId: user.id, ipAddress, userAgent,
                device: ua.device, browser: ua.browser, status: 'FAILED',
            });
            throw new exceptions_1.UnauthorizedException(`Account temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            // Increment failed attempt counter
            const newFailCount = (user.failedLoginAttempts || 0) + 1;
            const lockUntil = newFailCount >= MAX_FAILED_ATTEMPTS
                ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
                : null;
            await this.repo.incrementFailedAttempts(user.id, newFailCount, lockUntil);
            await this.repo.createLoginHistory({
                userId: user.id, ipAddress, userAgent,
                device: ua.device, browser: ua.browser, status: 'FAILED',
            });
            if (lockUntil) {
                await (0, security_1.auditLog)({
                    userId: user.id, userEmail: user.email, userRole: user.role.name,
                    action: 'ACCOUNT_LOCKED', module: 'AUTH',
                    description: `Account locked after ${MAX_FAILED_ATTEMPTS} failed login attempts for ${LOCKOUT_DURATION_MINUTES} minutes`,
                    statusCode: 401, ipAddress, userAgent,
                });
                throw new exceptions_1.UnauthorizedException(`Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`);
            }
            throw new exceptions_1.UnauthorizedException('Invalid email or password');
        }
        // ── Successful auth: reset lockout counter ──
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
            await this.repo.resetFailedAttempts(user.id);
        }
        // Flatten permissions
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        const refreshLifetime = rememberMe
            ? env_1.env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN
            : env_1.env.REFRESH_TOKEN_EXPIRES_IN;
        const expiresAt = new Date(Date.now() + durationToMilliseconds(refreshLifetime));
        // Generate token payloads
        const accessPayload = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            permissions,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, { expiresIn: refreshLifetime });
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
        const workspaceAccess = await (0, workspace_access_1.resolveUserWorkspaceAccess)(user.id);
        const workspaces = workspaceAccess?.workspaces.map((workspace) => workspace.name) || [user.role.name];
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
                workspaces,
            },
        };
    }
    /**
     * Issue new access token using valid refresh token
     */
    async refresh(refreshToken, ipAddress, userAgent) {
        // ── Refresh Token Rotation ──
        // On each refresh, old token is invalidated and a new one is issued.
        // If an already-revoked token is used (replay attack), all sessions for that user are terminated.
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_SECRET, {
                maxAge: env_1.env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN,
            });
        }
        catch {
            throw new exceptions_1.UnauthorizedException('Invalid refresh token');
        }
        const session = await this.repo.findSession(refreshToken);
        if (!session) {
            // Possible replay attack: token was already rotated/deleted
            // Kill ALL sessions for this user as a security measure
            await this.repo.deleteAllSessions(decoded.userId);
            await (0, security_1.auditLog)({
                userId: decoded.userId,
                action: 'TOKEN_REPLAY_DETECTED', module: 'AUTH',
                description: 'Revoked refresh token reused — all sessions terminated (possible token theft)',
                statusCode: 401, ipAddress, userAgent,
            });
            throw new exceptions_1.UnauthorizedException('Session revoked — please log in again');
        }
        if (session.expiresAt < new Date()) {
            await this.repo.deleteSession(refreshToken);
            throw new exceptions_1.UnauthorizedException('Session expired');
        }
        const user = await this.repo.findById(session.userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new exceptions_1.UnauthorizedException('User account inactive');
        }
        // Rotate: delete old session, create new one
        await this.repo.deleteSession(refreshToken);
        const remainingMs = Math.min(session.expiresAt.getTime() - Date.now(), durationToMilliseconds(env_1.env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN));
        const refreshLifetimeSeconds = Math.max(1, Math.floor(remainingMs / 1000));
        const newRefreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, { expiresIn: refreshLifetimeSeconds });
        const ua = (0, uaParser_1.parseUserAgent)(userAgent);
        const newExpiresAt = new Date(Date.now() + remainingMs);
        await this.repo.createSession({
            userId: user.id,
            refreshToken: newRefreshToken,
            expiresAt: newExpiresAt,
            ipAddress,
            userAgent,
            device: ua.device,
            browser: ua.browser,
        });
        const permissions = user.role.permissions.map((rp) => rp.permission.name);
        const accessPayload = {
            id: user.id,
            email: user.email,
            role: user.role.name,
            permissions,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
        return { accessToken, refreshToken: newRefreshToken };
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
     * Dynamic Multi-Workspace Context Switcher
     * Swaps active role context without re-authentication
     */
    async switchWorkspace(userId, targetRole) {
        const user = await this.repo.findById(userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new exceptions_1.NotFoundException('User account not found');
        }
        const workspaceAccess = await (0, workspace_access_1.resolveUserWorkspaceAccess)(userId);
        const targetWorkspace = workspaceAccess?.workspaces.find((workspace) => workspace.name === targetRole);
        const allowedRoles = workspaceAccess?.workspaces.map((workspace) => workspace.name) || [];
        if (!targetWorkspace) {
            throw new exceptions_1.BadRequestException(`Workspace '${targetRole}' is not authorized for your account`);
        }
        const roleName = targetWorkspace.name;
        const permissions = targetWorkspace.permissions;
        // Update activeWorkspace in database
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { activeWorkspace: roleName },
        });
        // Issue updated Access Token with activeRole context
        const accessPayload = {
            id: user.id,
            email: user.email,
            role: roleName,
            permissions,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessPayload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
        const menus = await security_1.SecurityHelper.getPermittedMenus(permissions, roleName);
        return {
            accessToken,
            activeWorkspace: roleName,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: roleName,
                profilePhoto: user.profilePhoto,
                permissions,
                menus,
                workspaces: allowedRoles,
                activeWorkspace: roleName,
            },
        };
    }
    /**
     * Get currently logged-in user profile (full — includes faculty/department for HOD/Faculty roles)
     */
    async getMe(userId, activeRole) {
        const user = await this.repo.findById(userId);
        if (!user || user.status !== 'ACTIVE') {
            throw new exceptions_1.NotFoundException('User profile not found');
        }
        const workspaceAccess = await (0, workspace_access_1.resolveUserWorkspaceAccess)(userId);
        const workspaces = workspaceAccess?.workspaces.map((workspace) => workspace.name) || [user.role.name];
        const activeWorkspace = workspaceAccess?.workspaces.find((workspace) => workspace.name === activeRole)
            || workspaceAccess?.workspaces.find((workspace) => workspace.name === user.role.name);
        const roleName = activeWorkspace?.name || user.role.name;
        const permissions = activeWorkspace?.permissions || user.role.permissions.map((rp) => rp.permission.name);
        const menus = await security_1.SecurityHelper.getPermittedMenus(permissions, roleName);
        // Fetch faculty record with department
        let faculty = null;
        try {
            faculty = await prisma_1.prisma.faculty.findFirst({
                where: { userId },
                include: { department: true },
            });
        }
        catch (_) {
            // Silently ignore
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            profilePhoto: user.profilePhoto,
            status: user.status,
            role: roleName,
            permissions,
            menus,
            forcePasswordChange: user.forcePasswordChange,
            faculty,
            workspaces,
            activeWorkspace: roleName,
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
    async forgotPassword(email) {
        const user = await this.repo.findByEmail(email);
        if (!user) {
            // Keep the externally observable response identical for unknown accounts.
            crypto_1.default.randomBytes(32);
            return;
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + env_1.env.PASSWORD_RESET_TOKEN_MINUTES * 60_000);
        await this.repo.createPasswordResetToken(user.id, hashResetToken(resetToken), expiresAt);
        // Delivery is intentionally delegated to the production mail integration.
        // Never log or return the one-time credential.
        await (0, security_1.auditLog)({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role.name,
            action: 'PASSWORD_RESET_REQUESTED',
            module: 'AUTH',
            description: 'A password reset was requested for this account.',
            statusCode: 200,
        });
    }
    /**
     * Reset password using token
     */
    async resetPassword(input) {
        const { token, newPassword } = input;
        const tokenHash = hashResetToken(token);
        const dbToken = await this.repo.findResetToken(tokenHash);
        if (!dbToken || dbToken.used || dbToken.expiresAt < new Date()) {
            throw new exceptions_1.BadRequestException('Reset token is invalid or has expired');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        await this.repo.updatePassword(dbToken.userId, passwordHash);
        await this.repo.markResetTokenAsUsed(tokenHash);
        // Terminate all sessions since security details updated
        await this.repo.deleteAllSessions(dbToken.userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map