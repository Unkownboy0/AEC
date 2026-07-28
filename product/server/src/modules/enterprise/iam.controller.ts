import { Request, Response, NextFunction } from 'express';
import { IamService } from './iam.service';

const iamService = new IamService();

export class IamController {
  async getMyIAM(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || (req as any).userId;
      const result = await iamService.evaluateRuntimeIAM(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMasterUserDirectory(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, roleId, departmentId, status, page, limit } = req.query;
      const result = await iamService.getMasterUserDirectory({
        query: query as string,
        roleId: roleId as string,
        departmentId: departmentId as string,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getDesignations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await iamService.getDesignations();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createDesignation(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'system';
      const result = await iamService.createDesignation(req.body, adminId);
      res.status(211).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getCommittees(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await iamService.getCommittees();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createCommittee(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'system';
      const result = await iamService.createCommittee(req.body, adminId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async assignUserToCommittee(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'system';
      const { userId, committeeId, roleInCommittee } = req.body;
      const result = await iamService.assignUserToCommittee(userId, committeeId, roleInCommittee, adminId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getDelegations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await iamService.getDelegations();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async createDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'system';
      const result = await iamService.createDelegation(req.body, adminId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async revokeDelegation(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = (req as any).user?.id || 'system';
      const { id } = req.params;
      const result = await iamService.revokeDelegation(id, adminId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
