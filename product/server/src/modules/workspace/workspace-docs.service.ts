import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { loadActorContext } from './workspace-context';
import { resolveAccess, atLeast } from './workspace-permissions';
import { logWorkspaceAudit } from './workspace-audit';
import { sanitizeDocHtml } from './html-sanitizer';
import { DOC_TEMPLATE_BY_KEY } from './workspace-templates';
import { resolveMergeFields, applyMergeFields } from './workspace-merge-fields';

type Meta = { ip?: string; userAgent?: string };

export class WorkspaceDocsService {
  async create(userId: string, input: { name: string; folderId?: string; scope?: string; departmentId?: string; templateKey?: string }, meta: Meta) {
    const ctx = await loadActorContext(userId);
    if (!input.name?.trim()) throw new BadRequestException('Document name is required');
    const scope = input.scope ?? 'PERSONAL';
    if ((scope === 'DEPARTMENT' || scope === 'INSTITUTION') && !['Super Admin', 'College Admin', 'HOD', 'Head of Department', 'Principal', 'Faculty'].includes(ctx.roleName ?? '')) {
      throw new ForbiddenException('You do not have permission to create shared documents');
    }

    const template = input.templateKey ? DOC_TEMPLATE_BY_KEY.get(input.templateKey) : null;
    let content = sanitizeDocHtml(template?.html ?? '<p></p>');
    if (template) {
      const fields = await resolveMergeFields({ userId: ctx.userId, departmentId: ctx.departmentId });
      content = applyMergeFields(content, fields);
    }

    const file = await prisma.workspaceFile.create({
      data: {
        name: input.name.trim(), type: 'DOCUMENT', ownerId: ctx.userId, folderId: input.folderId ?? null,
        scope, departmentId: scope === 'DEPARTMENT' ? (input.departmentId ?? ctx.departmentId) : null,
        content, templateKey: input.templateKey ?? null,
      },
    });
    await prisma.workspaceFileVersion.create({ data: { fileId: file.id, version: 1, content, editorId: ctx.userId, changeNote: 'Created' } });
    await logWorkspaceAudit(ctx.userId, meta, 'CREATE', 'WORKSPACE_FILE', file.id, `Created document "${file.name}"`);
    return file;
  }

  private async loadWithAccess(userId: string, fileId: string, need: 'VIEWER' | 'COMMENTER' | 'EDITOR' = 'VIEWER') {
    const ctx = await loadActorContext(userId);
    const file = await prisma.workspaceFile.findUnique({ where: { id: fileId }, include: { shares: true } });
    if (!file || file.deletedAt || file.type !== 'DOCUMENT') throw new NotFoundException('Document not found');
    const access = resolveAccess(file, file.shares as any, ctx);
    if (!access || !atLeast(access, need)) throw new ForbiddenException('You do not have sufficient access to this document');
    return { file, access, ctx };
  }

  async get(userId: string, fileId: string) {
    const { file, access } = await this.loadWithAccess(userId, fileId, 'VIEWER');
    return { ...file, access };
  }

  // Autosave — frequent, no version checkpoint, no audit noise.
  async saveContent(userId: string, fileId: string, content: string) {
    const { file } = await this.loadWithAccess(userId, fileId, 'EDITOR');
    const clean = sanitizeDocHtml(content);
    const updated = await prisma.workspaceFile.update({ where: { id: fileId }, data: { content: clean } });
    return { id: updated.id, updatedAt: updated.updatedAt };
  }

  // Explicit checkpoint — bumps version and is what "Version History" / restore operate on.
  async saveVersion(userId: string, fileId: string, changeNote: string | undefined, meta: Meta) {
    const { file, ctx } = await this.loadWithAccess(userId, fileId, 'EDITOR');
    const nextVersion = file.currentVersion + 1;
    await prisma.$transaction([
      prisma.workspaceFileVersion.create({ data: { fileId, version: nextVersion, content: file.content, editorId: ctx.userId, changeNote } }),
      prisma.workspaceFile.update({ where: { id: fileId }, data: { currentVersion: nextVersion } }),
    ]);
    await logWorkspaceAudit(ctx.userId, meta, 'VERSION', 'WORKSPACE_FILE', fileId, `Saved version ${nextVersion}${changeNote ? `: ${changeNote}` : ''}`);
    return { version: nextVersion };
  }

  async listVersions(userId: string, fileId: string) {
    await this.loadWithAccess(userId, fileId, 'VIEWER');
    return prisma.workspaceFileVersion.findMany({ where: { fileId }, orderBy: { version: 'desc' } });
  }

  async restoreVersion(userId: string, fileId: string, version: number, meta: Meta) {
    const { file, ctx } = await this.loadWithAccess(userId, fileId, 'EDITOR');
    const target = await prisma.workspaceFileVersion.findFirst({ where: { fileId, version } });
    if (!target) throw new NotFoundException('Version not found');
    const nextVersion = file.currentVersion + 1;
    await prisma.$transaction([
      prisma.workspaceFile.update({ where: { id: fileId }, data: { content: target.content, currentVersion: nextVersion } }),
      prisma.workspaceFileVersion.create({ data: { fileId, version: nextVersion, content: target.content, editorId: ctx.userId, changeNote: `Restored from version ${version}` } }),
    ]);
    await logWorkspaceAudit(ctx.userId, meta, 'VERSION_RESTORE', 'WORKSPACE_FILE', fileId, `Restored version ${version} (as new version ${nextVersion})`);
    return { version: nextVersion };
  }

  async refreshMergeFields(userId: string, fileId: string) {
    const { file, ctx } = await this.loadWithAccess(userId, fileId, 'EDITOR');
    const fields = await resolveMergeFields({ userId: ctx.userId, departmentId: file.departmentId ?? ctx.departmentId });
    const content = applyMergeFields(file.content ?? '', fields);
    const updated = await prisma.workspaceFile.update({ where: { id: fileId }, data: { content } });
    return { content: updated.content };
  }

  async listComments(userId: string, fileId: string) {
    await this.loadWithAccess(userId, fileId, 'VIEWER');
    return prisma.workspaceComment.findMany({ where: { fileId, parentId: null }, orderBy: { createdAt: 'asc' }, include: { replies: { orderBy: { createdAt: 'asc' } } } });
  }

  async addComment(userId: string, fileId: string, body: string, parentId: string | undefined, meta: Meta) {
    const { ctx } = await this.loadWithAccess(userId, fileId, 'COMMENTER');
    if (!body?.trim()) throw new BadRequestException('Comment body is required');
    const comment = await prisma.workspaceComment.create({ data: { fileId, authorId: ctx.userId, body: body.trim(), parentId: parentId ?? null } });
    await logWorkspaceAudit(ctx.userId, meta, 'COMMENT', 'WORKSPACE_FILE', fileId, 'Added a comment');
    return comment;
  }

  async resolveComment(userId: string, fileId: string, commentId: string, resolved: boolean) {
    await this.loadWithAccess(userId, fileId, 'COMMENTER');
    return prisma.workspaceComment.update({ where: { id: commentId }, data: { resolved } });
  }

  // Simple single-reviewer submit -> approve/return workflow. A full multi-
  // stage engine integration (per spec section 20) is a follow-up: this
  // gives documents a real, auditable review loop today.
  async setStatus(userId: string, fileId: string, status: 'SUBMITTED' | 'RETURNED' | 'APPROVED' | 'DRAFT', note: string | undefined, meta: Meta) {
    const need = status === 'SUBMITTED' || status === 'DRAFT' ? 'EDITOR' : 'COMMENTER';
    const { file, ctx } = await this.loadWithAccess(userId, fileId, need as any);
    if (status === 'RETURNED' || status === 'APPROVED') {
      if (file.ownerId === ctx.userId) throw new ForbiddenException('The owner cannot review their own submission');
    }
    const updated = await prisma.workspaceFile.update({ where: { id: fileId }, data: { status } });
    await logWorkspaceAudit(ctx.userId, meta, 'STATUS', 'WORKSPACE_FILE', fileId, `Status changed to ${status}${note ? `: ${note}` : ''}`);
    if (note) await this.addComment(userId, fileId, `[${status}] ${note}`, undefined, meta);
    return updated;
  }
}

export const workspaceDocsService = new WorkspaceDocsService();
