import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import { parseUserAgent } from '../../utils/uaParser';
import { SecurityHelper, auditLog } from '../../utils/security';
import { getUserPreferences } from '../users/preferences';
import { profileImageDescriptor } from '../users/profile-media.service';
import {
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '../../utils/exceptions';
import { JwtAccessPayload, LoginResult } from './auth.types';
import { resolveUserWorkspaceAccess } from './workspace-access';
import { sendMail } from '../../lib/mailer';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

const durationToMilliseconds = (value: string): number => {
  const match = /^(\d+)(m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`Unsupported token duration: ${value}`);
  const amount = Number(match[1]);
  const unitMs = match[2] === 'm' ? 60_000 : match[2] === 'h' ? 3_600_000 : 86_400_000;
  return amount * unitMs;
};

const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export class AuthService {
  private repo = new AuthRepository();

  /**
   * Login user, create session, log success/failure
   */
  async login(
    input: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult> {
    const email = (input.email || input.identifier || '').trim();
    const { password, rememberMe } = input;
    const ua = parseUserAgent(userAgent);

    const user = await this.repo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email, username, ID, or password');
    }

    if (user.status !== 'ACTIVE') {
      await this.repo.createLoginHistory({
        userId: user.id,
        ipAddress,
        userAgent,
        device: ua.device,
        browser: ua.browser,
        status: 'FAILED',
      });
      throw new ForbiddenException('Your account is currently unavailable. Contact the administrator.');
    }

    // ── Account Lockout Check ──
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.repo.createLoginHistory({
        userId: user.id, ipAddress, userAgent,
        device: ua.device, browser: ua.browser, status: 'FAILED',
      });
      throw new ForbiddenException(
        `Account temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minute(s).`
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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
        await auditLog({
          userId: user.id, userEmail: user.email, userRole: user.role.name,
          action: 'ACCOUNT_LOCKED', module: 'AUTH',
          description: `Account locked after ${MAX_FAILED_ATTEMPTS} failed login attempts for ${LOCKOUT_DURATION_MINUTES} minutes`,
          statusCode: 403, ipAddress, userAgent,
        });
        throw new ForbiddenException(
          `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      throw new UnauthorizedException('Invalid email, username, ID, or password');
    }

    // ── Successful auth: reset lockout counter ──
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.repo.resetFailedAttempts(user.id);
    }

    // Flatten permissions
    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    const refreshLifetime = rememberMe
      ? env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN
      : env.REFRESH_TOKEN_EXPIRES_IN;
    const expiresAt = new Date(Date.now() + durationToMilliseconds(refreshLifetime));

    // Generate token payloads
    const accessPayload: JwtAccessPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(
      { userId: user.id, jti: crypto.randomUUID() },
      env.JWT_SECRET,
      { expiresIn: refreshLifetime as jwt.SignOptions['expiresIn'] }
    );


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

    let menus: any[] = [];
    try {
      menus = await SecurityHelper.getPermittedMenus(permissions, user.role.name);
    } catch {
      menus = [];
    }

    let workspaces: string[] = [user.role.name];
    try {
      const workspaceAccess = await resolveUserWorkspaceAccess(user.id);
      if (workspaceAccess?.workspaces && workspaceAccess.workspaces.length > 0) {
        workspaces = workspaceAccess.workspaces.map((workspace) => workspace.name);
      }
    } catch {
      workspaces = [user.role.name];
    }

    let preferences: any = {};
    try {
      preferences = await getUserPreferences(user.id);
    } catch {
      preferences = { theme: 'system', fontScale: 'default', language: 'en', notificationsEnabled: true };
    }
    const canonicalProfileImage = profileImageDescriptor(user as any);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        profilePhoto: canonicalProfileImage.url,
        profileImage: canonicalProfileImage,
        permissions,
        menus,
        forcePasswordChange: user.forcePasswordChange,
        workspaces,
        preferences,
      },
    };
  }

  /**
   * Issue new access token using valid refresh token
   */
  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // ── Refresh Token Rotation ──
    // On each refresh, old token is invalidated and a new one is issued.
    // If an already-revoked token is used (replay attack), all sessions for that user are terminated.
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET, {
        maxAge: env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN as jwt.VerifyOptions['maxAge'],
      }) as { userId: string };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.repo.findSession(refreshToken);

    if (!session) {
      // Possible replay attack: token was already rotated/deleted
      // Kill ALL sessions for this user as a security measure
      await this.repo.deleteAllSessions(decoded.userId);
      await auditLog({
        userId: decoded.userId,
        action: 'TOKEN_REPLAY_DETECTED', module: 'AUTH',
        description: 'Revoked refresh token reused — all sessions terminated (possible token theft)',
        statusCode: 401, ipAddress, userAgent,
      });
      throw new UnauthorizedException('Session revoked — please log in again');
    }

    if (session.expiresAt < new Date()) {
      await this.repo.deleteSession(refreshToken);
      throw new UnauthorizedException('Session expired');
    }

    const user = await this.repo.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account inactive');
    }

    // Rotate: delete old session, create new one
    await this.repo.deleteSession(refreshToken);

    const remainingMs = Math.min(
      session.expiresAt.getTime() - Date.now(),
      durationToMilliseconds(env.REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN),
    );
    const refreshLifetimeSeconds = Math.max(1, Math.floor(remainingMs / 1000));

    const newRefreshToken = jwt.sign(
      { userId: user.id, jti: crypto.randomUUID() },
      env.JWT_SECRET,
      { expiresIn: refreshLifetimeSeconds }
    );


    const ua = parseUserAgent(userAgent);
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

    const accessPayload: JwtAccessPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  /**
   * Revoke single session
   */
  async logout(refreshToken: string): Promise<void> {
    const session = await this.repo.findSession(refreshToken);
    if (session) {
      await this.repo.deleteSession(refreshToken);
      await this.repo.updateLastLogoutTime(session.userId);
      await this.deactivateDeviceTokens(session.userId);
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await this.repo.deleteAllSessions(userId);
    await this.repo.updateLastLogoutTime(userId);
    await this.deactivateDeviceTokens(userId);
  }

  /**
   * Deactivate this user's push device tokens on logout.
   */
  private async deactivateDeviceTokens(userId: string): Promise<void> {
    try {
      await prisma.deviceToken.updateMany({ where: { userId, active: true }, data: { active: false } });
    } catch (err) {
      logger.warn('[Auth] Failed to deactivate device tokens on logout:', err);
    }
  }

  /**
   * Dynamic Multi-Workspace Context Switcher
   * Swaps active role context without re-authentication
   */
  async switchWorkspace(userId: string, targetRole: string) {
    const user = await this.repo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundException('User account not found');
    }

    const workspaceAccess = await resolveUserWorkspaceAccess(userId);
    const targetWorkspace = workspaceAccess?.workspaces.find((workspace) => workspace.name === targetRole);
    const allowedRoles = workspaceAccess?.workspaces.map((workspace) => workspace.name) || [];

    if (!targetWorkspace) {
      throw new BadRequestException(`Workspace '${targetRole}' is not authorized for your account`);
    }

    const roleName = targetWorkspace.name;
    const permissions = targetWorkspace.permissions;

    // Update activeWorkspace in database
    await prisma.user.update({
      where: { id: userId },
      data: { activeWorkspace: roleName },
    });

    // Issue updated Access Token with activeRole context
    const accessPayload: JwtAccessPayload = {
      id: user.id,
      email: user.email,
      role: roleName,
      permissions,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const menus = await SecurityHelper.getPermittedMenus(permissions, roleName);
    const preferences = await getUserPreferences(user.id);
    const canonicalProfileImage = profileImageDescriptor(user as any);

    return {
      accessToken,
      activeWorkspace: roleName,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleName,
        profilePhoto: canonicalProfileImage.url,
        profileImage: canonicalProfileImage,
        permissions,
        menus,
        workspaces: allowedRoles,
        activeWorkspace: roleName,
        preferences,
      },
    };
  }

  /**
   * Get currently logged-in user profile (full canonical profile data for Web + Android + iOS)
   */
  async getMe(userId: string, activeRole?: string) {
    const user = await this.repo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundException('User profile not found');
    }

    const workspaceAccess = await resolveUserWorkspaceAccess(userId);
    const workspaces = workspaceAccess?.workspaces.map((workspace) => workspace.name) || [user.role.name];
    const activeWorkspace = workspaceAccess?.workspaces.find((workspace) => workspace.name === activeRole)
      || workspaceAccess?.workspaces.find((workspace) => workspace.name === user.role.name);
    const roleName = activeWorkspace?.name || user.role.name;
    const permissions = activeWorkspace?.permissions || user.role.permissions.map((rp) => rp.permission.name);

    let menus: any[] = [];
    try {
      menus = await SecurityHelper.getPermittedMenus(permissions, roleName);
    } catch {
      menus = [];
    }

    // 1. Fetch linked Student record if user is student or has student relation
    let student: any = null;
    try {
      student = await prisma.student.findFirst({
        where: {
          OR: [{ userId }, { email: user.email }],
          deleted: false,
        },
        include: {
          department: true,
          program: true,
          semester: true,
          section: true,
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              phone: true,
            },
          },
        },
      });
    } catch (_) {
      // Ignore
    }

    // 2. Fetch linked Faculty record if user is faculty/staff/leadership
    let faculty: any = null;
    try {
      faculty = await prisma.faculty.findFirst({
        where: {
          OR: [{ userId }, { email: user.email }],
          deleted: false,
        },
        include: { department: true },
      });
    } catch (_) {
      // Ignore
    }

    const canonicalProfileImage = profileImageDescriptor(user as any);
    const profileImageUrl = canonicalProfileImage.url;

    const preferences = await getUserPreferences(userId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      username: (user as any).username || user.email.split('@')[0],
      phone: (user as any).phone || student?.phone || faculty?.phone || null,
      profilePhoto: profileImageUrl,
      profileImage: canonicalProfileImage,
      status: (user as any).status || 'ACTIVE',
      role: roleName,
      roles: workspaces,
      permissions,
      menus,
      forcePasswordChange: user.forcePasswordChange,
      student,
      faculty,
      employee: faculty ? {
        id: faculty.id,
        employeeId: faculty.employeeId,
        designation: faculty.designation || (user as any).designation,
        department: faculty.department,
        departmentId: faculty.departmentId,
        qualification: faculty.highestQualification || (user as any).qualification,
      } : null,
      workspaces,
      preferences,
      primaryWorkspace: workspaces[0] || roleName,
      activeWorkspace: roleName,
    };
  }

  /**
   * Change password for logged-in user
   */
  async changePassword(userId: string, input: any): Promise<void> {
    const { currentPassword, newPassword } = input;
    const user = await this.repo.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(userId, passwordHash);
    
    // Auto logout on all other devices on security credential changes
    await this.repo.deleteAllSessions(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email);

    if (!user) {
      // Keep the externally observable response identical for unknown accounts.
      crypto.randomBytes(32);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_MINUTES * 60_000);

    await this.repo.createPasswordResetToken(user.id, hashResetToken(resetToken), expiresAt);

    const appUrl = (env.PUBLIC_APP_URL || (env.NODE_ENV === 'development' ? 'http://localhost:5173' : '')).replace(/\/+$/, '');
    if (!appUrl) throw new Error('PUBLIC_APP_URL is required to generate password reset links');
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
    const expiresInMinutes = env.PASSWORD_RESET_TOKEN_MINUTES;

    await sendMail({
      to: user.email,
      subject: 'Reset your GEETORUS CAMPUSOS password',
      text: `A password reset was requested for your account. This link expires in ${expiresInMinutes} minutes and can only be used once.\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>A password reset was requested for your account.</p><p><a href="${resetLink}">Reset your password</a></p><p>This link expires in ${expiresInMinutes} minutes and can only be used once.</p><p>If you did not request this, you can ignore this email.</p>`,
    });

    await auditLog({
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
  async resetPassword(input: any): Promise<void> {
    const { token, newPassword } = input;
    const tokenHash = hashResetToken(token);
    const dbToken = await this.repo.findResetToken(tokenHash);

    if (!dbToken || dbToken.used || dbToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(dbToken.userId, passwordHash);
    await this.repo.markResetTokenAsUsed(tokenHash);

    // Terminate all sessions since security details updated
    await this.repo.deleteAllSessions(dbToken.userId);
  }
}
