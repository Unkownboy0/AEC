import { Router } from 'express';
import { IntegrationChainController } from './integration-chain.controller';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

const adminGuard = requireRole(['Super Admin', 'College Admin', 'Principal', 'HOD', 'Office Admin']);

// Chain 1: Admission → Student Master → User → Parent → Fees → Digital ID
router.post('/admission-to-student', adminGuard, IntegrationChainController.runAdmissionToStudentChain);

// Chain 2: Timetable → Attendance → Leave Override
router.post('/timetable-attendance', IntegrationChainController.runTimetableAttendanceChain);

// Chain 3: Payment → Fee → Ledger → Accounts → Receipt → Parent Alert
router.post('/payment-reconciliation', IntegrationChainController.runPaymentReconciliationChain);

// Chain 4: Leave/OD → Workflow → Approver → Availability → Calendar
router.post('/leave-workflow', IntegrationChainController.runLeaveWorkflowChain);

// Chain 5: Evidence → Profile → Appraisal → IQAC Repository
router.post('/evidence-appraisal', IntegrationChainController.runEvidenceAppraisalChain);

// Chain 6: Grievance → Responsible Unit → SLA → Maintenance Ticket
router.post('/grievance-escalation', IntegrationChainController.runGrievanceEscalationChain);

// Chain 7: Meeting → Minutes → Action Item → Task → Calendar → Notification
router.post('/meeting-action-items', IntegrationChainController.runMeetingActionItemChain);

export default router;
