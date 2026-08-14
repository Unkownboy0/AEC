import { Router } from 'express';
import { HodTimetableController } from './hod-timetable.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

const timetableAuthorGuard = requireRole(['Super Admin', 'College Admin', 'HOD', 'Academic Dean', 'Examination Cell', 'COE']);

// HOD / Coordinator operations
router.get('/faculty-roster', HodTimetableController.getFacultyRoster);
router.get('/master', HodTimetableController.getMasterTimetable);
router.post('/check-conflict', timetableAuthorGuard, HodTimetableController.checkConflict);
router.post('/upload-parse', timetableAuthorGuard, HodTimetableController.uploadAndParse);
router.post('/correct-row', timetableAuthorGuard, HodTimetableController.correctImportRow);
router.post('/save-draft', timetableAuthorGuard, HodTimetableController.saveBatchAsDraft);
router.get('/compare-revisions', HodTimetableController.compareRevisions);
router.post('/publish-revision', timetableAuthorGuard, HodTimetableController.publishRevision);
router.get('/workload', HodTimetableController.getWorkload);
router.get('/official-print', HodTimetableController.getFacultyPrintData);

// Faculty Issue Reporting
router.post('/report-issue', HodTimetableController.reportIssue);
router.post('/resolve-issue', timetableAuthorGuard, HodTimetableController.resolveIssue);

export default router;
