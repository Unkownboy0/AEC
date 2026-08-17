/**
 * Campus Workspace — Unified Controller
 * Handles all workspace API requests for all document types.
 */

import { Request, Response, NextFunction } from 'express';
import { WorkspaceDocumentService } from './workspace.document.service';
import { CampusDataProvider } from './campus-data.provider';
import { WorkspaceExportService } from './workspace.export.service';
import { DocumentType } from './workspace.types';

export class WorkspaceController {
  // ─── Document CRUD ──────────────────────────────────────────────────────────

  static listDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { type, status, search, scope } = req.query;
      const result = await WorkspaceDocumentService.listDocuments(
        user.id, user.role, user.departmentId,
        { type: type as DocumentType, status: status as any, search: search as string, scope: scope as string }
      );
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  static getDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const doc = await WorkspaceDocumentService.getDocument(req.params.id, user.id, user.role, user.departmentId);
      res.json({ success: true, data: doc });
    } catch (e) { next(e); }
  };

  static createDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { title, type, category, contentJson, templateKey, targetScope, tags } = req.body;
      if (!title || !type) return res.status(400).json({ success: false, message: 'title and type are required.' });
      const doc = await WorkspaceDocumentService.createDocument(user.id, user.departmentId, {
        title, type, category, contentJson, templateKey, targetScope, tags,
      });
      res.status(201).json({ success: true, data: doc });
    } catch (e) { next(e); }
  };

  static updateDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { title, contentJson, contentHtml, createVersion, changeSummary } = req.body;
      const doc = await WorkspaceDocumentService.updateDocument(
        req.params.id, user.id, user.role, user.departmentId,
        { title, contentJson, contentHtml, createVersion, changeSummary }
      );
      res.json({ success: true, data: doc });
    } catch (e) { next(e); }
  };

  static shareDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { shareEntries, targetScope } = req.body;
      const result = await WorkspaceDocumentService.shareDocument(
        req.params.id, user.id, user.role, user.departmentId, shareEntries, targetScope
      );
      res.json(result);
    } catch (e) { next(e); }
  };

  static deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      await WorkspaceDocumentService.deleteDocument(req.params.id, user.id, user.role, user.departmentId);
      res.json({ success: true });
    } catch (e) { next(e); }
  };

  // ─── Comments ──────────────────────────────────────────────────────────────

  static addComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { commentText, anchorData } = req.body;
      const comment = await WorkspaceDocumentService.addComment(
        req.params.id, user.id, user.role, user.departmentId, commentText, anchorData
      );
      res.status(201).json({ success: true, data: comment });
    } catch (e) { next(e); }
  };

  static resolveComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const comment = await WorkspaceDocumentService.resolveComment(req.params.cid, user.id, user.role);
      res.json({ success: true, data: comment });
    } catch (e) { next(e); }
  };

  // ─── Versions ──────────────────────────────────────────────────────────────

  static getVersions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const versions = await WorkspaceDocumentService.getVersions(req.params.id, user.id, user.role, user.departmentId);
      res.json({ success: true, data: versions });
    } catch (e) { next(e); }
  };

  static restoreVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { versionNumber } = req.body;
      const result = await WorkspaceDocumentService.restoreVersion(
        req.params.id, versionNumber, user.id, user.role, user.departmentId
      );
      res.json(result);
    } catch (e) { next(e); }
  };

  // ─── Workflow ───────────────────────────────────────────────────────────────

  static submitForWorkflow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await WorkspaceDocumentService.submitForWorkflow(req.params.id, user.id, user.role, user.departmentId);
      res.json(result);
    } catch (e) { next(e); }
  };

  static reviewDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { action, comment } = req.body;
      if (!['APPROVE', 'RETURN', 'REJECT'].includes(action)) {
        return res.status(400).json({ success: false, message: 'action must be APPROVE, RETURN, or REJECT.' });
      }
      const result = await WorkspaceDocumentService.reviewDocument(req.params.id, user.id, user.role, action, comment);
      res.json(result);
    } catch (e) { next(e); }
  };

  // ─── Export ─────────────────────────────────────────────────────────────────

  static exportDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { format } = req.params; // pdf, docx, xlsx, csv, pptx
      await WorkspaceExportService.export(req.params.id, format, user.id, user.role, user.departmentId, res);
    } catch (e) { next(e); }
  };

  // ─── Campus Data ────────────────────────────────────────────────────────────

  static getCampusDataContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const ctx = await CampusDataProvider.getUserContext(user.id);
      res.json({ success: true, data: ctx });
    } catch (e) { next(e); }
  };

  static getAvailableDatasets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const datasets = CampusDataProvider.getAvailableDatasets(user.role);
      res.json({ success: true, data: datasets });
    } catch (e) { next(e); }
  };

  static fetchDataset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { dataset } = req.params;
      const filters = req.query as Record<string, string>;
      const data = await CampusDataProvider.fetchDataset(dataset, user.id, user.role, user.departmentId, filters);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  };

  // ─── Forms Responses ─────────────────────────────────────────────────────────

  static submitFormResponse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { answersJson } = req.body;
      const { prisma } = await import('../../lib/prisma');

      const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: req.params.id } });
      if (!doc || doc.type !== 'FORM') return res.status(404).json({ message: 'Form not found.' });

      const response = await prisma.campusFormResponse.create({
        data: {
          documentId: req.params.id,
          respondentId: user.id,
          respondentEmail: user.email,
          answersJson: JSON.stringify(answersJson),
          status: 'SUBMITTED',
        },
      });
      res.status(201).json({ success: true, data: response });
    } catch (e) { next(e); }
  };

  static getFormResponses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { prisma } = await import('../../lib/prisma');
      const { WorkspacePermissionService } = await import('./workspace.permission.service');
      const perms = await WorkspacePermissionService.resolvePermissions(req.params.id, user.id, user.role, user.departmentId);
      if (!perms.canView) return res.status(403).json({ message: 'Access denied.' });

      const responses = await prisma.campusFormResponse.findMany({
        where: { documentId: req.params.id },
        orderBy: { submittedAt: 'desc' },
        take: 500,
      });
      res.json({ success: true, data: responses, count: responses.length });
    } catch (e) { next(e); }
  };

  // ─── Drive ───────────────────────────────────────────────────────────────────

  static getDriveItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { scope, parentId } = req.query;
      const { prisma } = await import('../../lib/prisma');

      const items = await prisma.campusDriveItem.findMany({
        where: {
          ...(scope ? { scope: scope as string } : {}),
          ...(parentId ? { parentId: parentId as string } : { parentId: null }),
          ...(scope === 'PERSONAL' ? { ownerId: user.id } : {}),
          ...(scope === 'DEPARTMENT' ? { departmentId: user.departmentId } : {}),
          isTrashed: false,
        },
        include: { owner: { select: { faculty: { select: { firstName: true, lastName: true } } } } },
        orderBy: [{ isFolder: 'desc' }, { updatedAt: 'desc' }],
        take: 200,
      });
      res.json({ success: true, data: items });
    } catch (e) { next(e); }
  };

  static createDriveItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { name, isFolder, parentId, mimeType, fileUrl, fileSize, scope } = req.body;
      const { prisma } = await import('../../lib/prisma');

      const item = await prisma.campusDriveItem.create({
        data: {
          name,
          isFolder: isFolder ?? false,
          parentId,
          mimeType,
          fileUrl,
          fileSize,
          scope: scope || 'PERSONAL',
          ownerId: user.id,
          departmentId: scope === 'DEPARTMENT' ? user.departmentId : undefined,
        },
      });
      res.status(201).json({ success: true, data: item });
    } catch (e) { next(e); }
  };

  static updateDriveItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { name, isStarred, isTrashed, parentId } = req.body;
      const { prisma } = await import('../../lib/prisma');

      const item = await prisma.campusDriveItem.findUnique({ where: { id: req.params.id } });
      if (!item) return res.status(404).json({ message: 'Item not found.' });
      if (item.ownerId !== user.id && !['Super Admin', 'College Admin'].includes(user.role)) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const updated = await prisma.campusDriveItem.update({
        where: { id: req.params.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(isStarred !== undefined ? { isStarred } : {}),
          ...(isTrashed !== undefined ? { isTrashed, trashedAt: isTrashed ? new Date() : null } : {}),
          ...(parentId !== undefined ? { parentId } : {}),
        },
      });
      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  };
}
