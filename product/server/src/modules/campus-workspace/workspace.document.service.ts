/**
 * Campus Workspace — Core Document Service
 * Shared backend service used by Docs, Sheets, Slides, Forms, Quiz, Notes, Reports.
 * All operations against CampusOfficeDocument model.
 */

import { prisma } from '../../lib/prisma';
import { WorkspacePermissionService } from './workspace.permission.service';
import { CampusDataProvider } from './campus-data.provider';
import { NotificationService } from '../notifications/notification.service';
import { DocumentType, DocumentStatus, ShareEntry } from './workspace.types';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';

export class WorkspaceDocumentService {
  // ─── List ──────────────────────────────────────────────────────────────────

  static async listDocuments(
    userId: string,
    userRole: string,
    userDepartmentId?: string,
    filters?: {
      type?: DocumentType;
      status?: DocumentStatus;
      search?: string;
      starred?: boolean;
      scope?: string;
    }
  ) {
    const isTrashQuery = filters?.status === 'TRASHED' || filters?.status === 'ARCHIVED';
    const statusFilter = filters?.status
      ? filters.status
      : ({ notIn: ['ARCHIVED', 'TRASHED'] } as any);

    // Documents the user owns OR is shared with them
    const ownedDocs = await prisma.campusOfficeDocument.findMany({
      where: {
        authorId: userId,
        status: statusFilter,
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.search ? { title: { contains: filters.search } } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            profileImageFileId: true,
            student: { select: { firstName: true, lastName: true } },
            faculty: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { comments: true, versions: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    // Documents shared with this user's role or department
    const sharedDocs = isTrashQuery
      ? []
      : await prisma.campusOfficeDocument.findMany({
          where: {
            authorId: { not: userId },
            status: statusFilter,
            OR: [
              { targetUsers: { contains: userId } },
              { targetRoles: { contains: userRole } },
              ...(userDepartmentId
                ? [{ targetScope: 'DEPARTMENT' as const, departmentId: userDepartmentId }]
                : []),
              { targetScope: 'ALL_CAMPUS' },
            ],
            ...(filters?.type ? { type: filters.type } : {}),
            ...(filters?.search ? { title: { contains: filters.search } } : {}),
          },
          include: {
            author: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                profilePhoto: true,
                profileImageFileId: true,
                student: { select: { firstName: true, lastName: true } },
                faculty: { select: { firstName: true, lastName: true } },
              },
            },
            _count: { select: { comments: true, versions: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        });

    const formatDoc = (doc: any, isOwner: boolean) => {
      const authorName = doc.author?.student
        ? `${doc.author.student.firstName || ''} ${doc.author.student.lastName || ''}`.trim()
        : doc.author?.faculty
        ? `${doc.author.faculty.firstName || ''} ${doc.author.faculty.lastName || ''}`.trim()
        : `${doc.author?.firstName || ''} ${doc.author?.lastName || ''}`.trim() || doc.author?.email?.split('@')[0] || 'User';

      return {
        id: doc.id,
        title: doc.title,
        type: doc.type,
        status: doc.status,
        targetScope: doc.targetScope,
        departmentId: doc.departmentId,
        authorId: doc.authorId,
        authorName,
        currentVersion: doc.currentVersion,
        commentsCount: doc._count?.comments ?? 0,
        versionsCount: doc._count?.versions ?? 0,
        isOwner,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      };
    };

    return {
      owned: ownedDocs.map((d) => formatDoc(d, true)),
      shared: sharedDocs.map((d) => formatDoc(d, false)),
    };
  }

  // ─── Get Single Document ────────────────────────────────────────────────────

  static async getDocument(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canView) throw new ForbiddenException('You do not have access to this document.');

    const doc = await prisma.campusOfficeDocument.findUnique({
      where: { id: documentId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            profileImageFileId: true,
            student: { select: { firstName: true, lastName: true } },
            faculty: { select: { firstName: true, lastName: true } },
          },
        },
        department: { select: { id: true, name: true, code: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 10,
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                student: { select: { firstName: true, lastName: true } },
                faculty: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        comments: {
          where: { resolved: false },
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                profilePhoto: true,
                student: { select: { firstName: true, lastName: true } },
                faculty: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document not found.');

    // Resolve tokens if doc has campus data placeholders
    let contentJson = doc.contentJson;
    if (contentJson.includes('{{')) {
      contentJson = await CampusDataProvider.resolveTokens(contentJson, userId);
    }

    return {
      ...doc,
      contentJson,
      permissions: perms,
    };
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  static async createDocument(
    userId: string,
    userDepartmentId: string | undefined,
    data: {
      title: string;
      type: DocumentType;
      category?: string;
      contentJson?: any;
      templateKey?: string;
      targetScope?: string;
      tags?: string[];
    }
  ) {
    const contentJson = data.contentJson ?? this.getDefaultContent(data.type);

    const title = data.title.trim();
    if (!title || title.length > 180) throw new BadRequestException('Document title must be between 1 and 180 characters.');
    const doc = await prisma.$transaction(async (tx) => {
      const created = await tx.campusOfficeDocument.create({
        data: {
          title,
          type: data.type,
          category: data.category || 'GENERAL',
          contentJson: JSON.stringify(contentJson),
          templateKey: data.templateKey,
          authorId: userId,
          departmentId: userDepartmentId,
          targetScope: data.targetScope || 'PRIVATE',
          tags: JSON.stringify(data.tags || []),
          status: 'DRAFT',
        },
      });
      await tx.campusDocumentVersion.create({
        data: {
          documentId: created.id,
          versionNumber: 1,
          contentSnapshot: JSON.stringify(contentJson),
          changeSummary: 'Initial version',
          authorId: userId,
        },
      });
      await tx.campusDriveItem.create({
        data: {
          name: title,
          isFolder: false,
          documentId: created.id,
          mimeType: `application/vnd.campusos.${String(data.type).toLowerCase()}`,
          ownerId: userId,
          departmentId: userDepartmentId,
          scope: 'PERSONAL',
        },
      });
      return created;
    });

    // Audit
    await this.logAudit(userId, 'CREATE', doc.id, doc.type, doc.title);

    return doc;
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  static async updateDocument(
    documentId: string,
    userId: string,
    userRole: string,
    userDepartmentId: string | undefined,
    data: {
      title?: string;
      contentJson?: any;
      contentHtml?: string;
      createVersion?: boolean;
      changeSummary?: string;
    }
  ) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canEdit) throw new ForbiddenException('You do not have edit access to this document.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');

    if (doc.isLocked) throw new ForbiddenException('This document is locked for editing.');
    if (['APPROVED', 'PUBLISHED'].includes(doc.status)) {
      throw new ForbiddenException('Approved/Published documents cannot be edited. Create a new draft.');
    }

    if (data.title !== undefined && (!data.title.trim() || data.title.trim().length > 180)) {
      throw new BadRequestException('Document title must be between 1 and 180 characters.');
    }

    const updatedDoc = await prisma.campusOfficeDocument.update({
      where: { id: documentId },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.contentJson ? { contentJson: JSON.stringify(data.contentJson) } : {}),
        ...(data.contentHtml ? { contentHtml: data.contentHtml } : {}),
      },
    });
    if (data.title !== undefined) {
      await prisma.campusDriveItem.updateMany({
        where: { documentId },
        data: { name: data.title.trim() },
      });
    }

    // Create version snapshot if requested (e.g., manual save or pre-submit)
    if (data.createVersion) {
      const newVersionNumber = doc.currentVersion + 1;
      await Promise.all([
        prisma.campusDocumentVersion.create({
          data: {
            documentId,
            versionNumber: newVersionNumber,
            contentSnapshot: JSON.stringify(data.contentJson || doc.contentJson),
            changeSummary: data.changeSummary || `Version ${newVersionNumber}`,
            authorId: userId,
          },
        }),
        prisma.campusOfficeDocument.update({
          where: { id: documentId },
          data: { currentVersion: newVersionNumber },
        }),
      ]);
    }

    return updatedDoc;
  }

  // ─── Share ─────────────────────────────────────────────────────────────────

  static async shareDocument(
    documentId: string,
    userId: string,
    userRole: string,
    userDepartmentId: string | undefined,
    shareEntries: ShareEntry[],
    targetScope?: string
  ) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canShare) throw new ForbiddenException('You do not have share access to this document.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');

    if (!Array.isArray(shareEntries)) throw new BadRequestException('A recipient list is required.');

    const targetUsers = shareEntries.filter((e) => e.userId).map((e) => ({ userId: e.userId, permission: e.permission, canDownload: e.canDownload, canPrint: e.canPrint, canShare: e.canShare, canExport: e.canExport, expiresAt: e.expiresAt }));
    const targetRoles = shareEntries.filter((e) => e.roleName).map((e) => ({ roleName: e.roleName, permission: e.permission }));

    await prisma.campusOfficeDocument.update({
      where: { id: documentId },
      data: {
        targetUsers: JSON.stringify(targetUsers),
        targetRoles: JSON.stringify(targetRoles),
        ...(targetScope ? { targetScope } : {}),
      },
    });

    const actor = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    const actorName = `${actor?.firstName || ''} ${actor?.lastName || ''}`.trim() || 'A CampusOS user';

    // Notify shared users
    for (const entry of targetUsers) {
      if (entry.userId && entry.userId !== userId) {
        await NotificationService.sendNotification({
          recipientId: entry.userId,
          eventType: 'DOCUMENT_SHARED',
          title: `${actorName} shared a document with you`,
          message: `${actorName} shared "${doc.title}" with ${entry.permission.toLowerCase()} access.`,
          relatedEntityType: 'DOCUMENT',
          relatedEntityId: documentId,
          deepLinkRoute: `/workspace/docs/${documentId}`,
        }).catch(() => undefined);
      }
    }

    // Audit share action
    await this.logAudit(userId, 'SHARE', documentId, undefined, undefined, { shareEntries });

    return { success: true };
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  static async addComment(documentId: string, userId: string, userRole: string, userDepartmentId: string | undefined, commentText: string, anchorData?: any) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canComment) throw new ForbiddenException('You do not have comment access.');

    return prisma.campusDocumentComment.create({
      data: { documentId, authorId: userId, commentText, anchorData: anchorData ? JSON.stringify(anchorData) : undefined },
      include: { author: { select: { faculty: { select: { firstName: true, lastName: true } } } } },
    });
  }

  static async resolveComment(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.campusDocumentComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found.');
    const perms = await WorkspacePermissionService.resolvePermissions(comment.documentId, userId, userRole);
    if (!perms.canEdit && comment.authorId !== userId) throw new ForbiddenException('Cannot resolve this comment.');

    return prisma.campusDocumentComment.update({
      where: { id: commentId },
      data: { resolved: true, resolvedById: userId, resolvedAt: new Date() },
    });
  }

  // ─── Workflow Submission ────────────────────────────────────────────────────

  static async submitForWorkflow(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canSubmit) throw new ForbiddenException('You do not have submit access.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (!['DRAFT', 'RETURNED'].includes(doc.status)) {
      throw new BadRequestException('Only DRAFT or RETURNED documents can be submitted.');
    }

    // Snapshot current version before submission
    const newVersionNumber = doc.currentVersion + 1;
    await Promise.all([
      prisma.campusDocumentVersion.create({
        data: {
          documentId,
          versionNumber: newVersionNumber,
          contentSnapshot: doc.contentJson,
          changeSummary: 'Submitted for review',
          authorId: userId,
        },
      }),
      prisma.campusOfficeDocument.update({
        where: { id: documentId },
        data: {
          status: 'SUBMITTED',
          currentVersion: newVersionNumber,
          workflowStep: 'HOD',
        },
      }),
    ]);

    await this.logAudit(userId, 'SUBMIT', documentId, doc.type, doc.title);

    return { success: true, versionNumber: newVersionNumber };
  }

  static async reviewDocument(
    documentId: string,
    userId: string,
    userRole: string,
    action: 'APPROVE' | 'RETURN' | 'REJECT',
    comment?: string
  ) {
    const allowedReviewerRoles = ['HOD', 'Academic Dean', 'Admission Dean', 'IQAC Dean', 'Vice Principal', 'Principal', 'Super Admin', 'College Admin'];
    if (!allowedReviewerRoles.includes(userRole)) throw new ForbiddenException('Unauthorized reviewer.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (!['SUBMITTED', 'IN_REVIEW'].includes(doc.status)) {
      throw new BadRequestException('Document is not in a reviewable state.');
    }

    let newStatus: string = 'IN_REVIEW';
    if (action === 'APPROVE') newStatus = 'APPROVED';
    else if (action === 'RETURN') newStatus = 'RETURNED';
    else if (action === 'REJECT') newStatus = 'RETURNED';

    await prisma.campusOfficeDocument.update({
      where: { id: documentId },
      data: {
        status: newStatus,
        isLocked: action === 'APPROVE',
      },
    });

    if (comment) {
      await prisma.campusDocumentComment.create({
        data: { documentId, authorId: userId, commentText: `[${action}] ${comment}` },
      });
    }

    await this.logAudit(userId, action === 'APPROVE' ? 'APPROVE' : 'RETURN', documentId, doc.type, doc.title, { action, comment });

    return { success: true, newStatus };
  }

  // ─── Versions ──────────────────────────────────────────────────────────────

  static async getVersions(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canView) throw new ForbiddenException('Access denied.');

    return prisma.campusDocumentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: { author: { select: { faculty: { select: { firstName: true, lastName: true } } } } },
    });
  }

  static async restoreVersion(documentId: string, versionNumber: number, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canEdit) throw new ForbiddenException('Edit access required to restore versions.');

    const version = await prisma.campusDocumentVersion.findUnique({ where: { documentId_versionNumber: { documentId, versionNumber } } });
    if (!version) throw new NotFoundException('Version not found.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (['APPROVED', 'PUBLISHED'].includes(doc.status)) throw new ForbiddenException('Cannot restore a version of an approved document.');

    // Restore creates a NEW version — never erases history
    const newVersionNumber = doc.currentVersion + 1;
    await Promise.all([
      prisma.campusDocumentVersion.create({
        data: {
          documentId,
          versionNumber: newVersionNumber,
          contentSnapshot: version.contentSnapshot,
          changeSummary: `Restored from version ${versionNumber}`,
          authorId: userId,
        },
      }),
      prisma.campusOfficeDocument.update({
        where: { id: documentId },
        data: {
          contentJson: version.contentSnapshot,
          currentVersion: newVersionNumber,
          status: 'DRAFT',
        },
      }),
    ]);

    await this.logAudit(userId, 'RESTORE_VERSION', documentId, doc.type, doc.title, { fromVersion: versionNumber });
    return { success: true, newVersionNumber };
  }

  // ─── Delete & Trash Lifecycle ──────────────────────────────────────────────

  static async deleteDocument(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canDelete) throw new ForbiddenException('Only the document owner can delete it.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (['APPROVED', 'PUBLISHED'].includes(doc.status)) {
      throw new ForbiddenException('Approved official documents cannot be deleted. Archive instead.');
    }

    // Soft delete — move to trash
    await prisma.$transaction([
      prisma.campusOfficeDocument.update({ where: { id: documentId }, data: { status: 'TRASHED' } }),
      prisma.campusDriveItem.updateMany({ where: { documentId }, data: { isTrashed: true, trashedAt: new Date() } }),
    ]);
    await this.logAudit(userId, 'TRASH', documentId, doc.type, doc.title);
    return { success: true };
  }

  static async restoreDocument(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canDelete) throw new ForbiddenException('Only the document owner can restore it.');

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (doc.status !== 'TRASHED' && doc.status !== 'ARCHIVED') {
      throw new BadRequestException('Document is not in trash.');
    }

    await prisma.$transaction([
      prisma.campusOfficeDocument.update({ where: { id: documentId }, data: { status: 'DRAFT' } }),
      prisma.campusDriveItem.updateMany({ where: { documentId }, data: { isTrashed: false, trashedAt: null } }),
    ]);
    await this.logAudit(userId, 'RESTORE', documentId, doc.type, doc.title);
    return { success: true, status: 'DRAFT' };
  }

  static async permanentlyDeleteDocument(documentId: string, userId: string, userRole: string, userDepartmentId?: string) {
    const perms = await WorkspacePermissionService.resolvePermissions(documentId, userId, userRole, userDepartmentId);
    if (!perms.canDelete && !['Super Admin', 'College Admin'].includes(userRole)) {
      throw new ForbiddenException('Only the document author or administrator can permanently delete.');
    }

    const doc = await prisma.campusOfficeDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found.');
    if (doc.status !== 'TRASHED' && doc.status !== 'ARCHIVED') {
      throw new BadRequestException('Document must be moved to Trash before permanent deletion.');
    }

    await prisma.$transaction([
      prisma.campusDocumentComment.deleteMany({ where: { documentId } }),
      prisma.campusDocumentVersion.deleteMany({ where: { documentId } }),
      prisma.campusDriveItem.deleteMany({ where: { documentId } }),
      prisma.campusOfficeDocument.delete({ where: { id: documentId } }),
    ]);

    await this.logAudit(userId, 'PERMANENT_DELETE', documentId, doc.type, doc.title);
    return { success: true, deleted: true };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  static getDefaultContent(type: DocumentType): any {
    switch (type) {
      case 'DOC':
        return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
      case 'SHEET':
        return { sheets: [{ id: 'sheet1', name: 'Sheet 1', cells: {}, format: {} }], activeSheet: 'sheet1' };
      case 'SLIDE':
        return { slides: [{ id: 'slide1', layout: 'TITLE', elements: [], notes: '' }], theme: { primaryColor: '#1a73e8', font: 'Inter' } };
      case 'FORM':
        return { questions: [], settings: { requiresLogin: false, limitResponses: false, isAnonymous: false } };
      case 'QUIZ':
        return { questions: [], settings: { timeLimitMinutes: 30, attemptsAllowed: 1, shuffleQuestions: true, shuffleOptions: true, passScorePercentage: 50 } };
      case 'NOTE':
        return { sections: [{ id: 'default', name: 'Quick Notes', color: '#1a73e8', pages: [] }] };
      case 'REPORT':
        return { sections: [], metadata: { reportType: '', academicYear: '', semester: '' } };
      case 'PDF':
        return { fileUrl: '', pages: 0, metadata: {} };
      default:
        return {};
    }
  }

  private static async logAudit(
    userId: string,
    action: string,
    documentId: string,
    docType?: string,
    title?: string,
    metadata?: any
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: `WORKSPACE_${action}`,
          entityType: 'DOCUMENT',
          entityId: documentId,
          description: `${action} ${docType || 'document'}: ${title || documentId}`,
          newValues: JSON.stringify({ documentId, docType, title, ...metadata }),
        },
      });
    } catch (e) {
      // Audit failure must not break the main operation
      console.error('[Workspace] Audit log failed:', e);
    }
  }
}
