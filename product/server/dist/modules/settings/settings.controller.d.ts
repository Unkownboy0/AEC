import { Request, Response, NextFunction } from 'express';
export declare class SettingsController {
    /**
     * List all settings key-value pairs
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Bulk update key-value pairs
     */
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
