import { Request, Response, NextFunction } from 'express';
export declare class BackupController {
    private backupsDir;
    private postgresEnvironment;
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
    /** Validate that pg_restore can read the archive. An actual restore is an
     * offline runbook operation and is never performed against the live DB here. */
    restore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
