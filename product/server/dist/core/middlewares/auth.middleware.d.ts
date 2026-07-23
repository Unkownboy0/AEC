import { Request, Response, NextFunction } from 'express';
export interface UserPayload {
    id: string;
    email: string;
    role: string;
    permissions: string[];
}
declare global {
    namespace Express {
        interface Request {
            user?: UserPayload;
        }
    }
}
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const checkPermission: (userPermissions: string[], required: string) => boolean;
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
