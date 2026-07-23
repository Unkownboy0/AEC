import { Request, Response, NextFunction } from 'express';
export declare class RolesController {
    private service;
    /**
     * List roles
     */
    list: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get single role details
     */
    getRole: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create role
     */
    create: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update role
     */
    update: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Delete role
     */
    delete: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Clone permissions from one role to a new role
     */
    clone: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get Role Permission Matrix Grid
     */
    getMatrix: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Update permissions matrix for a role
     */
    updateMatrix: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get all permissions flat list
     */
    getPermissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Sync permission list for a role
     */
    updatePermissions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Get users assigned to a role
     */
    getUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Add users to a role
     */
    addUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Remove a user from a role
     */
    removeUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Templates endpoints
     */
    listTemplates: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    createTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    applyTemplate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
