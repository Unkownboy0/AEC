import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../../lib/prisma';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import {
  actorHasGrantedAccess,
  GovernedFileAction,
  GovernedFileActor,
  normalizeFileRole,
} from './governed-file.policy';
import { validateCommonUpload } from '../files/file-upload.validation';

const PRINCIPAL_TYPES = new Set([
  'SPECIFIC_USER', 'ROLE', 'WORKSPACE', 'DEPARTMENT', 'SECTION', 'ALL_INSTITUTION',
]);
const ACCESS_LEVELS = new Set(['VIEW', 'DOWNLOAD', 'COMMENT', 'EDIT', 'MANAGE']);
const ATTACH_PURPOSES = new Set([
  'TASK_ATTACHMENT', 'CLASSROOM_MATERIAL', 'CLASSROOM_SUBMISSION', 'CHAT_ATTACHMENT',
  'APPROVAL_EVIDENCE', 'IQAC_EVIDENCE', 'GENERAL_REFERENCE',
]);

interface ParentResourceContext {
  module: string;
  resourceType: string;
  resourceId: string;
  authorizeParentResource: () => Promise<boolean>;
}

export interface AuthorizeFileAccessInput {
  userId: string;
  activeRole: string;
  fileId: string;
  action: GovernedFileAction;
  driveItemId?: string;
  parentResource?: ParentResourceContext;
}

function storageRoot(): string {
  return path.resolve(process.env.STORAGE_ROOT || path.join(__dirname, '../../../uploads'));
}

function canonicalStorageKey(value: string): string {
  const normalized = value.replace(/\\/g, '/').replace(/^.*\/uploads\//i, '').replace(/^\/+/, '');
  if (!normalized || normalized.includes('\0') || normalized.split('/').includes('..')) {
    throw new BadRequestException('Invalid storage key');
  }
  return normalized;
}

export function resolveGovernedPhysicalPath(storageKeyOrLegacyPath: string): string | null {
  try {
    const root = storageRoot();
    const key = canonicalStorageKey(storageKeyOrLegacyPath);
    const candidate = path.resolve(root, key);
    const relative = path.relative(root, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(candidate)) return null;
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    const realRelative = path.relative(realRoot, realCandidate);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative) || !fs.statSync(realCandidate).isFile()) return null;
    return realCandidate;
  } catch {
    return null;
  }
}

async function resolveActor(userId: string, activeRole: string): Promise<GovernedFileActor> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, departmentId: true, activeWorkspace: true, student: { select: { sectionId: true } } },
  });
  if (!user) throw new ForbiddenException('Active user is not available');
  return {
    userId,
    role: activeRole,
    workspace: user.activeWorkspace || activeRole,
    departmentId: user.departmentId,
    sectionId: user.student?.sectionId,
  };
}

async function getAncestorFolderIds(item: any): Promise<string[]> {
  const ids: string[] = [];
  let parentId = item?.parentId as string | null | undefined;
  for (let depth = 0; parentId && depth < 32; depth += 1) {
    if (ids.includes(parentId)) throw new BadRequestException('Drive folder cycle detected');
    ids.push(parentId);
    const parent = await prisma.campusDriveItem.findUnique({
      where: { id: parentId },
      select: { parentId: true },
    });
    parentId = parent?.parentId;
  }
  return ids;
}

export class GovernedFileService {
  static async authorizeFileAccess(input: AuthorizeFileAccessInput) {
    const actor = await resolveActor(input.userId, input.activeRole);
    const file = await prisma.mediaFile.findUnique({
      where: { id: input.fileId },
      include: { accessGrants: true },
    });
    if (!file) throw new NotFoundException('File not found');
    if (file.deletedAt && input.action !== 'MANAGE') throw new NotFoundException('File not found');

    if (file.ownerUserId === actor.userId) return { actor, file, source: 'OWNER' as const };
    if (actorHasGrantedAccess(file.accessGrants, actor, input.action)) {
      return { actor, file, source: 'DIRECT_FILE_GRANT' as const };
    }

    const driveItem = input.driveItemId
      ? await prisma.campusDriveItem.findFirst({
          where: { id: input.driveItemId, fileId: input.fileId },
          include: { accessGrants: true },
        })
      : await prisma.campusDriveItem.findFirst({
          where: { fileId: input.fileId, isTrashed: false },
          include: { accessGrants: true },
          orderBy: { createdAt: 'asc' },
        });

    if (driveItem) {
      if (driveItem.ownerId === actor.userId) return { actor, file, driveItem, source: 'DRIVE_ITEM_OWNER' as const };
      if (actorHasGrantedAccess(driveItem.accessGrants, actor, input.action)) {
        return { actor, file, driveItem, source: 'DIRECT_ITEM_GRANT' as const };
      }
      const ancestorIds = await getAncestorFolderIds(driveItem);
      if (ancestorIds.length) {
        const inherited = await prisma.governedFileAccessGrant.findMany({
          where: { driveItemId: { in: ancestorIds }, revokedAt: null },
        });
        if (actorHasGrantedAccess(inherited, actor, input.action)) {
          return { actor, file, driveItem, source: 'INHERITED_FOLDER_GRANT' as const };
        }
      }
    }

    if (input.parentResource) {
      const reference = await prisma.governedFileReference.findFirst({
        where: {
          fileId: input.fileId,
          module: input.parentResource.module,
          resourceType: input.parentResource.resourceType,
          resourceId: input.parentResource.resourceId,
          authorizationMode: 'PARENT_RESOURCE',
          deletedAt: null,
        },
      });
      if (reference && await input.parentResource.authorizeParentResource()) {
        return { actor, file, source: 'PARENT_RESOURCE' as const };
      }
    }

    throw new ForbiddenException(`You are not authorized to ${input.action.toLowerCase()} this file`);
  }

  static async authorizeDriveItem(userId: string, activeRole: string, item: any, action: GovernedFileAction) {
    const actor = await resolveActor(userId, activeRole);
    if (item.ownerId === userId) return true;
    const direct = item.accessGrants || await prisma.governedFileAccessGrant.findMany({ where: { driveItemId: item.id } });
    if (actorHasGrantedAccess(direct, actor, action)) return true;
    const ancestors = await getAncestorFolderIds(item);
    if (!ancestors.length) return false;
    const inherited = await prisma.governedFileAccessGrant.findMany({ where: { driveItemId: { in: ancestors } } });
    return actorHasGrantedAccess(inherited, actor, action);
  }

  static async listDriveItems(input: {
    userId: string;
    activeRole: string;
    scope?: string;
    parentId?: string | null;
    search?: string;
    includeTrashed?: boolean;
    action?: GovernedFileAction;
    limit?: number;
  }) {
    const scope = normalizeFileRole(input.scope || 'PERSONAL');
    const actor = await resolveActor(input.userId, input.activeRole);
    const isTrashView = Boolean(input.includeTrashed);
    const where: any = {
      ...(isTrashView ? {} : input.parentId ? { parentId: input.parentId } : { parentId: null }),
      ...(input.search ? { name: { contains: input.search, mode: 'insensitive' } } : {}),
      isTrashed: isTrashView,
    };
    if (scope === 'PERSONAL' || isTrashView) where.ownerId = input.userId;
    if (scope === 'DEPARTMENT' && !isTrashView) {
      if (!actor.departmentId) return [];
      where.departmentId = actor.departmentId;
    }
    if (scope === 'COLLEGE' && !isTrashView) where.scope = 'COLLEGE';

    const candidates = await (prisma.campusDriveItem as any).findMany({
      where,
      include: {
        accessGrants: true,
        file: { select: { id: true, originalName: true, mimeType: true, fileSize: true, checksum: true, deletedAt: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: [{ isFolder: 'desc' }, { updatedAt: 'desc' }],
      take: Math.min(Math.max(input.limit || 200, 1), 200),
    });

    const authorized: any[] = [];
    for (const item of candidates) {
      if (!isTrashView && item.file?.deletedAt) continue;
      if (scope === 'SHARED' && !isTrashView && item.ownerId === input.userId) continue;
      if (await this.authorizeDriveItem(input.userId, input.activeRole, item, input.action || 'VIEW')) {
        authorized.push(this.toClientDriveItem(item));
      }
    }
    return authorized;
  }

  static async listPickerFiles(input: {
    userId: string;
    activeRole: string;
    mode: 'DRIVE' | 'RECENT' | 'SHARED' | 'SEARCH';
    search?: string;
    action: GovernedFileAction;
    mimeTypes?: string[];
    maxSizeBytes?: number;
  }) {
    const actor = await resolveActor(input.userId, input.activeRole);
    const candidates = await (prisma.campusDriveItem as any).findMany({
      where: {
        isFolder: false,
        isTrashed: false,
        fileId: { not: null },
        ...(input.search ? { name: { contains: input.search, mode: 'insensitive' } } : {}),
        ...(input.mode === 'DRIVE' ? { ownerId: input.userId } : {}),
        ...(input.mode === 'SHARED' ? { ownerId: { not: input.userId } } : {}),
        ...(input.mimeTypes?.length ? { file: { mimeType: { in: input.mimeTypes }, deletedAt: null } } : { file: { deletedAt: null } }),
      },
      include: { file: true, accessGrants: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    const results: any[] = [];
    for (const item of candidates) {
      if (!item.file || (input.maxSizeBytes && item.file.fileSize > input.maxSizeBytes)) continue;
      if (await this.authorizeDriveItem(input.userId, input.activeRole, item, input.action)) {
        if (input.mode === 'SHARED' && item.ownerId === actor.userId) continue;
        results.push(this.toClientDriveItem(item));
      }
    }
    return results;
  }

  static async upload(input: {
    userId: string;
    activeRole: string;
    name: string;
    mimeType: string;
    base64: string;
    parentId?: string;
    scope?: string;
    sourceModule?: string;
  }) {
    const actor = await resolveActor(input.userId, input.activeRole);
    const setting = await prisma.systemSetting.findFirst({ where: { key: 'MAX_UPLOAD_SIZE' } });
    const maximum = setting ? Number.parseInt(setting.value, 10) : 25 * 1024 * 1024;
    const { originalName, extension, mimeType, buffer } = validateCommonUpload({
      name: input.name,
      mimeType: input.mimeType,
      base64: input.base64,
      maximumBytes: Number.isFinite(maximum) && maximum > 0 ? maximum : 25 * 1024 * 1024,
    });

    if (input.parentId) {
      const parent = await prisma.campusDriveItem.findUnique({ where: { id: input.parentId }, include: { accessGrants: true } });
      if (!parent?.isFolder || !(await this.authorizeDriveItem(input.userId, input.activeRole, parent, 'EDIT'))) {
        throw new ForbiddenException('You cannot upload to this folder');
      }
    }

    const scope = normalizeFileRole(input.scope || 'PERSONAL');
    if (!['PERSONAL', 'DEPARTMENT', 'COLLEGE'].includes(scope)) throw new BadRequestException('Invalid Drive scope');
    if (scope === 'DEPARTMENT' && !actor.departmentId) throw new ForbiddenException('Department scope is unavailable');
    if (scope === 'COLLEGE' && !['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(normalizeFileRole(input.activeRole))) {
      throw new ForbiddenException('Institution Drive upload is restricted');
    }

    const safeName = `${crypto.randomUUID()}${extension}`;
    const storageKey = canonicalStorageKey(`drive/${input.userId}/${safeName}`);
    const destination = path.resolve(storageRoot(), storageKey);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, buffer, { flag: 'wx' });
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    try {
      const created = await prisma.$transaction(async (tx) => {
        const file = await (tx as any).mediaFile.create({
          data: {
            name: safeName,
            path: `/uploads/${storageKey}`,
            storageKey,
            originalName,
            safeName,
            mimeType,
            fileSize: buffer.length,
            checksum,
            ownerUserId: input.userId,
            createdByUserId: input.userId,
            sourceModule: input.sourceModule || 'CAMPUS_DRIVE',
            folder: path.posix.dirname(storageKey),
          },
        });
        await (tx as any).governedFileVersion.create({
          data: {
            fileId: file.id,
            versionNumber: 1,
            storageKey,
            mimeType,
            sizeBytes: buffer.length,
            checksum,
            createdByUserId: input.userId,
            changeSummary: 'Initial upload',
          },
        });
        return (tx as any).campusDriveItem.create({
          data: {
            name: originalName,
            isFolder: false,
            parentId: input.parentId,
            mimeType,
            fileSize: buffer.length,
            fileId: file.id,
            ownerId: input.userId,
            departmentId: scope === 'DEPARTMENT' ? actor.departmentId : undefined,
            scope,
          },
          include: { file: true, accessGrants: true },
        });
      });
      await AuditService.log({
        actorId: input.userId,
        action: 'UPLOAD', entityType: 'FILE', entityId: created.fileId || undefined,
        description: `Uploaded governed file ${originalName}`,
        newValues: { driveItemId: created.id, storageKey, checksum, scope },
      });
      return this.toClientDriveItem(created);
    } catch (error) {
      try { fs.unlinkSync(destination); } catch { /* transaction cleanup only */ }
      throw error;
    }
  }

  static async createFolder(input: { userId: string; activeRole: string; name: string; parentId?: string; scope?: string }) {
    const name = input.name.trim();
    if (!name || name.length > 180) throw new BadRequestException('Folder name is required');
    const actor = await resolveActor(input.userId, input.activeRole);
    const scope = normalizeFileRole(input.scope || 'PERSONAL');
    if (!['PERSONAL', 'DEPARTMENT', 'COLLEGE'].includes(scope)) throw new BadRequestException('Invalid Drive scope');
    if (scope === 'DEPARTMENT' && !actor.departmentId) throw new ForbiddenException('Department scope is unavailable');
    if (scope === 'COLLEGE' && !['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL'].includes(normalizeFileRole(input.activeRole))) {
      throw new ForbiddenException('Institution Drive folder creation is restricted');
    }
    if (input.parentId) {
      const parent = await (prisma.campusDriveItem as any).findUnique({ where: { id: input.parentId }, include: { accessGrants: true } });
      if (!parent?.isFolder || !(await this.authorizeDriveItem(input.userId, input.activeRole, parent, 'EDIT'))) {
        throw new ForbiddenException('You cannot create a folder here');
      }
    }
    const item = await (prisma.campusDriveItem as any).create({
      data: {
        name, isFolder: true, parentId: input.parentId, ownerId: input.userId, scope,
        departmentId: scope === 'DEPARTMENT' ? actor.departmentId : undefined,
      },
      include: { accessGrants: true },
    });
    await AuditService.log({ actorId: input.userId, action: 'CREATE', entityType: 'DRIVE_FOLDER', entityId: item.id, description: `Created Drive folder ${name}` });
    return this.toClientDriveItem(item);
  }

  static async updateDriveItem(input: {
    userId: string; activeRole: string; itemId: string; name?: string; isStarred?: boolean;
    isTrashed?: boolean; parentId?: string | null;
  }) {
    const item = await (prisma.campusDriveItem as any).findUnique({ where: { id: input.itemId }, include: { accessGrants: true } });
    if (!item) throw new NotFoundException('Drive item not found');
    if (!(await this.authorizeDriveItem(input.userId, input.activeRole, item, input.isStarred !== undefined ? 'VIEW' : 'EDIT'))) {
      throw new ForbiddenException('You cannot update this Drive item');
    }
    if (input.name !== undefined) {
      const normalizedName = input.name.trim();
      if (!normalizedName || normalizedName.length > 180) {
        throw new BadRequestException('Drive item name must be between 1 and 180 characters');
      }
    }
    if (input.parentId && input.parentId === item.id) throw new BadRequestException('A folder cannot contain itself');
    if (input.parentId) {
      const parent = await (prisma.campusDriveItem as any).findUnique({ where: { id: input.parentId }, include: { accessGrants: true } });
      if (!parent?.isFolder || !(await this.authorizeDriveItem(input.userId, input.activeRole, parent, 'EDIT'))) {
        throw new ForbiddenException('You cannot move the item to this folder');
      }
      const ancestors = await getAncestorFolderIds(parent);
      if (ancestors.includes(item.id)) throw new BadRequestException('A folder cannot be moved into its descendant');
    }
    let targetParentId = input.parentId !== undefined ? input.parentId : item.parentId;
    if (input.isTrashed === false && targetParentId) {
      const parent = await (prisma.campusDriveItem as any).findUnique({ where: { id: targetParentId } });
      if (!parent || parent.isTrashed) {
        targetParentId = null;
      }
    }

    const updated = await (prisma.campusDriveItem as any).update({
      where: { id: item.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.isStarred !== undefined ? { isStarred: input.isStarred } : {}),
        ...(input.isTrashed !== undefined ? { isTrashed: input.isTrashed, trashedAt: input.isTrashed ? new Date() : null } : {}),
        parentId: targetParentId,
      },
      include: { file: true, accessGrants: true },
    });
    const action = input.isTrashed === true ? 'TRASH' : input.isTrashed === false ? 'RESTORE' : input.parentId !== undefined ? 'MOVE' : 'UPDATE';
    await AuditService.log({ actorId: input.userId, action, entityType: 'DRIVE_ITEM', entityId: item.id, description: `${action} Drive item ${item.name}` });
    return this.toClientDriveItem(updated);
  }

  static async share(input: {
    userId: string; activeRole: string; fileId: string; driveItemId?: string;
    principalType: string; principalId?: string; accessLevel: string; expiresAt?: string;
  }) {
    await this.authorizeFileAccess({ ...input, action: 'MANAGE' });
    if (input.driveItemId) {
      const targetItem = await prisma.campusDriveItem.findFirst({ where: { id: input.driveItemId, fileId: input.fileId, isFolder: false } });
      if (!targetItem) throw new BadRequestException('Drive item does not reference this file');
    }
    const principalType = normalizeFileRole(input.principalType);
    const accessLevel = normalizeFileRole(input.accessLevel);
    if (!PRINCIPAL_TYPES.has(principalType) || !ACCESS_LEVELS.has(accessLevel)) throw new BadRequestException('Invalid share permission');
    if (principalType !== 'ALL_INSTITUTION' && !input.principalId) throw new BadRequestException('principalId is required');
    if (principalType === 'SPECIFIC_USER') {
      const target = await prisma.user.findUnique({ where: { id: input.principalId }, select: { id: true } });
      if (!target) throw new BadRequestException('Share recipient does not exist');
    }
    const grant = await (prisma as any).governedFileAccessGrant.create({
      data: {
        fileId: input.fileId,
        driveItemId: input.driveItemId,
        principalType,
        principalId: principalType === 'ALL_INSTITUTION' ? null : input.principalId,
        accessLevel,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdByUserId: input.userId,
      },
    });
    await AuditService.log({ actorId: input.userId, action: 'SHARE', entityType: 'FILE', entityId: input.fileId, description: `Granted ${accessLevel} file access`, newValues: grant });
    if (principalType === 'SPECIFIC_USER' && input.principalId && input.principalId !== input.userId) {
      await NotificationService.sendNotification({
        recipientId: input.principalId,
        eventType: 'FILE_SHARED',
        title: 'A file was shared with you',
        message: `You received ${accessLevel.toLowerCase()} access to a Campus Drive file.`,
        relatedEntityType: 'FILE',
        relatedEntityId: input.fileId,
        deepLinkRoute: '/workspace/drive?scope=SHARED',
      });
    } else if (principalType !== 'SPECIFIC_USER') {
      await NotificationService.dispatchDomainEvent({
        eventType: 'FILE_SHARED', actorUserId: input.userId, entityType: 'FILE', entityId: input.fileId,
        title: principalType === 'ALL_INSTITUTION' ? 'Institution document published' : 'A file was shared with your group',
        body: 'A Campus Drive file is now available to your authorized workspace.',
        category: 'CIRCULARS', priority: 'NORMAL', deepLinkRoute: '/workspace/drive?scope=SHARED',
        metadata: { principalType, principalId: input.principalId || null, accessLevel },
      });
    }
    return grant;
  }

  static async revokeShare(input: { userId: string; activeRole: string; fileId: string; grantId: string }) {
    await this.authorizeFileAccess({ ...input, action: 'MANAGE' });
    const grant = await (prisma as any).governedFileAccessGrant.findFirst({ where: { id: input.grantId, fileId: input.fileId } });
    if (!grant) throw new NotFoundException('Share permission not found');
    const updated = await (prisma as any).governedFileAccessGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
    await AuditService.log({ actorId: input.userId, action: 'REVOKE', entityType: 'FILE', entityId: input.fileId, description: 'Revoked governed file access', previousValues: grant, newValues: updated });
    return updated;
  }

  static async shareDriveFolder(input: {
    userId: string; activeRole: string; itemId: string; principalType: string;
    principalId?: string; accessLevel: string; expiresAt?: string;
  }) {
    const item = await prisma.campusDriveItem.findUnique({ where: { id: input.itemId }, include: { accessGrants: true } });
    if (!item?.isFolder) throw new NotFoundException('Drive folder not found');
    if (!(await this.authorizeDriveItem(input.userId, input.activeRole, item, 'MANAGE'))) {
      throw new ForbiddenException('You cannot manage this folder');
    }
    const principalType = normalizeFileRole(input.principalType);
    const accessLevel = normalizeFileRole(input.accessLevel);
    if (!PRINCIPAL_TYPES.has(principalType) || !ACCESS_LEVELS.has(accessLevel)) throw new BadRequestException('Invalid folder permission');
    if (principalType !== 'ALL_INSTITUTION' && !input.principalId) throw new BadRequestException('principalId is required');
    if (principalType === 'SPECIFIC_USER') {
      const target = await prisma.user.findUnique({ where: { id: input.principalId }, select: { id: true } });
      if (!target) throw new BadRequestException('Share recipient does not exist');
    }
    const grant = await prisma.governedFileAccessGrant.create({
      data: {
        driveItemId: item.id, principalType,
        principalId: principalType === 'ALL_INSTITUTION' ? null : input.principalId,
        accessLevel, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        createdByUserId: input.userId,
      },
    });
    await AuditService.log({ actorId: input.userId, action: 'SHARE', entityType: 'DRIVE_FOLDER', entityId: item.id, description: `Granted inherited ${accessLevel} folder access`, newValues: grant });
    if (principalType === 'SPECIFIC_USER' && input.principalId && input.principalId !== input.userId) {
      await NotificationService.sendNotification({
        recipientId: input.principalId, eventType: 'FILE_SHARED', title: 'A Drive folder was shared with you',
        message: `You received ${accessLevel.toLowerCase()} access to a Campus Drive folder.`,
        relatedEntityType: 'DRIVE_FOLDER', relatedEntityId: item.id, deepLinkRoute: '/workspace/drive?scope=SHARED',
      });
    } else if (principalType !== 'SPECIFIC_USER') {
      await NotificationService.dispatchDomainEvent({
        eventType: 'FILE_SHARED', actorUserId: input.userId, entityType: 'DRIVE_FOLDER', entityId: item.id,
        title: principalType === 'ALL_INSTITUTION' ? 'Institution folder published' : 'A Drive folder was shared with your group',
        body: 'A Campus Drive folder is now available to your authorized workspace.',
        category: 'CIRCULARS', priority: 'NORMAL', deepLinkRoute: '/workspace/drive?scope=SHARED',
        metadata: { principalType, principalId: input.principalId || null, accessLevel },
      });
    }
    return grant;
  }

  static async revokeDriveFolderShare(input: { userId: string; activeRole: string; itemId: string; grantId: string }) {
    const item = await prisma.campusDriveItem.findUnique({ where: { id: input.itemId }, include: { accessGrants: true } });
    if (!item?.isFolder) throw new NotFoundException('Drive folder not found');
    if (!(await this.authorizeDriveItem(input.userId, input.activeRole, item, 'MANAGE'))) throw new ForbiddenException('You cannot manage this folder');
    const grant = await prisma.governedFileAccessGrant.findFirst({ where: { id: input.grantId, driveItemId: item.id } });
    if (!grant) throw new NotFoundException('Folder permission not found');
    const updated = await prisma.governedFileAccessGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
    await AuditService.log({ actorId: input.userId, action: 'REVOKE', entityType: 'DRIVE_FOLDER', entityId: item.id, description: 'Revoked inherited Drive folder access', previousValues: grant, newValues: updated });
    return updated;
  }

  static async attachReference(input: {
    userId: string; activeRole: string; fileId: string; module: string; resourceType: string;
    resourceId: string; purpose: string; authorizationMode?: 'FILE_ACL' | 'PARENT_RESOURCE'; requiredAction?: GovernedFileAction;
  }) {
    await this.authorizeFileAccess({ ...input, action: input.requiredAction || 'VIEW' });
    const purpose = normalizeFileRole(input.purpose);
    if (!ATTACH_PURPOSES.has(purpose)) throw new BadRequestException('Unsupported attachment purpose');
    const reference = await (prisma as any).governedFileReference.upsert({
      where: {
        fileId_module_resourceType_resourceId_purpose: {
          fileId: input.fileId, module: input.module, resourceType: input.resourceType,
          resourceId: input.resourceId, purpose,
        },
      },
      update: { deletedAt: null, authorizationMode: input.authorizationMode || 'FILE_ACL' },
      create: {
        fileId: input.fileId, module: input.module, resourceType: input.resourceType,
        resourceId: input.resourceId, purpose, authorizationMode: input.authorizationMode || 'FILE_ACL',
        createdByUserId: input.userId,
      },
    });
    await AuditService.log({ actorId: input.userId, action: 'ATTACH_REFERENCE', entityType: 'FILE', entityId: input.fileId, description: `Attached existing governed file to ${input.resourceType}`, newValues: reference });
    return reference;
  }

  static async requestPermanentDelete(input: { userId: string; activeRole: string; fileId: string; driveItemId: string }) {
    await this.authorizeFileAccess({ ...input, action: 'MANAGE' });
    const item = await (prisma.campusDriveItem as any).findUnique({ where: { id: input.driveItemId } });
    if (!item) throw new NotFoundException('Drive item not found');
    if (!item.isTrashed) {
      throw new BadRequestException('Item must be moved to Trash before it can be permanently deleted');
    }

    const [references, otherItems] = await Promise.all([
      (prisma as any).governedFileReference.count({ where: { fileId: input.fileId, deletedAt: null } }),
      (prisma as any).campusDriveItem.count({ where: { fileId: input.fileId, id: { not: input.driveItemId } } }),
    ]);
    if (references || otherItems) {
      throw new BadRequestException('File is still referenced by active system records and cannot be permanently deleted');
    }
    await prisma.$transaction([
      (prisma as any).campusDriveItem.delete({ where: { id: input.driveItemId } }),
      (prisma as any).mediaFile.update({ where: { id: input.fileId }, data: { deletedAt: new Date() } }),
    ]);
    await AuditService.log({ actorId: input.userId, action: 'DELETE', entityType: 'FILE', entityId: input.fileId, description: 'Placed governed file into retention quarantine after permanent-delete authorization' });
    return { deleted: true, physicalDeletion: false, retentionState: 'QUARANTINED' };
  }

  static async permanentlyDeleteFolder(input: { userId: string; activeRole: string; driveItemId: string }) {
    const item = await (prisma.campusDriveItem as any).findUnique({
      where: { id: input.driveItemId },
      include: { accessGrants: true },
    });
    if (!item?.isFolder) throw new NotFoundException('Drive folder not found');
    if (!(await this.authorizeDriveItem(input.userId, input.activeRole, item, 'MANAGE'))) {
      throw new ForbiddenException('You cannot permanently delete this folder');
    }
    if (!item.isTrashed) {
      throw new BadRequestException('Folder must be moved to Trash before permanent deletion');
    }
    const childCount = await (prisma.campusDriveItem as any).count({ where: { parentId: item.id } });
    if (childCount > 0) {
      throw new BadRequestException('Restore this folder and remove or relocate its contents before permanent deletion');
    }
    await (prisma.campusDriveItem as any).delete({ where: { id: item.id } });
    await AuditService.log({
      actorId: input.userId,
      action: 'PERMANENT_DELETE',
      entityType: 'DRIVE_FOLDER',
      entityId: item.id,
      description: `Permanently deleted empty Drive folder ${item.name}`,
    });
    return { deleted: true, physicalDeletion: true };
  }

  static toClientDriveItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      isFolder: item.isFolder,
      parentId: item.parentId,
      fileId: item.fileId,
      mimeType: item.file?.mimeType || item.mimeType,
      fileSize: item.file?.fileSize ?? item.fileSize,
      checksum: item.file?.checksum,
      documentId: item.documentId,
      ownerId: item.ownerId,
      owner: item.owner,
      scope: item.scope,
      isStarred: item.isStarred,
      isTrashed: item.isTrashed,
      trashedAt: item.trashedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      downloadUrl: item.fileId ? `/api/files/${item.fileId}/download?driveItemId=${encodeURIComponent(item.id)}` : item.fileUrl,
    };
  }
}
