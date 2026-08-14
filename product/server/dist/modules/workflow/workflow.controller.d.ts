import { Request, Response, NextFunction } from 'express';
export declare class WorkflowController {
    private service;
    createRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listRequests: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    takeAction: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cancelRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    listDefinitions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDefinition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createOrUpdateDefinition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    toggleDefinitionActive: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
