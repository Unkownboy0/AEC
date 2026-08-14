import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { prisma } from '../../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();
router.use(requireAuth);
const alumniGuard = requireRole(['Alumni Officer', 'Placement Officer', 'Super Admin', 'College Admin']);

// List alumni
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { departmentId, batch, yearOfGraduation, search, page = '1', limit = '20' } = req.query as any;
    const where: any = { status: 'ACTIVE' };
    if (departmentId) where.departmentId = departmentId;
    if (batch) where.batch = batch;
    if (yearOfGraduation) where.yearOfGraduation = parseInt(yearOfGraduation);
    if (search) where.OR = [{ firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } }, { currentOrganization: { contains: search, mode: 'insensitive' } }];
    const [alumni, total] = await Promise.all([
      prisma.alumniProfile.findMany({ where, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit), include: { employment: { where: { isCurrent: true } } }, orderBy: { yearOfGraduation: 'desc' } }),
      prisma.alumniProfile.count({ where }),
    ]);
    res.json({ status: 'success', data: { alumni, total } });
  } catch (e) { next(e); }
});

// Get profile
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.alumniProfile.findUnique({ where: { id: req.params.id }, include: { employment: { orderBy: { startDate: 'desc' } } } });
    if (!profile) return res.status(404).json({ status: 'error', message: 'Alumni not found' });
    res.json({ status: 'success', data: profile });
  } catch (e) { next(e); }
});

// Create / self-register alumni profile
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.alumniProfile.create({ data: { ...req.body, skills: JSON.stringify(req.body.skills || []), communicationPrefs: JSON.stringify(req.body.communicationPrefs || {}) } });
    res.status(201).json({ status: 'success', data: profile });
  } catch (e) { next(e); }
});

// Update profile — no ownership linkage between AlumniProfile and User exists
// in this model yet, so self-service editing can't be safely scoped; staff-only
// until that linkage is added.
router.patch('/:id', alumniGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.alumniProfile.update({ where: { id: req.params.id }, data: req.body });
    res.json({ status: 'success', data: profile });
  } catch (e) { next(e); }
});

// Add employment
router.post('/:id/employment', alumniGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.isCurrent) {
      await prisma.alumniEmployment.updateMany({ where: { alumniId: req.params.id, isCurrent: true }, data: { isCurrent: false, endDate: new Date() } });
    }
    const employment = await prisma.alumniEmployment.create({ data: { ...req.body, alumniId: req.params.id, startDate: req.body.startDate ? new Date(req.body.startDate) : undefined } });
    if (req.body.isCurrent) {
      await prisma.alumniProfile.update({ where: { id: req.params.id }, data: { currentOrganization: req.body.organization, currentDesignation: req.body.designation, currentLocation: req.body.location } });
    }
    res.status(201).json({ status: 'success', data: employment });
  } catch (e) { next(e); }
});

// Verify alumni
router.post('/:id/verify', alumniGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.alumniProfile.update({ where: { id: req.params.id }, data: { isVerified: true, verifiedAt: new Date() } });
    res.json({ status: 'success', data: profile });
  } catch (e) { next(e); }
});

// Convert graduating student to alumni
router.post('/convert-student', alumniGuard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.body.studentId }, include: { department: true, program: true } });
    if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

    const graduationYear = req.body.graduationYear || new Date().getFullYear();
    const admissionYear = student.dateOfAdmission.getFullYear();

    const profile = await prisma.alumniProfile.create({
      data: {
        userId: student.userId,
        originalStudentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || undefined,
        phone: student.phone || undefined,
        batch: `${admissionYear}-${graduationYear}`,
        departmentId: student.departmentId,
        programId: student.programId,
        degreeAwarded: req.body.degree,
        yearOfGraduation: graduationYear,
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
    res.status(201).json({ status: 'success', data: profile });
  } catch (e) { next(e); }
});

export default router;
