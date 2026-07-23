import { Request, Response, NextFunction } from 'express';
export declare class DashboardController {
    getStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCharts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
