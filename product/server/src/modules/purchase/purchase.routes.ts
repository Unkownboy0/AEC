import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

const purchaseGuard = requireRole(['Purchase Officer', 'Finance Officer', 'Super Admin', 'College Admin', 'Principal', 'Administration Dean']);

// Purchase Requests
router.post('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestNumber = `PR-${Date.now().toString(36).toUpperCase()}`;
    const pr = await prisma.purchaseRequest.create({ data: { ...req.body, requestNumber, requestedById: (req as any).user?.id, items: JSON.stringify(req.body.items || []) } });
    res.status(201).json({ status: 'success', data: pr });
  } catch (e) { next(e); }
});

router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, departmentId, page = '1', limit = '20' } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    const [requests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { quotations: true } }),
      prisma.purchaseRequest.count({ where }),
    ]);
    res.json({ status: 'success', data: { requests, total } });
  } catch (e) { next(e); }
});

router.patch('/requests/:id/status', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pr = await prisma.purchaseRequest.update({ where: { id: req.params.id }, data: { status: req.body.status, currentStep: req.body.currentStep, approvedAmount: req.body.approvedAmount, remarks: req.body.remarks } });
    res.json({ status: 'success', data: pr });
  } catch (e) { next(e); }
});

// Quotations
router.post('/quotations', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = await prisma.purchaseQuotation.create({ data: { ...req.body, quotationDate: new Date(req.body.quotationDate), items: JSON.stringify(req.body.items || []) } });
    res.status(201).json({ status: 'success', data: q });
  } catch (e) { next(e); }
});

// Purchase Orders
router.post('/orders', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    const po = await prisma.purchaseOrder.create({ data: { ...req.body, poNumber, items: JSON.stringify(req.body.items || []), approvedById: (req as any).user?.id, approvedAt: new Date() } });
    res.status(201).json({ status: 'success', data: po });
  } catch (e) { next(e); }
});

router.get('/orders', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' }, include: { goodsReceipts: true } });
    res.json({ status: 'success', data: orders });
  } catch (e) { next(e); }
});

router.patch('/orders/:id/status', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json({ status: 'success', data: po });
  } catch (e) { next(e); }
});

// Goods Receipt
router.post('/grn', purchaseGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grnNumber = `GRN-${Date.now().toString(36).toUpperCase()}`;
    const grn = await prisma.goodsReceipt.create({ data: { ...req.body, grnNumber, receivedById: (req as any).user?.id, items: JSON.stringify(req.body.items || []) } });
    res.status(201).json({ status: 'success', data: grn });
  } catch (e) { next(e); }
});

export default router;
