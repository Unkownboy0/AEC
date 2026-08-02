import { Request, Response, NextFunction } from 'express';
import { GovernanceService } from './governance.service';

export class GovernanceController {
  static async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const authorId = (req as any).user.id;
      const doc = await GovernanceService.createDocument(authorId, req.body);
      res.status(201).json({ status: 'success', data: doc });
    } catch (error) {
      next(error);
    }
  }

  static async updateState(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { state } = req.body;
      const doc = await GovernanceService.updateState(req.params.id, userId, state);
      res.status(200).json({ status: 'success', data: doc });
    } catch (error) {
      next(error);
    }
  }

  static async signDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const signerId = (req as any).user.id;
      const signerRole = (req as any).user.role;
      const ip = req.ip || req.socket.remoteAddress;
      const signature = await GovernanceService.signDocument(req.params.id, signerId, signerRole, ip);
      res.status(200).json({ status: 'success', data: signature });
    } catch (error) {
      next(error);
    }
  }

  static async verifySignature(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await GovernanceService.verifySignature(req.params.qrToken);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getSopLibrary(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string;
      const items = await GovernanceService.getSopLibrary(category);
      res.status(200).json({ status: 'success', data: items });
    } catch (error) {
      next(error);
    }
  }

  static async createSopItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await GovernanceService.createSopItem(req.body);
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  }
}
