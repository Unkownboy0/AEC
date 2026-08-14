import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { loadActorContext } from './workspace-context';
import { resolveAccess, atLeast, ActorCtx } from './workspace-permissions';
import { logWorkspaceAudit } from './workspace-audit';

type Meta = { ip?: string; userAgent?: string };

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed', 'text/plain',
]);
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.csv', '.xls', '.docx', '.pptx', '.zip', '.txt']);
const BLOCKED_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.sh', '.js', '.ts', '.php', '.py', '.rb', '.jar', '.war', '.dll', '.so', '.msi', '.vbs', '.ps1', '.wsf', '.com', '.scr', '.pif', '.hta', '.cpl', '.inf', '.reg']);

const uploadsDir = path.resolve(process.env.STORAGE_ROOT || path.join(__dirname, '../../../uploads'), 'workspace');

const ensureDir = () => {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
};

const accessibleFilesWhere = (ctx: ActorCtx, excludeOwned = false) => ({
  AND: [
    excludeOwned ? { ownerId: { not: ctx.userId } } : {},
    {
      OR: [
        ...(excludeOwned ? [] : [{ ownerId: ctx.userId }]),
        { scope: 'INSTITUTION' },
        ...(ctx.departmentId ? [{ scope: 'DEPARTMENT', departmentId: ctx.departmentId }] : []),
        {
          shares: {
            some: {
              OR: [
                { scope: 'USER', userId: ctx.userId },
                ...(ctx.roleName ? [{ scope: 'ROLE', roleName: ctx.roleName }] : []),
                ...(ctx.departmentId ? [{ scope: 'DEPARTMENT', departmentId: ctx.departmentId }] : []),
                { scope: 'INSTITUTION' },
              ],
            },
          },
        },
      ],
    },
  ],
});

export class WorkspaceDriveService {
  async listFiles(userId: string, params: { view?: string; folderId?: string; type?: string; q?: string; dateFrom?: string; dateTo?: string }) {
    const ctx = await loadActorContext(userId);
    const view = params.view ?? 'all';
    const base: any = { deletedAt: view === 'trash' ? { not: null } : null, archived: view === 'trash' ? undefined : false };
    if (params.type) base.type = params.type;
    if (params.q) base.name = { contains: params.q, mode: 'insensitive' };
    if (params.dateFrom || params.dateTo) {
      base.createdAt = {};
      if (params.dateFrom) base.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) base.createdAt.lte = new Date(params.dateTo);
    }
    if (params.folderId) base.folderId = params.folderId;

    let where: any = base;
    let orderBy: any = { updatedAt: 'desc' };
    let take: number | undefined;

    if (view === 'my') where = { ...base, ownerId: ctx.userId };
    else if (view === 'trash') where = { ...base, ownerId: ctx.userId };
    else if (view === 'starred') where = { ...base, stars: { some: { userId: ctx.userId } } };
    else if (view === 'shared') where = { ...base, ...accessibleFilesWhere(ctx, true) };
    else if (view === 'department') where = { ...base, scope: 'DEPARTMENT', departmentId: ctx.departmentId };
    else if (view === 'institution') where = { ...base, scope: 'INSTITUTION' };
    else if (view === 'recent') { where = { ...base, ...accessibleFilesWhere(ctx) }; take = 20; }
    else where = { ...base, ...accessibleFilesWhere(ctx) };

    const [files, stars] = await Promise.all([
      prisma.workspaceFile.findMany({ where, orderBy, take, select: { id: true, name: true, type: true, ownerId: true, departmentId: true, folderId: true, scope: true, status: true, mimeType: true, fileSize: true, currentVersion: true, createdAt: true, updatedAt: true } }),
      prisma.workspaceStar.findMany({ where: { userId: ctx.userId }, select: { fileId: true } }),
    ]);
    const starred = new Set(stars.map((s) => s.fileId));
    return files.map((f) => ({ ...f, starred: starred.has(f.id) }));
  }

  async listFolders(userId: string, parentId?: string) {
    const ctx = await loadActorContext(userId);
    return prisma.workspaceFolder.findMany({
      where: {
        deletedAt: null,
        parentId: parentId ?? null,
        OR: [{ ownerId: ctx.userId }, { scope: 'INSTITUTION' }, ...(ctx.departmentId ? [{ scope: 'DEPARTMENT', departmentId: ctx.departmentId }] : [])],
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(userId: string, input: { name: string; parentId?: string; scope?: string; departmentId?: string }, meta: Meta) {
    const ctx = await loadActorContext(userId);
    if (!input.name?.trim()) throw new BadRequestException('Folder name is required');
    const scope = input.scope ?? 'PERSONAL';
    if ((scope === 'DEPARTMENT' || scope === 'INSTITUTION') && !['Super Admin', 'College Admin', 'HOD', 'Head of Department', 'Principal'].includes(ctx.roleName ?? '')) {
      throw new ForbiddenException('You do not have permission to create shared folders');
    }
    const folder = await prisma.workspaceFolder.create({
      data: { name: input.name.trim(), parentId: input.parentId ?? null, ownerId: ctx.userId, scope, departmentId: scope === 'DEPARTMENT' ? (input.departmentId ?? ctx.departmentId) : null },
    });
    await logWorkspaceAudit(ctx.userId, meta, 'CREATE', 'WORKSPACE_FOLDER', folder.id, `Created folder "${folder.name}"`);
    return folder;
  }

  private async assertFolderOwner(userId: string, folderId: string) {
    const folder = await prisma.workspaceFolder.findUnique({ where: { id: folderId } });
    if (!folder || folder.deletedAt) throw new NotFoundException('Folder not found');
    if (folder.ownerId !== userId) throw new ForbiddenException('Only the folder owner can manage it');
    return folder;
  }

  async renameFolder(userId: string, folderId: string, name: string, meta: Meta) {
    await this.assertFolderOwner(userId, folderId);
    const folder = await prisma.workspaceFolder.update({ where: { id: folderId }, data: { name } });
    await logWorkspaceAudit(userId, meta, 'UPDATE', 'WORKSPACE_FOLDER', folder.id, `Renamed folder to "${name}"`);
    return folder;
  }

  async trashFolder(userId: string, folderId: string, meta: Meta) {
    await this.assertFolderOwner(userId, folderId);
    const folder = await prisma.workspaceFolder.update({ where: { id: folderId }, data: { deletedAt: new Date() } });
    await logWorkspaceAudit(userId, meta, 'DELETE', 'WORKSPACE_FOLDER', folder.id, `Moved folder "${folder.name}" to trash`);
    return folder;
  }

  private async fileWithAccess(userId: string, fileId: string) {
    const ctx = await loadActorContext(userId);
    const file = await prisma.workspaceFile.findUnique({ where: { id: fileId }, include: { shares: true } });
    if (!file || file.deletedAt) throw new NotFoundException('File not found');
    const access = resolveAccess(file, file.shares as any, ctx);
    if (!access) throw new ForbiddenException('You do not have access to this file');
    return { file, access, ctx };
  }

  async getFileWithAccess(userId: string, fileId: string) {
    return this.fileWithAccess(userId, fileId);
  }

  async renameFile(userId: string, fileId: string, name: string, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'EDITOR')) throw new ForbiddenException('Editor access is required to rename this file');
    const file = await prisma.workspaceFile.update({ where: { id: fileId }, data: { name } });
    await logWorkspaceAudit(userId, meta, 'UPDATE', 'WORKSPACE_FILE', file.id, `Renamed file to "${name}"`);
    return file;
  }

  async moveFile(userId: string, fileId: string, folderId: string | null, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'EDITOR')) throw new ForbiddenException('Editor access is required to move this file');
    const file = await prisma.workspaceFile.update({ where: { id: fileId }, data: { folderId } });
    await logWorkspaceAudit(userId, meta, 'UPDATE', 'WORKSPACE_FILE', file.id, 'Moved file');
    return file;
  }

  async archiveFile(userId: string, fileId: string, archived: boolean, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'OWNER')) throw new ForbiddenException('Only the owner can archive this file');
    const file = await prisma.workspaceFile.update({ where: { id: fileId }, data: { archived } });
    await logWorkspaceAudit(userId, meta, 'UPDATE', 'WORKSPACE_FILE', file.id, archived ? 'Archived file' : 'Restored file from archive');
    return file;
  }

  async trashFile(userId: string, fileId: string, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'OWNER')) throw new ForbiddenException('Only the owner can delete this file');
    const file = await prisma.workspaceFile.update({ where: { id: fileId }, data: { deletedAt: new Date() } });
    await logWorkspaceAudit(userId, meta, 'DELETE', 'WORKSPACE_FILE', file.id, `Moved "${file.name}" to trash`);
    return file;
  }

  async restoreFile(userId: string, fileId: string, meta: Meta) {
    const file = await prisma.workspaceFile.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException('File not found');
    if (file.ownerId !== userId) throw new ForbiddenException('Only the owner can restore this file');
    const restored = await prisma.workspaceFile.update({ where: { id: fileId }, data: { deletedAt: null } });
    await logWorkspaceAudit(userId, meta, 'UPDATE', 'WORKSPACE_FILE', restored.id, `Restored "${restored.name}" from trash`);
    return restored;
  }

  async toggleStar(userId: string, fileId: string, starred: boolean) {
    await this.fileWithAccess(userId, fileId);
    if (starred) {
      await prisma.workspaceStar.upsert({ where: { fileId_userId: { fileId, userId } }, update: {}, create: { fileId, userId } });
    } else {
      await prisma.workspaceStar.deleteMany({ where: { fileId, userId } });
    }
    return { starred };
  }

  async listShares(userId: string, fileId: string) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'OWNER')) throw new ForbiddenException('Only the owner can manage sharing');
    return prisma.workspaceShare.findMany({ where: { fileId } });
  }

  async share(userId: string, fileId: string, input: { scope: string; userId?: string; roleName?: string; departmentId?: string; permission: string }, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'OWNER')) throw new ForbiddenException('Only the owner can manage sharing');
    if (!['USER', 'ROLE', 'DEPARTMENT', 'INSTITUTION'].includes(input.scope)) throw new BadRequestException('Invalid share scope');
    if (!['VIEWER', 'COMMENTER', 'EDITOR'].includes(input.permission)) throw new BadRequestException('Invalid permission level');
    const target = input.scope === 'USER' ? input.userId : input.scope === 'ROLE' ? input.roleName : input.scope === 'DEPARTMENT' ? input.departmentId : 'ALL';
    if (input.scope !== 'INSTITUTION' && !target) throw new BadRequestException(`${input.scope.toLowerCase()} target is required`);

    const share = await prisma.workspaceShare.create({
      data: {
        fileId,
        scope: input.scope,
        userId: input.scope === 'USER' ? input.userId : null,
        roleName: input.scope === 'ROLE' ? input.roleName : null,
        departmentId: input.scope === 'DEPARTMENT' ? input.departmentId : null,
        permission: input.permission,
      },
    });
    await logWorkspaceAudit(userId, meta, 'SHARE', 'WORKSPACE_FILE', fileId, `Shared with ${input.scope}:${target} as ${input.permission}`);
    return share;
  }

  async removeShare(userId: string, fileId: string, shareId: string, meta: Meta) {
    const { access } = await this.fileWithAccess(userId, fileId);
    if (!atLeast(access, 'OWNER')) throw new ForbiddenException('Only the owner can manage sharing');
    await prisma.workspaceShare.delete({ where: { id: shareId } });
    await logWorkspaceAudit(userId, meta, 'UNSHARE', 'WORKSPACE_FILE', fileId, 'Removed a share');
    return { removed: true };
  }

  async upload(userId: string, input: { name: string; mimeType: string; base64: string; folderId?: string; scope?: string; departmentId?: string }, meta: Meta) {
    const ctx = await loadActorContext(userId);
    const { name, mimeType, base64 } = input;
    if (!name || !mimeType || !base64) throw new BadRequestException('name, mimeType and base64 fields are required');
    if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) throw new BadRequestException(`File type "${mimeType}" is not allowed`);
    const ext = path.extname(name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) throw new BadRequestException(`File extension "${ext}" is not allowed`);
    const parts = name.split('.');
    if (parts.length > 2) {
      const secondToLast = '.' + parts[parts.length - 2].toLowerCase();
      if (BLOCKED_EXTENSIONS.has(secondToLast) || BLOCKED_EXTENSIONS.has(ext)) throw new BadRequestException('Suspicious file name detected');
    }
    if (name.includes('\0') || name.includes('%00')) throw new BadRequestException('Invalid file name');

    const buffer = Buffer.from(base64, 'base64');
    const maxSetting = await prisma.systemSetting.findFirst({ where: { key: 'MAX_UPLOAD_SIZE' } });
    const maxSize = maxSetting ? parseInt(maxSetting.value, 10) : 25 * 1024 * 1024;
    if (buffer.length > maxSize) throw new BadRequestException(`File exceeds the allowed size limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);

    ensureDir();
    const storedName = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer);

    const scope = input.scope ?? 'PERSONAL';
    const file = await prisma.workspaceFile.create({
      data: {
        name, type: 'UPLOAD', ownerId: ctx.userId, folderId: input.folderId ?? null,
        scope, departmentId: scope === 'DEPARTMENT' ? (input.departmentId ?? ctx.departmentId) : null,
        mimeType, fileSize: buffer.length, storageKey: storedName,
      },
    });
    await logWorkspaceAudit(ctx.userId, meta, 'CREATE', 'WORKSPACE_FILE', file.id, `Uploaded "${name}"`);
    return file;
  }

  async download(userId: string, fileId: string) {
    const { file } = await this.fileWithAccess(userId, fileId);
    if (file.type !== 'UPLOAD' || !file.storageKey) throw new BadRequestException('This file has no downloadable content');
    const physicalPath = path.join(uploadsDir, file.storageKey);
    const relativeToRoot = path.relative(uploadsDir, physicalPath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) throw new BadRequestException('Invalid stored file path');
    if (!fs.existsSync(physicalPath)) throw new NotFoundException('File content not found');
    return { physicalPath, name: file.name, mimeType: file.mimeType || 'application/octet-stream' };
  }
}

export const workspaceDriveService = new WorkspaceDriveService();
