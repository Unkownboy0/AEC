import { Request, Response, NextFunction } from 'express';
export declare class SecurityController {
    /**
     * Get activity audit logs
     */
    getAudits: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get login history logs
     */
    getLogins: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get active concurrent sessions
     */
    getSessions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Revoke session and block user account
     */
    blockUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Unblock user account
     */
    unblockUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
