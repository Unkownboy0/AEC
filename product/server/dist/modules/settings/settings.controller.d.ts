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
    /**
     * Get Principal Availability Status (ONLINE / OFFLINE)
     */
    getPrincipalAvailability: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Set Principal Availability Status (ONLINE / OFFLINE)
     */
    setPrincipalAvailability: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
