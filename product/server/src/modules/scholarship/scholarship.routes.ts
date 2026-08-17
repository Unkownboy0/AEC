import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const scholarshipGuard = requireRole(['Scholarship Officer', 'Finance Officer', 'Super Admin', 'College Admin', 'Principal', 'Student Welfare Dean']);

// Schemes
router.get('/schemes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, provider } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;
    const schemes = await prisma.scholarshipScheme.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: schemes });
  } catch (e) { next(e); }
});

router.post('/schemes', scholarshipGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scheme = await prisma.scholarshipScheme.create({ data: { ...req.body, eligibility: JSON.stringify(req.body.eligibility || {}), documents: JSON.stringify(req.body.documents || []), startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, endDate: req.body.endDate ? new Date(req.body.endDate) : undefined } });
    res.status(201).json({ status: 'success', data: scheme });
  } catch (e) { next(e); }
});

// Student application
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

    const app = await prisma.scholarshipApplication2.create({ data: { schemeId: req.body.schemeId, studentId: student.id, academicYear: req.body.academicYear, applicationData: JSON.stringify(req.body.applicationData || {}), documents: JSON.stringify(req.body.documents || []) } });
    res.status(201).json({ status: 'success', data: app });
  } catch (e) { next(e); }
});

// My applications
router.get('/my-applications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });
    const apps = await prisma.scholarshipApplication2.findMany({ where: { studentId: student.id }, include: { scheme: { select: { name: true, provider: true } }, disbursements: true }, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: apps });
  } catch (e) { next(e); }
});

// Admin: list applications
router.get('/applications', scholarshipGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { schemeId, status, page = '1', limit = '20' } = req.query as any;
    const where: any = {};
    if (schemeId) where.schemeId = schemeId;
    if (status) where.status = status;
    const [apps, total] = await Promise.all([
      prisma.scholarshipApplication2.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), include: { scheme: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
      prisma.scholarshipApplication2.count({ where }),
    ]);
    res.json({ status: 'success', data: { applications: apps, total } });
  } catch (e) { next(e); }
});

// Verify/Approve
router.patch('/applications/:id', scholarshipGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update: any = { status: req.body.status };
    if (req.body.status === 'DOCUMENTS_VERIFIED' || req.body.status === 'ELIGIBLE') { update.verifiedById = (req as any).user?.id; update.verifiedAt = new Date(); }
    if (req.body.status === 'APPROVED') { update.approvedById = (req as any).user?.id; update.approvedAt = new Date(); update.amount = req.body.amount; }
    if (req.body.status === 'REJECTED') { update.rejectionReason = req.body.rejectionReason; }
    const app = await prisma.scholarshipApplication2.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: app });
  } catch (e) { next(e); }
});

// Disburse
router.post('/applications/:id/disburse', scholarshipGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actorId = (req as any).user?.id;
    const amount = Number(req.body.amount);

    const app = await prisma.scholarshipApplication2.findUnique({
      where: { id: req.params.id },
      include: { scheme: true },
    });
    if (!app) return res.status(404).json({ status: 'error', message: 'Application not found' });

    const disbursement = await prisma.scholarshipDisbursement.create({
      data: {
        applicationId: req.params.id,
        amount,
        disbursementDate: new Date(req.body.disbursementDate || new Date()),
        method: req.body.method || 'FEE_CREDIT',
        reference: req.body.reference || `SCH-${Date.now().toString(36).toUpperCase()}`,
        processedById: actorId,
      },
    });

    await prisma.scholarshipApplication2.update({
      where: { id: req.params.id },
      data: { status: 'DISBURSED' },
    });

    // Credit student fee bill and post to finance ledger
    const activeBill = await (prisma as any).feeBill.findFirst({
      where: { studentId: app.studentId, status: { in: ['PENDING', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
    });

    if (activeBill) {
      await (prisma as any).feeBill.update({
        where: { id: activeBill.id },
        data: {
          scholarshipDiscount: { increment: amount },
        },
      });

      await (prisma as any).financeLedgerEntry.create({
        data: {
          entryNumber: `SCH-LED-${Date.now().toString(36).toUpperCase()}`,
          entryType: 'SCHOLARSHIP',
          direction: 'CREDIT',
          amount,
          description: `Scholarship credit from ${app.scheme?.name || 'Scheme'} applied to fee bill ${activeBill.invoiceNumber || activeBill.id}`,
          billId: activeBill.id,
          studentId: app.studentId,
          createdById: actorId,
          sourceType: 'SCHOLARSHIP_DISBURSEMENT',
          sourceId: disbursement.id,
        },
      });
    }

    res.status(201).json({ status: 'success', data: disbursement });
  } catch (e) { next(e); }
});

export default router;
