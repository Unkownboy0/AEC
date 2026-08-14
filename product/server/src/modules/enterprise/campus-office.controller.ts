import { Request, Response } from 'express';
import { CampusOfficeService } from './campus-office.service';
import { CrossDepartmentService } from './cross-department.service';
import { FacultyAvailabilityService } from './faculty-availability.service';
import { FacultyLeaveService } from '../faculty-leave/faculty-leave.service';

export class CampusOfficeController {
  // ── Campus Office Documents ──
  static async getTemplates(req: Request, res: Response) {
    try {
      const templates = CampusOfficeService.getStandardTemplates();
      return res.json({ success: true, data: templates });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async listUserDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      const type = req.query.type as string;
      const docs = await CampusOfficeService.getUserOfficeDocuments(userId, type);
      return res.json({ success: true, data: docs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createDocument(req: Request, res: Response) {
    try {
      const authorId = (req as any).user?.id || req.body.authorId;
      const doc = await CampusOfficeService.createDocument(authorId, req.body);
      return res.status(201).json({ success: true, data: doc });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateDocument(req: Request, res: Response) {
    try {
      const documentId = req.params.id;
      const authorId = (req as any).user?.id || req.body.authorId;
      const doc = await CampusOfficeService.updateDocument(documentId, authorId, req.body);
      return res.json({ success: true, data: doc });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async submitForReview(req: Request, res: Response) {
    try {
      const documentId = req.params.id;
      const authorId = (req as any).user?.id || req.body.authorId;
      const doc = await CampusOfficeService.submitDocumentForReview(documentId, authorId, req.body);
      return res.json({ success: true, data: doc });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async reviewDocument(req: Request, res: Response) {
    try {
      const documentId = req.params.id;
      const reviewerId = (req as any).user?.id || req.body.reviewerId;
      const doc = await CampusOfficeService.reviewDocument(documentId, reviewerId, req.body);
      return res.json({ success: true, data: doc });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── Forms Engine ──
  static async submitFormResponse(req: Request, res: Response) {
    try {
      const formId = req.params.id;
      const resp = await CampusOfficeService.submitFormResponse(formId, req.body);
      return res.status(201).json({ success: true, data: resp });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getFormResponses(req: Request, res: Response) {
    try {
      const formId = req.params.id;
      const data = await CampusOfficeService.getFormResponses(formId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── Campus Drive ──
  static async getDriveItems(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || req.query.userId as string;
      const scope = (req.query.scope as string) || 'PERSONAL';
      const deptId = req.query.departmentId as string;
      const items = await CampusOfficeService.getDriveItems(userId, scope, deptId);
      return res.json({ success: true, data: items });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createDriveItem(req: Request, res: Response) {
    try {
      const ownerId = (req as any).user?.id || req.body.ownerId;
      const item = await CampusOfficeService.createDriveItem(ownerId, req.body);
      return res.status(201).json({ success: true, data: item });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // ── Cross Department & Availability ──
  static async getFacultyWorkload(req: Request, res: Response) {
    try {
      const facultyId = req.params.facultyId;
      const data = await CrossDepartmentService.calculateFacultyWorkload(facultyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getDepartmentRoster(req: Request, res: Response) {
    try {
      const departmentId = req.params.departmentId;
      const data = await CrossDepartmentService.getDepartmentFacultyRoster(departmentId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async requestCrossAssignment(req: Request, res: Response) {
    try {
      const assignerId = (req as any).user?.id || req.body.requestedById;
      const assignment = await CrossDepartmentService.requestTeachingAssignment({
        ...req.body,
        requestedById: assignerId,
      });
      return res.status(201).json({ success: true, data: assignment });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async proposeTransfer(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const transfer = await CrossDepartmentService.proposeDepartmentTransfer({
        ...req.body,
        initiatedById: user?.id || req.body.initiatedById,
        initiatedByName: user ? `${user.firstName} ${user.lastName}` : 'Administrator',
      });
      return res.status(201).json({ success: true, data: transfer });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async processTransferStep(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const transfer = await CrossDepartmentService.processTransferStep({
        transferId: req.params.id,
        action: req.body.action,
        approverId: user?.id || req.body.approverId,
        approverName: user ? `${user.firstName} ${user.lastName}` : req.body.approverName,
        approverRole: user?.role?.name || req.body.approverRole,
        comments: req.body.comments,
      });
      return res.json({ success: true, data: transfer });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async findFreeFaculty(req: Request, res: Response) {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const period = Number(req.query.periodNumber) || 1;
      const deptId = req.query.departmentId as string;
      const subjectId = req.query.subjectId as string;
      const data = await FacultyAvailabilityService.findAvailableFaculty({
        date,
        periodNumber: period,
        departmentId: deptId,
        subjectId,
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getCampusAvailabilityBoard(req: Request, res: Response) {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const deptId = req.query.departmentId as string;
      const data = await FacultyAvailabilityService.getCampusAvailabilityBoard({
        date,
        departmentId: deptId,
      });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAffectedPeriods(req: Request, res: Response) {
    try {
      const facultyId = req.params.facultyId;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const data = await FacultyLeaveService.detectAffectedTimetablePeriods(facultyId, startDate, endDate);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getLeaveBalances(req: Request, res: Response) {
    try {
      const facultyId = req.params.facultyId;
      const data = await FacultyLeaveService.getFacultyLeaveBalances(facultyId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
