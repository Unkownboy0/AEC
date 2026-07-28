import { Router } from 'express';
import { CurriculumService } from './curriculum.service';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';

const router = Router();
const service = new CurriculumService();

router.use(requireAuth);

// ---------------- Regulations ----------------
router.get('/regulations', async (req, res, next) => {
  try {
    const data = await service.getRegulations();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/regulations', requireRole(['Super Admin']), async (req, res, next) => {
  try {
    const data = await service.createRegulation(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/regulations/:id', requireRole(['Super Admin']), async (req, res, next) => {
  try {
    const data = await service.updateRegulation(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/regulations/:id/duplicate', requireRole(['Super Admin']), async (req, res, next) => {
  try {
    const { newCode, newTitle, newEffectiveYear } = req.body;
    const data = await service.duplicateRegulation(req.params.id, newCode, newTitle, newEffectiveYear);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/regulations/:id/publish', requireRole(['Super Admin']), async (req, res, next) => {
  try {
    const data = await service.publishCurriculum(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Subjects ----------------
router.get('/subjects', async (req, res, next) => {
  try {
    const data = await service.getSubjects(req.query as any);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/subjects/:id', async (req, res, next) => {
  try {
    const data = await service.getSubjectDetails(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/subjects', requireRole(['Super Admin', 'Academic Dean', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.createSubject(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/subjects/:id', requireRole(['Super Admin', 'Academic Dean', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.updateSubject(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/subjects/:id', requireRole(['Super Admin']), async (req, res, next) => {
  try {
    const data = await service.deleteSubject(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Course Outcomes & CO-PO ----------------
router.post('/subjects/:id/cos', requireRole(['Super Admin', 'Academic Dean', 'HOD', 'Faculty']), async (req, res, next) => {
  try {
    const data = await service.addCourseOutcome(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.put('/cos/:id', requireRole(['Super Admin', 'Academic Dean', 'HOD', 'Faculty']), async (req, res, next) => {
  try {
    const data = await service.updateCourseOutcome(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete('/cos/:id', requireRole(['Super Admin', 'Academic Dean', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.deleteCourseOutcome(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Units & Topics ----------------
router.post('/subjects/:id/units', requireRole(['Super Admin', 'Academic Dean', 'HOD', 'Faculty']), async (req, res, next) => {
  try {
    const data = await service.addUnit(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/units/:unitId/topics', requireRole(['Super Admin', 'Academic Dean', 'HOD', 'Faculty']), async (req, res, next) => {
  try {
    const data = await service.addTopic(req.params.unitId, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Materials & Question Banks ----------------
router.post('/materials', requireRole(['Super Admin', 'Faculty', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.addMaterial(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/question-bank', requireRole(['Super Admin', 'Faculty', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.addQuestionBankItem(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post('/lab-experiments', requireRole(['Super Admin', 'Faculty', 'HOD']), async (req, res, next) => {
  try {
    const data = await service.addLabExperiment(req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Approval Flow ----------------
router.patch('/subjects/:id/approval', requireRole(['Super Admin', 'Academic Dean', 'HOD']), async (req, res, next) => {
  try {
    const { status } = req.body;
    const data = await service.updateApprovalStatus(req.params.id, status);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- Student Dynamic View ----------------
router.get('/student-view', async (req: any, res, next) => {
  try {
    const data = await service.getStudentCurriculumView(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ---------------- PDF Syllabus Parser ----------------
router.post('/parse-pdf', requireRole(['Super Admin', 'Academic Dean', 'HOD']), async (req, res, next) => {
  try {
    const { text } = req.body;
    const data = await service.parsePdfSyllabus(text || '');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
