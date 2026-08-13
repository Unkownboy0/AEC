import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { FinanceController } from './finance.controller';

const router = Router();
router.use(requireAuth);

const financeRoles = requireRole(['ACCOUNTS_STAFF', 'Accounts Staff', 'ACCOUNTANT', 'ACCOUNTS_OFFICER', 'Accounts Officer', 'SUPER_ADMIN', 'COLLEGE_ADMIN']);
const aoRoles = requireRole(['ACCOUNTS_OFFICER', 'Accounts Officer', 'SUPER_ADMIN', 'COLLEGE_ADMIN']);
const monitorRoles = requireRole(['ACCOUNTS_STAFF', 'Accounts Staff', 'ACCOUNTANT', 'ACCOUNTS_OFFICER', 'Accounts Officer', 'PRINCIPAL', 'SUPER_ADMIN', 'COLLEGE_ADMIN']);

router.get('/dashboard', monitorRoles, FinanceController.dashboard);
router.get('/students', financeRoles, FinanceController.students);
router.get('/students/:id', financeRoles, FinanceController.student);
router.post('/payments/offline', financeRoles, FinanceController.collect);
router.get('/transactions', monitorRoles, FinanceController.transactions);
router.get('/reports/transactions.xlsx', monitorRoles, FinanceController.exportExcel);
router.get('/reports/transactions.pdf', monitorRoles, FinanceController.exportPdf);
router.get('/closings/preview', financeRoles, FinanceController.closingPreview);
router.get('/closings', financeRoles, FinanceController.closings);
router.post('/closings/draft', financeRoles, FinanceController.saveClosing);
router.post('/closings/submit', financeRoles, FinanceController.submitClosing);
router.post('/closings/:id/review', aoRoles, FinanceController.reviewClosing);
router.get('/requests', financeRoles, FinanceController.requests);
router.post('/requests', financeRoles, FinanceController.createRequest);
router.post('/requests/:id/review', aoRoles, FinanceController.reviewRequest);
router.get('/reconciliation', aoRoles, FinanceController.reconciliation);
router.patch('/reconciliation/:id', aoRoles, FinanceController.updateReconciliation);
router.get('/audit-logs', aoRoles, FinanceController.auditLogs);

router.post('/vouchers', financeRoles, FinanceController.createVoucher);
router.post('/vouchers/:id/review', aoRoles, FinanceController.reviewVoucher);
router.post('/reversals', aoRoles, FinanceController.createReversal);
router.get('/budgets', monitorRoles, FinanceController.budgets);

export default router;
