import { Request, Response, NextFunction } from 'express';
export declare class DepartmentsController {
    private service;
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    get: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    restore: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    bulkDelete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    bulkArchive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    import: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
