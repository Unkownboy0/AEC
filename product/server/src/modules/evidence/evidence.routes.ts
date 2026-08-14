import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

// Evidence Repository Service
async function uploadEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, title, description, fileKey, fileUrl, fileName, fileSize, mimeType, externalUrl, doi, metadata, academicYear } = req.body;
    const userId = (req as any).user?.id;
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    const student = await prisma.student.findFirst({ where: { userId } });

    const ownerId = faculty?.id || student?.id || userId;
    const ownerType = faculty ? 'FACULTY' : student ? 'STUDENT' : 'DEPARTMENT';

    // Hash file for dedup if fileUrl provided
    const fileHash = fileUrl ? crypto.createHash('sha256').update(fileUrl).digest('hex') : undefined;

    const evidence = await prisma.evidenceItem.create({
      data: { ownerId, ownerType, category, title, description, fileKey, fileUrl, fileName, fileSize, mimeType, fileHash, externalUrl, doi, metadata: metadata || '{}', academicYear },
    });
    res.status(201).json({ status: 'success', data: evidence });
  } catch (e) { next(e); }
}

async function listMyEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id;
    const faculty = await prisma.faculty.findFirst({ where: { userId } });
    const student = await prisma.student.findFirst({ where: { userId } });
    const ownerId = faculty?.id || student?.id || userId;

    const { category, academicYear, page = '1', limit = '20' } = req.query as any;
    const where: any = { ownerId, status: 'ACTIVE' };
    if (category) where.category = category;
    if (academicYear) where.academicYear = academicYear;

    const [items, total] = await Promise.all([
      prisma.evidenceItem.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { links: true } }),
      prisma.evidenceItem.count({ where }),
    ]);
    res.json({ status: 'success', data: { items, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (e) { next(e); }
}

async function linkEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const { evidenceId, linkedModule, linkedId, linkedType } = req.body;
    const link = await prisma.evidenceLink.create({ data: { evidenceId, linkedModule, linkedId, linkedType } });
    res.status(201).json({ status: 'success', data: link });
  } catch (e) { next(e); }
}

async function getEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const evidence = await prisma.evidenceItem.findUnique({ where: { id: req.params.id }, include: { links: true } });
    if (!evidence || evidence.status === 'DELETED') return res.status(404).json({ status: 'error', message: 'Evidence not found' });
    res.json({ status: 'success', data: evidence });
  } catch (e) { next(e); }
}

async function verifyEvidence(req: Request, res: Response, next: NextFunction) {
  try {
    const evidence = await prisma.evidenceItem.update({
      where: { id: req.params.id },
      data: { verificationStatus: req.body.status, verifiedById: (req as any).user?.id, verifiedAt: new Date() },
    });
    res.json({ status: 'success', data: evidence });
  } catch (e) { next(e); }
}

const iqacVerifyGuard = requireRole(['Super Admin', 'College Admin', 'IQAC Dean', 'IQAC Executive Officer', 'IQAC Documentation Officer']);

router.post('/', uploadEvidence);
router.get('/my', listMyEvidence);
router.get('/:id', getEvidence);
router.post('/link', linkEvidence);
router.post('/:id/verify', iqacVerifyGuard, verifyEvidence);

export default router;
