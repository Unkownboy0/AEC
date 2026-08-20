/**
 * Campus Workspace — Unified Controller
 * Handles all workspace API requests for all document types.
 */

import { Request, Response, NextFunction } from 'express';
import { WorkspaceDocumentService } from './workspace.document.service';
import { CampusDataProvider } from './campus-data.provider';
import { WorkspaceExportService } from './workspace.export.service';
import { DocumentType } from './workspace.types';
import { listCampusSuiteApps } from './campus-suite.catalog';
import { GovernedFileService } from './governed-file.service';
import { WorkspaceRecipientService } from './workspace-recipient.service';

export class WorkspaceController {
  static searchShareRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const data = await WorkspaceRecipientService.search(
        { id: user.id, role: user.role, departmentId: user.departmentId },
        String(req.query.q || ''),
        Number(req.query.limit || 15),
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  };

  static listApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const applications = await listCampusSuiteApps({
        role: user.role,
        permissions: user.permissions || [],
      });
      res.json({ success: true, data: applications, count: applications.length });
    } catch (e) { next(e); }
  };

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
      WorkspaceRecipientService.assertShareEnvelope(
        { id: user.id, role: user.role, departmentId: user.departmentId },
        shareEntries,
        targetScope,
      );
      await WorkspaceRecipientService.assertEligible(
        { id: user.id, role: user.role, departmentId: user.departmentId },
        Array.isArray(shareEntries) ? shareEntries.map((entry: any) => entry?.userId).filter(Boolean) : [],
      );
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
      res.json({ success: true, message: 'Document moved to trash' });
    } catch (e) { next(e); }
  };

  static restoreDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await WorkspaceDocumentService.restoreDocument(req.params.id, user.id, user.role, user.departmentId);
      res.json(result);
    } catch (e) { next(e); }
  };

  static permanentlyDeleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await WorkspaceDocumentService.permanentlyDeleteDocument(req.params.id, user.id, user.role, user.departmentId);
      res.json(result);
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
      const { scope, parentId, search, trashed, action } = req.query;
      const items = await GovernedFileService.listDriveItems({
        userId: user.id,
        activeRole: user.role,
        scope: scope as string,
        parentId: parentId as string | undefined,
        search: search as string | undefined,
        includeTrashed: trashed === 'true',
        action: (action as any) || 'VIEW',
      });
      res.json({ success: true, data: items });
    } catch (e) { next(e); }
  };

  static getDrivePickerFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const mode = String(req.query.mode || 'DRIVE').toUpperCase();
      if (!['DRIVE', 'RECENT', 'SHARED', 'SEARCH'].includes(mode)) {
        return res.status(400).json({ success: false, message: 'Invalid picker mode.' });
      }
      const mimeTypes = typeof req.query.mimeTypes === 'string'
        ? req.query.mimeTypes.split(',').map((value) => value.trim()).filter(Boolean)
        : undefined;
      const data = await GovernedFileService.listPickerFiles({
        userId: user.id,
        activeRole: user.role,
        mode: mode as any,
        search: req.query.search as string | undefined,
        action: (String(req.query.action || 'VIEW').toUpperCase() as any),
        mimeTypes,
        maxSizeBytes: req.query.maxSizeBytes ? Number(req.query.maxSizeBytes) : undefined,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  };

  static uploadDriveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { name, mimeType, base64, parentId, scope, sourceModule } = req.body;
      if (!name || !mimeType || !base64) return res.status(400).json({ success: false, message: 'name, mimeType and base64 are required.' });
      const item = await GovernedFileService.upload({
        userId: user.id, activeRole: user.role, name, mimeType, base64, parentId, scope, sourceModule,
      });
      res.status(201).json({ success: true, data: item });
    } catch (e) { next(e); }
  };

  static createDriveItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { name, isFolder, parentId, scope } = req.body;
      if (!isFolder) return res.status(400).json({ success: false, message: 'Use /drive/files/upload for binary files.' });
      const item = await GovernedFileService.createFolder({ userId: user.id, activeRole: user.role, name, parentId, scope });
      res.status(201).json({ success: true, data: item });
    } catch (e) { next(e); }
  };

  static updateDriveItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { name, isStarred, isTrashed, parentId } = req.body;
      const updated = await GovernedFileService.updateDriveItem({
        userId: user.id, activeRole: user.role, itemId: req.params.id, name, isStarred, isTrashed, parentId,
      });
      res.json({ success: true, data: updated });
    } catch (e) { next(e); }
  };

  static shareDriveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const grant = await GovernedFileService.share({
        userId: user.id, activeRole: user.role, fileId: req.params.fileId,
        driveItemId: req.body.driveItemId, principalType: req.body.principalType,
        principalId: req.body.principalId, accessLevel: req.body.accessLevel,
        expiresAt: req.body.expiresAt,
      });
      res.status(201).json({ success: true, data: grant });
    } catch (e) { next(e); }
  };

  static revokeDriveFileShare = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const grant = await GovernedFileService.revokeShare({
        userId: user.id, activeRole: user.role, fileId: req.params.fileId, grantId: req.params.grantId,
      });
      res.json({ success: true, data: grant });
    } catch (e) { next(e); }
  };

  static shareDriveFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const grant = await GovernedFileService.shareDriveFolder({
        userId: user.id, activeRole: user.role, itemId: req.params.itemId,
        principalType: req.body.principalType, principalId: req.body.principalId,
        accessLevel: req.body.accessLevel, expiresAt: req.body.expiresAt,
      });
      res.status(201).json({ success: true, data: grant });
    } catch (e) { next(e); }
  };

  static revokeDriveFolderShare = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const grant = await GovernedFileService.revokeDriveFolderShare({
        userId: user.id, activeRole: user.role, itemId: req.params.itemId, grantId: req.params.grantId,
      });
      res.json({ success: true, data: grant });
    } catch (e) { next(e); }
  };

  static attachDriveFileReference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const reference = await GovernedFileService.attachReference({
        userId: user.id, activeRole: user.role, fileId: req.params.fileId,
        module: req.body.module, resourceType: req.body.resourceType, resourceId: req.body.resourceId,
        purpose: req.body.purpose, authorizationMode: req.body.authorizationMode,
        requiredAction: req.body.requiredAction,
      });
      res.status(201).json({ success: true, data: reference });
    } catch (e) { next(e); }
  };

  static permanentlyDeleteDriveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await GovernedFileService.requestPermanentDelete({
        userId: user.id, activeRole: user.role, fileId: req.params.fileId, driveItemId: req.params.itemId,
      });
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };

  static permanentlyDeleteDriveFolder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const result = await GovernedFileService.permanentlyDeleteFolder({
        userId: user.id, activeRole: user.role, driveItemId: req.params.itemId,
      });
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  };
}
