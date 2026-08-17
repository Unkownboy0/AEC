/**
 * Campus Workspace — Unified Router
 * Mounts all workspace API endpoints under /api/workspace
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middlewares/auth.middleware';
import { WorkspaceController } from './workspace.controller';

const router = Router();

// All workspace routes require authentication
router.use(requireAuth);

// ─── Documents (universal — all types) ─────────────────────────────────────

// List documents (with type filter: DOC, SHEET, SLIDE, FORM, QUIZ, NOTE, PDF, REPORT)
router.get('/documents', WorkspaceController.listDocuments);

// Get a single document (permission-checked)
router.get('/documents/:id', WorkspaceController.getDocument);

// Create a new document
router.post('/documents', WorkspaceController.createDocument);

// Update document content / title (autosave)
router.put('/documents/:id', WorkspaceController.updateDocument);

// Share document
router.post('/documents/:id/share', WorkspaceController.shareDocument);

// Delete (soft) — owner only; approved docs cannot be deleted
router.delete('/documents/:id', WorkspaceController.deleteDocument);

// ─── Comments ───────────────────────────────────────────────────────────────

router.post('/documents/:id/comments', WorkspaceController.addComment);
router.patch('/documents/:id/comments/:cid/resolve', WorkspaceController.resolveComment);

// ─── Version History ─────────────────────────────────────────────────────────

router.get('/documents/:id/versions', WorkspaceController.getVersions);
router.post('/documents/:id/versions/restore', WorkspaceController.restoreVersion);

// ─── Workflow ────────────────────────────────────────────────────────────────

// Submit document for HOD review
router.post('/documents/:id/workflow/submit', WorkspaceController.submitForWorkflow);

// HOD/Dean/Principal review (APPROVE | RETURN | REJECT)
router.post(
  '/documents/:id/workflow/review',
  requireRole(['Super Admin', 'College Admin', 'HOD', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal', 'Principal']),
  WorkspaceController.reviewDocument
);

// ─── Export ──────────────────────────────────────────────────────────────────

// /export/pdf | /export/docx | /export/xlsx | /export/csv | /export/pptx
router.get('/documents/:id/export/:format', WorkspaceController.exportDocument);

// ─── Campus Data (Field Picker + Datasets) ──────────────────────────────────

// Get current user's data context (used for token auto-fill in editors)
router.get('/campus-data/context', WorkspaceController.getCampusDataContext);

// List available datasets for the current user's role
router.get('/campus-data/datasets', WorkspaceController.getAvailableDatasets);

// Fetch a specific dataset (students, faculty_list, attendance, etc.)
router.get(
  '/campus-data/:dataset',
  requireRole(['Faculty', 'Mentor', 'HOD', 'Class Adviser', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal', 'Principal', 'Super Admin', 'College Admin']),
  WorkspaceController.fetchDataset
);

// ─── Forms & Quiz Responses ──────────────────────────────────────────────────

router.post('/forms/:id/responses', WorkspaceController.submitFormResponse);
router.get(
  '/forms/:id/responses',
  requireRole(['Faculty', 'Mentor', 'HOD', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal', 'Principal', 'Super Admin', 'College Admin']),
  WorkspaceController.getFormResponses
);

// ─── Campus Drive ─────────────────────────────────────────────────────────────

router.get('/drive/items', WorkspaceController.getDriveItems);
router.post('/drive/items', WorkspaceController.createDriveItem);
router.patch('/drive/items/:id', WorkspaceController.updateDriveItem);

export default router;
