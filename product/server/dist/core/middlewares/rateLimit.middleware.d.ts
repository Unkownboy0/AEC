import { Request, Response, NextFunction } from 'express';
export interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
}
export declare const rateLimiter: (options: RateLimitOptions) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const apiRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
