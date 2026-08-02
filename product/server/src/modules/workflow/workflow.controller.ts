import { Request, Response, NextFunction } from 'express';
import { WorkflowService } from './workflow.service';
import { auditRequest } from '../../utils/security';

export class WorkflowController {
  private service = new WorkflowService();

  createRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { type, title, reason, startDate, endDate, attachments } = req.body;
      const data = await this.service.createRequest(
        user.email,
        type,
        title,
        reason,
        startDate,
        endDate,
        attachments
      );
      await auditRequest(req, 'CREATE', 'WORKFLOW', `Submitted ${type} request: ${title}`, (data as any)?.id, 'WorkflowRequest');
      res.status(201).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  listRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { status } = req.query;
      const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
      const data = await this.service.listRequests(user.email, roleName, status as string);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  takeAction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { action, comment } = req.body;
      const roleName = typeof user.role === 'object' && user.role !== null ? user.role.name : user.role;
      const data = await this.service.takeAction(id, user.email, roleName, action, comment);
      await auditRequest(req, action.toUpperCase(), 'WORKFLOW', `${action} workflow request: ${comment || 'No comment'}`, id, 'WorkflowRequest');
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  cancelRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const data = await this.service.cancelRequest(id, user.email);
      await auditRequest(req, 'CANCEL', 'WORKFLOW', `Cancelled workflow request`, id, 'WorkflowRequest');
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}
