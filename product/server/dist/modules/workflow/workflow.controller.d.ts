import { Request, Response, NextFunction } from 'express';
export declare class WorkflowController {
    private service;
    createRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    takeAction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cancelRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
