import { Request, Response, NextFunction } from 'express';
export declare class NotificationsController {
    /**
     * List all notification logs
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create and send/schedule a notification
     */
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete log
     */
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
