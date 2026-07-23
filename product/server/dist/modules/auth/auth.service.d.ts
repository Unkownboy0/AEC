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
    refresh(refreshToken: string): Promise<{
        accessToken: string;
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
     * Get currently logged-in user profile
     */
    getMe(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        profilePhoto: string | null;
        permissions: string[];
        menus: any[];
        forcePasswordChange: boolean;
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
