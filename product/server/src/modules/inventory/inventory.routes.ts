import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const assetGuard = requireRole(['Asset Manager', 'Store Keeper', 'Super Admin', 'College Admin', 'Administration Dean']);

// Assets
router.get('/assets', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, category, status, page = '1', limit = '20' } = req.query as any;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (category) where.category = category;
    if (status) where.status = status;
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { movements: { take: 5, orderBy: { performedAt: 'desc' } } } }),
      prisma.asset.count({ where }),
    ]);
    res.json({ status: 'success', data: { assets, total } });
  } catch (e) { next(e); }
});

router.post('/assets', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assetId = `AST-${req.body.category?.substring(0, 3) || 'GEN'}-${Date.now().toString(36).toUpperCase()}`;
    const asset = await prisma.asset.create({ data: { ...req.body, assetId, purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : undefined, warrantyExpiry: req.body.warrantyExpiry ? new Date(req.body.warrantyExpiry) : undefined } });
    res.status(201).json({ status: 'success', data: asset });
  } catch (e) { next(e); }
});

router.get('/assets/:id', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id }, include: { movements: { orderBy: { performedAt: 'desc' } }, serviceRecords: { orderBy: { startDate: 'desc' } } } });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
    res.json({ status: 'success', data: asset });
  } catch (e) { next(e); }
});

router.post('/assets/:id/transfer', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
    const [updatedAsset] = await prisma.$transaction([
      prisma.asset.update({ where: { id: req.params.id }, data: { departmentId: req.body.toDeptId, custodianId: req.body.toCustodianId } }),
      prisma.assetMovement.create({ data: { assetId: req.params.id, movementType: 'TRANSFER', fromDeptId: asset.departmentId, toDeptId: req.body.toDeptId, fromCustodianId: asset.custodianId, toCustodianId: req.body.toCustodianId, reason: req.body.reason, performedById: (req as any).user?.id } }),
    ]);
    res.json({ status: 'success', data: updatedAsset });
  } catch (e) { next(e); }
});

// Inventory
router.get('/inventory', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, departmentId, lowStock } = req.query as any;
    const where: any = { status: 'ACTIVE' };
    if (category) where.category = category;
    if (departmentId) where.departmentId = departmentId;
    if (lowStock === 'true') where.currentStock = { lte: prisma.inventoryItem.fields.reorderLevel };
    const items = await prisma.inventoryItem.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ status: 'success', data: items });
  } catch (e) { next(e); }
});

router.post('/inventory', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemCode = `INV-${Date.now().toString(36).toUpperCase()}`;
    const item = await prisma.inventoryItem.create({ data: { ...req.body, itemCode } });
    res.status(201).json({ status: 'success', data: item });
  } catch (e) { next(e); }
});

router.post('/inventory/:id/transaction', assetGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.inventoryItem.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ status: 'error', message: 'Item not found' });
    const newStock = req.body.type === 'STOCK_IN' || req.body.type === 'RETURN' ? item.currentStock + req.body.quantity : item.currentStock - req.body.quantity;
    if (newStock < 0) return res.status(400).json({ status: 'error', message: 'Insufficient stock' });
    const [txn] = await prisma.$transaction([
      prisma.inventoryTransaction.create({ data: { itemId: req.params.id, type: req.body.type, quantity: req.body.quantity, previousStock: item.currentStock, newStock, reference: req.body.reference, departmentId: req.body.departmentId, issuedToId: req.body.issuedToId, performedById: (req as any).user?.id, remarks: req.body.remarks } }),
      prisma.inventoryItem.update({ where: { id: req.params.id }, data: { currentStock: newStock } }),
    ]);
    res.status(201).json({ status: 'success', data: txn });
  } catch (e) { next(e); }
});

export default router;
