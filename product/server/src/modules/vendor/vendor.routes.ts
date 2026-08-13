import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const vendorGuard = requireRole(['Purchase Officer', 'Finance Officer', 'Super Admin', 'College Admin']);

router.get('/', vendorGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type, search } = req.query as any;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { vendorCode: { contains: search, mode: 'insensitive' } }, { gstNumber: { contains: search, mode: 'insensitive' } }];
    const vendors = await prisma.vendor.findMany({ where, include: { contacts: true }, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: vendors });
  } catch (e) { next(e); }
});

router.post('/', vendorGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendorCode = `VND-${Date.now().toString(36).toUpperCase()}`;
    const vendor = await prisma.vendor.create({ data: { ...req.body, vendorCode, products: JSON.stringify(req.body.products || []), documents: JSON.stringify(req.body.documents || []) } });
    res.status(201).json({ status: 'success', data: vendor });
  } catch (e) { next(e); }
});

router.get('/:id', vendorGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { id: req.params.id }, include: { contacts: true } });
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });
    res.json({ status: 'success', data: vendor });
  } catch (e) { next(e); }
});

router.patch('/:id', vendorGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', data: vendor });
  } catch (e) { next(e); }
});

router.post('/:id/contacts', vendorGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contact = await prisma.vendorContact.create({ data: { ...req.body, vendorId: req.params.id } });
    res.status(201).json({ status: 'success', data: contact });
  } catch (e) { next(e); }
});

export default router;
