import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const maintenanceGuard = requireRole(['Maintenance Manager', 'Estate Officer', 'Super Admin', 'College Admin', 'Administration Dean']);

// Create maintenance request (any user)
router.post('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestNumber = `MR-${Date.now().toString(36).toUpperCase()}`;
    const mr = await prisma.maintenanceRequest.create({ data: { ...req.body, requestNumber, reportedById: (req as any).user?.id, attachments: JSON.stringify(req.body.attachments || []), photos: JSON.stringify(req.body.photos || []) } });
    res.status(201).json({ status: 'success', data: mr });
  } catch (e) { next(e); }
});

// List requests
router.get('/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, status, priority, assignedToId, page = '1', limit = '20' } = req.query as any;
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { works: true } }),
      prisma.maintenanceRequest.count({ where }),
    ]);
    res.json({ status: 'success', data: { requests, total } });
  } catch (e) { next(e); }
});

router.get('/requests/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mr = await prisma.maintenanceRequest.findUnique({ where: { id: req.params.id }, include: { works: { include: { technician: true } } } });
    if (!mr) return res.status(404).json({ status: 'error', message: 'Request not found' });
    res.json({ status: 'success', data: mr });
  } catch (e) { next(e); }
});

// Assign / Update status
router.patch('/requests/:id', maintenanceGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const update: any = { ...req.body };
    if (req.body.status === 'RESOLVED') { update.resolvedAt = new Date(); update.resolvedById = (req as any).user?.id; }
    if (req.body.status === 'VERIFIED') { update.verifiedAt = new Date(); update.verifiedById = (req as any).user?.id; }
    const mr = await prisma.maintenanceRequest.update({ where: { id: req.params.id }, data: update });
    res.json({ status: 'success', data: mr });
  } catch (e) { next(e); }
});

// Add work log
router.post('/requests/:id/work', maintenanceGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const work = await prisma.maintenanceWork.create({ data: { ...req.body, requestId: req.params.id, partsUsed: JSON.stringify(req.body.partsUsed || []), photos: JSON.stringify(req.body.photos || []) } });
    res.status(201).json({ status: 'success', data: work });
  } catch (e) { next(e); }
});

// Technicians
router.get('/technicians', maintenanceGuard, async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ status: 'success', data: await prisma.maintenanceTechnician.findMany({ orderBy: { name: 'asc' } }) }); } catch (e) { next(e); }
});

router.post('/technicians', maintenanceGuard, async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ status: 'success', data: await prisma.maintenanceTechnician.create({ data: req.body }) }); } catch (e) { next(e); }
});

// Feedback (reported-by user)
router.post('/requests/:id/feedback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mr = await prisma.maintenanceRequest.update({ where: { id: req.params.id }, data: { feedback: req.body.feedback, feedbackRating: req.body.rating } });
    res.json({ status: 'success', data: mr });
  } catch (e) { next(e); }
});

export default router;
