import { Request, Response } from 'express';
import { DelegationService } from './delegation.service';

export class DelegationController {
  static async getPrincipalStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const principalUserId = user.id;
      const result = await DelegationService.getPrincipalStatus(principalUserId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updatePrincipalStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const principalUserId = user.id;
      const { status, delegation } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const result = await DelegationService.updatePrincipalStatus(
        principalUserId,
        { status, delegation },
        ipAddress
      );
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async revokeDelegation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;
      await DelegationService.revokeDelegation(user.id, id, reason);
      return res.json({ success: true, message: 'Delegation revoked successfully' });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getVpActingStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const result = await DelegationService.getVpActingStatus(user.id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async acknowledgeDelegation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { deviceId } = req.body;
      const result = await DelegationService.acknowledgeDelegation(user.id, id, deviceId);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }
}
