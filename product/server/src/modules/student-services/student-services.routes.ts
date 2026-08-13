import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

const officeGuard = requireRole(['Office Admin', 'Section Officer', 'COE', 'Super Admin', 'College Admin', 'Principal']);

// Certificate Templates (admin)
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ status: 'success', data: await prisma.certificateTemplate.findMany({ where: { status: 'ACTIVE' }, orderBy: { name: 'asc' } }) }); } catch (e) { next(e); }
});

router.post('/templates', officeGuard, async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ status: 'success', data: await prisma.certificateTemplate.create({ data: { ...req.body, createdById: (req as any).user?.id } }) }); } catch (e) { next(e); }
});

// Student applies for certificate
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student profile not found' });

    const template = await prisma.certificateTemplate.findUnique({ where: { id: req.body.templateId } });
    if (!template) return res.status(404).json({ status: 'error', message: 'Certificate template not found' });

    const requestNumber = `CERT-${Date.now().toString(36).toUpperCase()}`;
    const qrVerificationHash = crypto.randomBytes(16).toString('hex');

    // Auto-pull data from Student Master
    const studentData = {
      name: `${student.firstName} ${student.lastName}`,
      admissionNo: student.admissionNo,
      email: student.email,
      phone: student.phone,
      parentName: student.parentName,
    };

    const generation = await prisma.certificateGeneration.create({
      data: {
        requestNumber,
        templateId: req.body.templateId,
        studentId: student.id,
        requestedById: userId,
        purpose: req.body.purpose,
        data: JSON.stringify(studentData),
        qrVerificationHash,
        status: template.requiresFinancialClearance ? 'FINANCIAL_CLEARANCE' : 'REQUESTED',
        currentStep: template.requiresFinancialClearance ? 'FINANCIAL_CLEARANCE' : 'OFFICE_REVIEW',
      },
    });
    res.status(201).json({ status: 'success', data: generation });
  } catch (e) { next(e); }
});

// Student: list my certificates
router.get('/my-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

    const requests = await prisma.certificateGeneration.findMany({
      where: { studentId: student.id },
      include: { template: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'success', data: requests });
  } catch (e) { next(e); }
});

// Office: list all pending requests
router.get('/pending', officeGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.certificateGeneration.findMany({
      where: { status: { in: ['REQUESTED', 'UNDER_REVIEW', 'FINANCIAL_CLEARANCE', 'APPROVED'] } },
      include: { template: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ status: 'success', data: requests });
  } catch (e) { next(e); }
});

// Office: update status
router.patch('/:id/status', officeGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, rejectionReason, returnReason } = req.body;
    const update: any = { status };
    if (status === 'REJECTED') update.rejectionReason = rejectionReason;
    if (status === 'RETURNED') update.returnReason = returnReason;
    if (status === 'SIGNED') { update.signedAt = new Date(); update.signedById = (req as any).user?.id; }
    if (status === 'PUBLISHED') { update.publishedAt = new Date(); }

    const gen = await prisma.certificateGeneration.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: gen });
  } catch (e) { next(e); }
});

// Public: verify certificate by QR hash
router.get('/verify/:hash', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gen = await prisma.certificateGeneration.findUnique({
      where: { qrVerificationHash: req.params.hash },
      include: { template: { select: { name: true, type: true } } },
    });
    if (!gen) return res.status(404).json({ status: 'error', message: 'Certificate not found' });
    res.json({ status: 'success', data: { valid: gen.status === 'PUBLISHED', requestNumber: gen.requestNumber, templateName: gen.template.name, issuedAt: gen.publishedAt } });
  } catch (e) { next(e); }
});

export default router;
