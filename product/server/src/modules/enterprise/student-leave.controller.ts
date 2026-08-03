import { Request, Response, NextFunction } from 'express';
import { StudentLeaveService } from './student-leave.service';

const service = new StudentLeaveService();

export class StudentLeaveController {
  /**
   * Student Submits Leave/OD Request
   */
  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await service.submitRequest(userId, req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Student Views Own Requests
   */
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getStudentRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Details of Single Request
   */
  async getRequestDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const details = await service.getRequestDetails(id);
      res.status(200).json({ status: 'success', data: details });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mentor Level 1 Pending List
   */
  async getMentorPending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getMentorPendingRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Mentor Level 1 Action (Approve / Reject / Return)
   */
  async mentorReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];

      const actionDecision = decision === 'APPROVE' || req.path.includes('approve')
        ? 'APPROVE'
        : decision === 'RETURN' || req.path.includes('return')
        ? 'RETURN'
        : 'REJECT';

      const result = await service.mentorReview(userId, id, actionDecision, remarks, ipAddress, deviceInfo);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HOD Level 2 Requests List (Filterable by status)
   */
  async getHodRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const filterStatus = req.query.status as string | undefined;
      const list = await service.getHodRequests(userId, filterStatus);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HOD Level 2 Pending List
   */
  async getHodPending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const list = await service.getHodPendingRequests(userId);
      res.status(200).json({ status: 'success', data: list });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HOD Level 2 Action (Approve / Reject / Return to Mentor / Return to Student / Escalate)
   */
  async hodReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { decision, action, remarks } = req.body;
      const ipAddress = req.ip;
      const deviceInfo = req.headers['user-agent'];

      let act: 'APPROVE' | 'REJECT' | 'RETURN_MENTOR' | 'RETURN_STUDENT' | 'ESCALATE' = 'APPROVE';

      if (req.path.includes('return-to-mentor') || decision === 'RETURN_MENTOR' || action === 'RETURN_MENTOR') {
        act = 'RETURN_MENTOR';
      } else if (req.path.includes('return-to-student') || decision === 'RETURN_STUDENT' || action === 'RETURN_STUDENT') {
        act = 'RETURN_STUDENT';
      } else if (req.path.includes('escalate') || decision === 'ESCALATE' || action === 'ESCALATE') {
        act = 'ESCALATE';
      } else if (req.path.includes('reject') || decision === 'REJECT' || action === 'REJECT') {
        act = 'REJECT';
      } else {
        act = 'APPROVE';
      }

      const result = await service.hodReview(userId, id, act, remarks, ipAddress, deviceInfo);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HOD Bulk Approve (Legacy redirect stub)
   */
  async bulkApproveHod(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ status: 'success', message: 'Use /api/hod/leave-od/bulk-approve' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * HOD Bulk Reject (Legacy redirect stub)
   */
  async bulkRejectHod(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ status: 'success', message: 'Use /api/hod/leave-od/bulk-reject' });
    } catch (err) {
      next(err);
    }
  }
}
