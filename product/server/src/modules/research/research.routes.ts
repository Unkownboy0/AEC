import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);

// `requireRole` was imported but never wired to any route here — every write
// endpoint below (project/publication/patent create+edit) was reachable by
// any authenticated user, including Students, with no ownership check on
// PATCH /projects/:id (any faculty could edit any other faculty's project).
// Gating to research-eligible staff roles closes the Student-writes-research-data
// gap; per-record ownership (piId/coPiIds match) is a separate follow-up.
const researchWriteGuard = requireRole(['Super Admin', 'College Admin', 'Faculty', 'HOD', 'Academic Dean', 'IQAC Dean']);

// Research Projects
router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, status, piId } = req.query as any;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (piId) where.piId = piId;
    const projects = await prisma.researchProject.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: projects });
  } catch (e) { next(e); }
});

router.post('/projects', researchWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.researchProject.create({ data: { ...req.body, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined, endDate: req.body.endDate ? new Date(req.body.endDate) : undefined, coPiIds: JSON.stringify(req.body.coPiIds || []), milestones: JSON.stringify(req.body.milestones || []) } });
    res.status(201).json({ status: 'success', data: project });
  } catch (e) { next(e); }
});

router.get('/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.researchProject.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ status: 'error', message: 'Project not found' });
    res.json({ status: 'success', data: project });
  } catch (e) { next(e); }
});

const RESEARCH_OVERSIGHT_ROLES = ['Super Admin', 'College Admin', 'HOD', 'Academic Dean', 'IQAC Dean'];

router.patch('/projects/:id', researchWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const existing = await prisma.researchProject.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Project not found' });

    if (!RESEARCH_OVERSIGHT_ROLES.includes(user?.role)) {
      const faculty = await prisma.faculty.findFirst({ where: { userId: user.id } });
      const coPiIds: string[] = JSON.parse(existing.coPiIds || '[]');
      const isOwner = !!faculty && (existing.piId === faculty.id || coPiIds.includes(faculty.id));
      if (!isOwner) {
        return res.status(403).json({ status: 'error', message: 'Only the project PI, co-PIs, or department/institution oversight roles may edit this project.' });
      }
    }

    const project = await prisma.researchProject.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', data: project });
  } catch (e) { next(e); }
});

// Publications
router.get('/publications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, type, year, indexing } = req.query as any;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (type) where.type = type;
    if (year) where.year = parseInt(year);
    if (indexing) where.indexing = indexing;
    const publications = await prisma.researchPublication.findMany({ where, orderBy: { year: 'desc' } });
    res.json({ status: 'success', data: publications });
  } catch (e) { next(e); }
});

router.post('/publications', researchWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pub = await prisma.researchPublication.create({ data: { ...req.body, authors: JSON.stringify(req.body.authors || []), keywords: JSON.stringify(req.body.keywords || []) } });
    res.status(201).json({ status: 'success', data: pub });
  } catch (e) { next(e); }
});

// Patents
router.get('/patents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, status } = req.query as any;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    const patents = await prisma.patent.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ status: 'success', data: patents });
  } catch (e) { next(e); }
});

router.post('/patents', researchWriteGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patent = await prisma.patent.create({ data: { ...req.body, filingDate: req.body.filingDate ? new Date(req.body.filingDate) : undefined, inventors: JSON.stringify(req.body.inventors || []), documents: JSON.stringify(req.body.documents || []) } });
    res.status(201).json({ status: 'success', data: patent });
  } catch (e) { next(e); }
});

// Analytics
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalProjects, ongoingProjects, totalPublications, totalPatents, grantedPatents] = await Promise.all([
      prisma.researchProject.count(),
      prisma.researchProject.count({ where: { status: 'ONGOING' } }),
      prisma.researchPublication.count(),
      prisma.patent.count(),
      prisma.patent.count({ where: { status: 'GRANTED' } }),
    ]);
    res.json({ status: 'success', data: { totalProjects, ongoingProjects, totalPublications, totalPatents, grantedPatents } });
  } catch (e) { next(e); }
});

export default router;
