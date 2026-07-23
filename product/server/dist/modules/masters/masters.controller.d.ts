import { Request, Response, NextFunction } from 'express';
export declare class MastersController {
    /**
     * List records by type
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create master record
     */
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete master record
     */
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
