import { Router } from 'express';
import { IntegrationChainController } from './integration-chain.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const adminGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'HOD', 'Office Admin']);

// Chain 1: Admission → Student Master → User → Parent → Fees → Digital ID
router.post('/admission-to-student', adminGuard, IntegrationChainController.runAdmissionToStudentChain);

// Chains 2-7 had no guard at all despite triggering system-wide batch
// reprocessing (payment reconciliation, leave workflow re-sync, etc.) —
// only Chain 1 had `adminGuard` applied. Any authenticated user, including
// Student, could trigger them (confirmed live: 500 crash from an empty
// payload reaching the handler, not a 403).

// Chain 2: Timetable → Attendance → Leave Override
router.post('/timetable-attendance', adminGuard, IntegrationChainController.runTimetableAttendanceChain);

// Chain 3: Payment → Fee → Ledger → Accounts → Receipt → Parent Alert
router.post('/payment-reconciliation', adminGuard, IntegrationChainController.runPaymentReconciliationChain);

// Chain 4: Leave/OD → Workflow → Approver → Availability → Calendar
router.post('/leave-workflow', adminGuard, IntegrationChainController.runLeaveWorkflowChain);

// Chain 5: Evidence → Profile → Appraisal → IQAC Repository
router.post('/evidence-appraisal', adminGuard, IntegrationChainController.runEvidenceAppraisalChain);

// Chain 6: Grievance → Responsible Unit → SLA → Maintenance Ticket
router.post('/grievance-escalation', adminGuard, IntegrationChainController.runGrievanceEscalationChain);

// Chain 7: Meeting → Minutes → Action Item → Task → Calendar → Notification
router.post('/meeting-action-items', adminGuard, IntegrationChainController.runMeetingActionItemChain);

export default router;
