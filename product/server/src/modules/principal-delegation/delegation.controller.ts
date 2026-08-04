import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { PrincipalDelegationResolverService } from './principal-delegation-resolver.service';
import { DelegationService } from './delegation.service';
import { HandoverService } from './handover.service';
import { WorkflowService } from '../workflow/workflow.service';

export class DelegationController {
  /**
   * Authoritative single source of truth for Principal status & context.
   * Endpoints: GET /api/principal/status/current, GET /api/principal/availability/context
   */
  static async getCurrentStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const context = await PrincipalDelegationResolverService.resolveStatus(user.id);
      return res.json({ success: true, data: context });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Update Principal status in one transaction.
   * Endpoints: POST /api/principal/status, POST /api/principal/availability
   */
  static async updateStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const context = await DelegationService.updateStatus(user.id, req.body, ipAddress);
      return res.json({ success: true, data: context });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Revoke active delegation.
   */
  static async revokeDelegation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { reason } = req.body;
      const context = await DelegationService.revokeDelegation(user.id, id, reason);
      return res.json({ success: true, data: context });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * VP single source of truth context.
   */
  static async getVpContext(req: Request, res: Response) {
    try {
      const context = await PrincipalDelegationResolverService.resolveStatus();
      const user = (req as any).user;

      // Check if logged in VP is the active acting principal
      const isActingPrincipal =
        context.delegationStatus === 'ACTIVE' &&
        context.actingPrincipalUserId === user.id;

      return res.json({
        success: true,
        data: {
          ...context,
          isActingPrincipal
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * VP acknowledges delegation authority.
   */
  static async acknowledge(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { delegationId, deviceId } = req.body;
      const context = await PrincipalDelegationResolverService.resolveStatus();

      if (!context.delegationId || context.delegationStatus !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          message: 'Acting Principal access is not currently active.'
        });
      }

      const result = await DelegationService.acknowledgeDelegation(
        user.id,
        delegationId || context.delegationId,
        deviceId
      );
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * VP Delegated Approval Center Requests API (guarded by active delegation).
   */
  static async getDelegatedApprovalCenter(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const context = await PrincipalDelegationResolverService.resolveStatus();

      // Guard: Validate active delegation
      if (context.delegationStatus !== 'ACTIVE' || context.actingPrincipalUserId !== user.id) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          message: 'Acting Principal access is not currently active.'
        });
      }

      const workflowService = new WorkflowService();
      const requests = await workflowService.listRequests('Principal', user.departmentId);

      return res.json({
        success: true,
        data: {
          context,
          requests
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * VP Delegated Approve Action.
   */
  static async approveRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { comment } = req.body;

      const context = await PrincipalDelegationResolverService.resolveStatus();
      if (context.delegationStatus !== 'ACTIVE' || context.actingPrincipalUserId !== user.id) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          message: 'Acting Principal access is not currently active.'
        });
      }

      const workflowService = new WorkflowService();
      const result = await workflowService.takeAction(
        id,
        user.email,
        'Vice Principal',
        'APPROVE',
        comment || 'Approved by Vice Principal — Acting Principal'
      );

      // Audit attribution rule
      await (prisma as any).delegationActionLog.create({
        data: {
          delegationId: context.delegationId,
          module: 'APPROVAL',
          recordId: id,
          actionType: 'APPROVED',
          performedByUserId: user.id,
          performedByRole: 'Vice Principal',
          performedAsRole: 'ACTING_PRINCIPAL',
          delegatedByUserId: 'PRINCIPAL',
          newStatus: 'APPROVED_PRINCIPAL',
          remarks: comment || 'Approved by Vice Principal — Acting Principal',
          platform: 'WEB'
        }
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * VP Delegated Reject Action.
   */
  static async rejectRequest(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { comment } = req.body;

      const context = await PrincipalDelegationResolverService.resolveStatus();
      if (context.delegationStatus !== 'ACTIVE' || context.actingPrincipalUserId !== user.id) {
        return res.status(403).json({
          success: false,
          code: 'DELEGATION_INACTIVE',
          message: 'Acting Principal access is not currently active.'
        });
      }

      const workflowService = new WorkflowService();
      const result = await workflowService.takeAction(
        id,
        user.email,
        'Vice Principal',
        'REJECT',
        comment || 'Rejected by Vice Principal — Acting Principal'
      );

      await (prisma as any).delegationActionLog.create({
        data: {
          delegationId: context.delegationId,
          module: 'APPROVAL',
          recordId: id,
          actionType: 'REJECTED',
          performedByUserId: user.id,
          performedByRole: 'Vice Principal',
          performedAsRole: 'ACTING_PRINCIPAL',
          delegatedByUserId: 'PRINCIPAL',
          newStatus: 'REJECTED_PRINCIPAL',
          remarks: comment || 'Rejected by Vice Principal — Acting Principal',
          platform: 'WEB'
        }
      });

      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Get latest handover summary for Principal.
   */
  static async getLatestHandover(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const handover = await HandoverService.getLatestHandover(user.id);
      return res.json({ success: true, data: handover });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Acknowledge a handover.
   */
  static async acknowledgeHandover(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await HandoverService.acknowledgeHandover(id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Get handover history.
   */
  static async getHandoverHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const limit = parseInt(req.query.limit as string) || 10;
      const handovers = await HandoverService.getHandoverHistory(user.id, limit);
      return res.json({ success: true, data: handovers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
