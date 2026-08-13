import { Request, Response, NextFunction } from 'express';
import { IntegrationChainService } from './integration-chain.service';

const service = new IntegrationChainService();

export class IntegrationChainController {
  // Chain 1: Admission → Student Master → User → Parent → Fees → Digital ID
  static async runAdmissionToStudentChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeAdmissionToStudentChain(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 2: Timetable → Attendance → Leave Override
  static async runTimetableAttendanceChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeTimetableAttendanceChain({
        ...req.body,
        recordedByUserId: (req as any).user?.id,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 3: Payment → Fee → Ledger → Accounts → Receipt → Parent Alert
  static async runPaymentReconciliationChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executePaymentReconciliationChain({
        ...req.body,
        payerUserId: (req as any).user?.id,
      });
      res.status(201).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 4: Leave/OD → Workflow → Approver → Availability → Calendar
  static async runLeaveWorkflowChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeLeaveWorkflowChain({
        ...req.body,
        approverUserId: (req as any).user?.id,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 5: Evidence → Profile → Appraisal → IQAC Repository
  static async runEvidenceAppraisalChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeEvidenceAppraisalChain(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 6: Grievance → Responsible Unit → SLA → Maintenance Ticket
  static async runGrievanceEscalationChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeGrievanceEscalationChain(req.body);
      res.status(200).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }

  // Chain 7: Meeting → Minutes → Action Item → Task → Calendar → Notification
  static async runMeetingActionItemChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.executeMeetingActionItemChain({
        ...req.body,
        createdById: (req as any).user?.id,
      });
      res.status(201).json({ status: 'success', data: result });
    } catch (e) { next(e); }
  }
}
