import { Request, Response, NextFunction } from 'express';
export declare class UsersController {
    private service;
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    import: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getDirectoryStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    generateCredentials: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    assignSubjects: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    assignMentor: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    regenerateUserCredentials: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    unlockUserAccount: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
