import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRepository } from './auth.repository';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { parseUserAgent } from '../../utils/uaParser';
import { SecurityHelper, auditLog } from '../../utils/security';
import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '../../utils/exceptions';
import { JwtAccessPayload, LoginResult } from './auth.types';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

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
    const { email, password, rememberMe } = input;
    const ua = parseUserAgent(userAgent);

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
      throw new UnauthorizedException('Invalid email or password');
    }

    // ── Account Lockout Check ──
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.repo.createLoginHistory({
        userId: user.id, ipAddress, userAgent,
        device: ua.device, browser: ua.browser, status: 'FAILED',
      });
      throw new UnauthorizedException(
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
          statusCode: 401, ipAddress, userAgent,
        });
        throw new UnauthorizedException(
          `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // ── Successful auth: reset lockout counter ──
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.repo.resetFailedAttempts(user.id);
    }

    // Flatten permissions
    const permissions = user.role.permissions.map((rp) => rp.permission.name);

    // Create session duration (Permanent login: 3650 days / 10 years)
    const sessionDays = 3650;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + sessionDays);

    // Generate token payloads
    const accessPayload: JwtAccessPayload = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
      expiresIn: '3650d',
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_SECRET,
      { expiresIn: '3650d' }
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

    const menus = await SecurityHelper.getPermittedMenus(permissions, user.role.name);

    const workspaces = [user.role.name];

    // Query UserWorkspace relational table
    const dbWorkspaces = await prisma.userWorkspace.findMany({
      where: { userId: user.id, status: 'ACTIVE' }
    });
    dbWorkspaces.forEach(w => {
      if (!workspaces.includes(w.roleName)) workspaces.push(w.roleName);
    });

    // Check assigned secondary roles in UserRole
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });
    userRoles.forEach(ur => {
      if (ur.role && !workspaces.includes(ur.role.name)) {
        workspaces.push(ur.role.name);
      }
    });

    // Role hierarchy workspace derivations
    if (['HOD', 'Head of Department'].includes(user.role.name)) {
      if (!workspaces.includes('HOD')) workspaces.push('HOD');
      if (!workspaces.includes('Faculty')) workspaces.push('Faculty');
    }
    if (['Faculty', 'Mentor'].includes(user.role.name)) {
      if (!workspaces.includes('Faculty')) workspaces.push('Faculty');
      if (!workspaces.includes('Mentor')) workspaces.push('Mentor');
    }
    if (['Academic Dean', 'Admission Dean', 'IQAC Dean', 'Examination Cell'].includes(user.role.name)) {
      if (!workspaces.includes('Faculty')) workspaces.push('Faculty');
    }

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
  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // ── Refresh Token Rotation ──
    // On each refresh, old token is invalidated and a new one is issued.
    // If an already-revoked token is used (replay attack), all sessions for that user are terminated.
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET) as { userId: string };
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

    const remainingMs = session.expiresAt.getTime() - Date.now();
    const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_SECRET,
      { expiresIn: '3650d' }
    );

    const ua = parseUserAgent(userAgent);
    const newExpiresAt = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);
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
      expiresIn: '3650d',
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
    }
  }

  /**
   * Revoke all sessions for a user
   */
  async logoutAll(userId: string): Promise<void> {
    await this.repo.deleteAllSessions(userId);
    await this.repo.updateLastLogoutTime(userId);
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

    // Determine allowed workspaces for this user
    const allowedRoles = [user.role.name];
    
    // Query UserWorkspace relational table
    const dbWorkspaces = await prisma.userWorkspace.findMany({
      where: { userId, status: 'ACTIVE' }
    });
    dbWorkspaces.forEach(w => {
      if (!allowedRoles.includes(w.roleName)) allowedRoles.push(w.roleName);
    });

    if (['HOD', 'Head of Department'].includes(user.role.name)) {
      if (!allowedRoles.includes('HOD')) allowedRoles.push('HOD');
      if (!allowedRoles.includes('Faculty')) allowedRoles.push('Faculty');
    }
    if (['Faculty', 'Mentor'].includes(user.role.name)) {
      if (!allowedRoles.includes('Faculty')) allowedRoles.push('Faculty');
      if (!allowedRoles.includes('Mentor')) allowedRoles.push('Mentor');
    }
    if (['Academic Dean', 'Admission Dean', 'IQAC Dean', 'Examination Cell'].includes(user.role.name)) {
      if (!allowedRoles.includes('Faculty')) allowedRoles.push('Faculty');
    }

    // Also check assigned secondary roles in UserRole
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    userRoles.forEach(ur => {
      if (ur.role && !allowedRoles.includes(ur.role.name)) {
        allowedRoles.push(ur.role.name);
      }
    });

    if (!allowedRoles.includes(targetRole)) {
      throw new BadRequestException(`Workspace '${targetRole}' is not authorized for your account`);
    }

    // Fetch target role definition and permissions
    const roleData = await prisma.role.findFirst({
      where: { name: targetRole },
      include: { permissions: { include: { permission: true } } }
    });

    const roleName = roleData ? roleData.name : targetRole;
    const permissions = roleData ? roleData.permissions.map(p => p.permission.name) : user.role.permissions.map(rp => rp.permission.name);

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
      expiresIn: '3650d',
    });

    const menus = await SecurityHelper.getPermittedMenus(permissions, roleName);

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
  async getMe(userId: string, activeRole?: string) {
    const user = await this.repo.findById(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundException('User profile not found');
    }

    let roleName = user.role.name;
    let permissions = user.role.permissions.map((rp) => rp.permission.name);

    if (activeRole && activeRole !== user.role.name) {
      const allowedRoles = [user.role.name];
      const dbWorkspaces = await prisma.userWorkspace.findMany({
        where: { userId, status: 'ACTIVE' }
      });
      dbWorkspaces.forEach(w => {
        if (!allowedRoles.includes(w.roleName)) allowedRoles.push(w.roleName);
      });

      if (['Faculty', 'HOD', 'Academic Dean', 'Vice Principal', 'Principal', 'Admission Dean', 'IQAC Dean'].includes(user.role.name)) {
        allowedRoles.push('Faculty', 'Mentor');
      }

      if (allowedRoles.includes(activeRole)) {
        const roleData = await prisma.role.findFirst({
          where: { name: activeRole },
          include: { permissions: { include: { permission: true } } }
        });
        if (roleData) {
          roleName = roleData.name;
          permissions = roleData.permissions.map(p => p.permission.name);
        }
      }
    }

    const menus = await SecurityHelper.getPermittedMenus(permissions, roleName);

    // Fetch faculty record with department
    let faculty: any = null;
    try {
      faculty = await prisma.faculty.findFirst({
        where: { userId },
        include: { department: true },
      });
    } catch (_) {
      // Silently ignore
    }

    // Resolve workspaces from UserWorkspace table
    const dbWorkspaces = await prisma.userWorkspace.findMany({
      where: { userId, status: 'ACTIVE' }
    });
    
    const workspacesSet = new Set<string>();
    workspacesSet.add(user.role.name);
    dbWorkspaces.forEach(w => workspacesSet.add(w.roleName));

    if (user.role.name === 'Admission Dean') {
      workspacesSet.add('Admission Dean');
      workspacesSet.add('Faculty');
      workspacesSet.add('Administration');
    } else if (user.role.name === 'Academic Dean') {
      workspacesSet.add('Academic Dean');
      workspacesSet.add('Faculty');
    } else if (user.role.name === 'IQAC Dean') {
      workspacesSet.add('IQAC Dean');
      workspacesSet.add('Faculty');
    } else if (user.role.name === 'Vice Principal') {
      workspacesSet.add('Vice Principal');
      workspacesSet.add('Faculty');
    } else if (user.role.name === 'HOD') {
      workspacesSet.add('HOD');
      workspacesSet.add('Faculty');
    } else if (user.role.name === 'Faculty') {
      workspacesSet.add('Faculty');
      workspacesSet.add('Mentor');
    }

    const workspaces = Array.from(workspacesSet);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: (user as any).phone,
      profilePhoto: user.profilePhoto,
      status: (user as any).status,
      role: roleName,
      permissions,
      menus,
      forcePasswordChange: user.forcePasswordChange,
      faculty,
      workspaces,
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

  /**
   * Forgot password: create reset token and mock mail log
   */
  async forgotPassword(email: string): Promise<{ resetToken: string }> {
    const user = await this.repo.findByEmail(email);

    if (!user) {
      // Standard security best practice: do not leak if user exists or not.
      // We generate a dummy response for external observers, but internally we do not write DB rows.
      return { resetToken: 'mock-token-dispatched' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour token validity

    await this.repo.createPasswordResetToken(user.id, resetToken, expiresAt);

    console.log(`✉️ [SMTP MOCK] Password reset link sent to ${email}: http://localhost:5173/reset-password?token=${resetToken}`);

    return { resetToken };
  }

  /**
   * Reset password using token
   */
  async resetPassword(input: any): Promise<void> {
    const { token, newPassword } = input;
    const dbToken = await this.repo.findResetToken(token);

    if (!dbToken || dbToken.used || dbToken.expiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.updatePassword(dbToken.userId, passwordHash);
    await this.repo.markResetTokenAsUsed(token);

    // Terminate all sessions since security details updated
    await this.repo.deleteAllSessions(dbToken.userId);
  }
}
