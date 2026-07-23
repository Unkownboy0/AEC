import { Request, Response, NextFunction } from 'express';
export declare class BackupController {
    private backupsDir;
    constructor();
    /**
     * List all backup logs
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Trigger database backup manually
     */
    trigger: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Download a backup file
     */
    download: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Simulate a database restore
     */
    restore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
