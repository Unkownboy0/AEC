import { Request, Response, NextFunction } from 'express';
export declare class ReportsController {
    getAdmissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getRevenue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getSystem: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    exportReport: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
