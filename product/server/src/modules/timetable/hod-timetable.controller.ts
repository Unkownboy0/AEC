import { Request, Response } from 'express';
import { HodTimetableService } from './hod-timetable.service';
import { logger } from '../../utils/logger';

export class HodTimetableController {
  static async getFacultyRoster(req: Request, res: Response) {
    try {
      const departmentId = (req.query.departmentId as string) || (req.user as any)?.departmentId;
      if (!departmentId) {
        return res.status(400).json({ status: 'error', message: 'departmentId is required' });
      }
      const data = await HodTimetableService.getDepartmentFacultyRoster(departmentId);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.getFacultyRoster] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch faculty roster' });
    }
  }

  static async getMasterTimetable(req: Request, res: Response) {
    try {
      const departmentId = (req.query.departmentId as string) || (req.user as any)?.departmentId;
      if (!departmentId) {
        return res.status(400).json({ status: 'error', message: 'departmentId is required' });
      }
      const data = await HodTimetableService.getDepartmentMasterTimetable({
        departmentId,
        academicYearId: req.query.academicYearId as string,
        semesterId: req.query.semesterId as string,
        revisionId: req.query.revisionId as string,
      });
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.getMasterTimetable] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to fetch master timetable' });
    }
  }

  static async checkConflict(req: Request, res: Response) {
    try {
      const { facultyId, departmentId, semesterId, sectionId, dayOfWeek, slotIndex, roomNo, excludeSlotId, revisionId } = req.body;
      const data = await HodTimetableService.checkSlotConflicts({
        facultyId,
        departmentId: departmentId || (req.user as any)?.departmentId,
        semesterId,
        sectionId,
        dayOfWeek,
        slotIndex: Number(slotIndex),
        roomNo,
        excludeSlotId,
        revisionId,
      });
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.checkConflict] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to check conflicts' });
    }
  }

  static async uploadAndParse(req: Request, res: Response) {
    try {
      const { rawRows, sourceFileName, departmentId, academicYearId, semesterId, customMapping } = req.body;
      const userId = (req.user as any)?.id || 'hod-user';
      const targetDeptId = departmentId || (req.user as any)?.departmentId;

      if (!rawRows || !Array.isArray(rawRows)) {
        return res.status(400).json({ status: 'error', message: 'rawRows array is required' });
      }

      const data = await HodTimetableService.parseAndMapTimetable({
        rawRows,
        sourceFileName: sourceFileName || 'uploaded_timetable.xlsx',
        departmentId: targetDeptId,
        academicYearId: academicYearId || '2026-2027',
        semesterId: semesterId || 'default-sem',
        uploadedById: userId,
        customMapping,
      });

      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.uploadAndParse] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to parse timetable file' });
    }
  }

  static async correctImportRow(req: Request, res: Response) {
    try {
      const { batchId, rowIndex, corrections } = req.body;
      const data = await HodTimetableService.correctImportRowAndRevalidate(batchId, Number(rowIndex), corrections);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.correctImportRow] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to correct import row' });
    }
  }

  static async saveBatchAsDraft(req: Request, res: Response) {
    try {
      const { batchId } = req.body;
      const userId = (req.user as any)?.id || 'hod-user';
      const data = await HodTimetableService.saveImportBatchAsDraft(batchId, userId);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.saveBatchAsDraft] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to save draft timetable' });
    }
  }

  static async compareRevisions(req: Request, res: Response) {
    try {
      const { oldRevisionId, newRevisionId } = req.query;
      if (!oldRevisionId || !newRevisionId) {
        return res.status(400).json({ status: 'error', message: 'oldRevisionId and newRevisionId are required' });
      }
      const data = await HodTimetableService.compareTimetables(oldRevisionId as string, newRevisionId as string);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.compareRevisions] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to compare timetable revisions' });
    }
  }

  static async publishRevision(req: Request, res: Response) {
    try {
      const { revisionId, effectiveFrom, changeSummary } = req.body;
      const userId = (req.user as any)?.id || 'hod-user';
      if (!revisionId || !effectiveFrom) {
        return res.status(400).json({ status: 'error', message: 'revisionId and effectiveFrom date are required' });
      }
      const data = await HodTimetableService.publishTimetableRevision({
        revisionId,
        effectiveFrom: new Date(effectiveFrom),
        changeSummary,
        publishedById: userId,
      });
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.publishRevision] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to publish timetable revision' });
    }
  }

  static async getWorkload(req: Request, res: Response) {
    try {
      const facultyId = (req.query.facultyId as string) || (req.user as any)?.facultyId;
      if (!facultyId) {
        return res.status(400).json({ status: 'error', message: 'facultyId is required' });
      }
      const data = await HodTimetableService.calculateFacultyWorkload(facultyId, req.query.revisionId as string);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.getWorkload] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to calculate faculty workload' });
    }
  }

  static async getFacultyPrintData(req: Request, res: Response) {
    try {
      const facultyId = (req.query.facultyId as string) || (req.user as any)?.facultyId;
      if (!facultyId) {
        return res.status(400).json({ status: 'error', message: 'facultyId is required' });
      }
      const data = await HodTimetableService.getOfficialFacultyPrintData(facultyId, req.query.revisionId as string);
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.getFacultyPrintData] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to generate official faculty print data' });
    }
  }

  static async reportIssue(req: Request, res: Response) {
    try {
      const { facultyId, departmentId, timetableSlotId, category, description } = req.body;
      const targetFacultyId = facultyId || (req.user as any)?.facultyId;
      const targetDeptId = departmentId || (req.user as any)?.departmentId;
      const data = await HodTimetableService.reportTimetableIssue({
        facultyId: targetFacultyId,
        departmentId: targetDeptId,
        timetableSlotId,
        category,
        description,
      });
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.reportIssue] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to submit timetable issue report' });
    }
  }

  static async resolveIssue(req: Request, res: Response) {
    try {
      const { issueId, resolutionNotes, action } = req.body;
      const userId = (req.user as any)?.id || 'hod-user';
      const data = await HodTimetableService.resolveTimetableIssue({
        issueId,
        resolvedById: userId,
        resolutionNotes,
        action: action || 'RESOLVED',
      });
      return res.json({ status: 'success', data });
    } catch (err: any) {
      logger.error('[HodTimetableController.resolveIssue] error:', err);
      return res.status(500).json({ status: 'error', message: err.message || 'Failed to resolve timetable issue' });
    }
  }
}
