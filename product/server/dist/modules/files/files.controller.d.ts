import { Request, Response, NextFunction } from 'express';
export declare class FilesController {
    private uploadsDir;
    constructor();
    /**
     * List all media files
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Upload file via base64 JSON payload (hardened)
     */
    upload: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete media file
     */
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
