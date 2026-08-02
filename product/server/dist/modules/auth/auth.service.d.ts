import { LoginResult } from './auth.types';
export declare class AuthService {
    private repo;
    /**
     * Login user, create session, log success/failure
     */
    login(input: any, ipAddress?: string, userAgent?: string): Promise<LoginResult>;
    /**
     * Issue new access token using valid refresh token
     */
    refresh(refreshToken: string, ipAddress?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Revoke single session
     */
    logout(refreshToken: string): Promise<void>;
    /**
     * Revoke all sessions for a user
     */
    logoutAll(userId: string): Promise<void>;
    /**
     * Get currently logged-in user profile (full — includes faculty/department for HOD/Faculty roles)
     */
    getMe(userId: string, activeRole?: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: any;
        profilePhoto: string | null;
        status: any;
        role: string;
        permissions: string[];
        menus: any[];
        forcePasswordChange: boolean;
        faculty: any;
        workspaces: string[];
    }>;
    /**
     * Change password for logged-in user
     */
    changePassword(userId: string, input: any): Promise<void>;
    /**
     * Forgot password: create reset token and mock mail log
     */
    forgotPassword(email: string): Promise<{
        resetToken: string;
    }>;
    /**
     * Reset password using token
     */
    resetPassword(input: any): Promise<void>;
}
