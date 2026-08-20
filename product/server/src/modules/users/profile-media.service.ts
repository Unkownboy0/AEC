import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { resolveGovernedPhysicalPath } from '../campus-workspace/governed-file.service';
import { validateCommonUpload } from '../files/file-upload.validation';

const PROFILE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PROFILE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

function storageRoot(): string {
  return path.resolve(process.env.STORAGE_ROOT || path.join(__dirname, '../../../uploads'));
}

export function profileImageDescriptor(user: {
  id: string;
  profileImageFileId?: string | null;
  profileImageFile?: { checksum?: string | null; updatedAt?: Date | string; currentVersion?: number } | null;
  profilePhoto?: string | null;
}) {
  if (user.profileImageFileId && user.profileImageFile) {
    const version = user.profileImageFile.checksum?.slice(0, 16)
      || String(user.profileImageFile.currentVersion || new Date(user.profileImageFile.updatedAt || 0).getTime());
    const url = `/users/${user.id}/avatar?v=${encodeURIComponent(version)}`;
    return { fileId: user.profileImageFileId, url, thumbnailUrl: url, version };
  }

  // Read-only compatibility for old accounts. New writes never store URLs here.
  const legacyUrl = user.profilePhoto || null;
  return { fileId: null, url: legacyUrl, thumbnailUrl: legacyUrl, version: null };
}

export class ProfileMediaService {
  static async resolveInternalPhysicalPath(fileId?: string | null): Promise<string | null> {
    if (!fileId) return null;
    const file = await (prisma.mediaFile as any).findFirst({
      where: { id: fileId, sourceModule: 'PROFILE_AVATAR', deletedAt: null, archivedAt: null },
    });
    return file ? resolveGovernedPhysicalPath(file.storageKey || file.path) : null;
  }

  static async upload(userId: string, input: { name: string; mimeType: string; base64: string }, req?: any) {
    const existingUser = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { id: true, profileImageFileId: true },
    });
    if (!existingUser) throw new NotFoundException('User profile not found');

    const validated = validateCommonUpload({
      ...input,
      maximumBytes: MAX_PROFILE_IMAGE_BYTES,
      allowedMimeTypes: PROFILE_MIME_TYPES,
      allowedExtensions: PROFILE_EXTENSIONS,
    });
    const safeName = `${crypto.randomUUID()}${validated.extension}`;
    const storageKey = `profiles/${userId}/${safeName}`;
    const destination = path.resolve(storageRoot(), storageKey);
    const root = storageRoot();
    const relative = path.relative(root, destination);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new BadRequestException('Invalid profile image storage target');

    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, validated.buffer, { flag: 'wx' });
    const checksum = crypto.createHash('sha256').update(validated.buffer).digest('hex');

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const file = await (tx.mediaFile as any).create({
          data: {
            name: safeName,
            path: `/uploads/${storageKey}`,
            storageKey,
            originalName: validated.originalName,
            safeName,
            mimeType: validated.mimeType,
            fileSize: validated.buffer.length,
            checksum,
            ownerUserId: userId,
            createdByUserId: userId,
            sourceModule: 'PROFILE_AVATAR',
            folder: `profiles/${userId}`,
          },
        });
        await (tx.governedFileVersion as any).create({
          data: {
            fileId: file.id,
            versionNumber: 1,
            storageKey,
            mimeType: validated.mimeType,
            sizeBytes: validated.buffer.length,
            checksum,
            createdByUserId: userId,
            changeSummary: 'Profile image upload',
          },
        });
        const user = await (tx.user as any).update({
          where: { id: userId },
          data: { profileImageFileId: file.id, profilePhoto: null },
          include: { profileImageFile: true },
        });
        if (existingUser.profileImageFileId && existingUser.profileImageFileId !== file.id) {
          await (tx.mediaFile as any).update({
            where: { id: existingUser.profileImageFileId },
            data: { archivedAt: new Date() },
          }).catch(() => null);
        }
        return user;
      });
      await AuditService.log({
        actorId: userId,
        action: 'UPDATE', entityType: 'USER', entityId: userId,
        description: 'Updated canonical profile image',
        previousValues: { profileImageFileId: existingUser.profileImageFileId },
        newValues: { profileImageFileId: updated.profileImageFileId, checksum },
        req,
      });
      return profileImageDescriptor(updated);
    } catch (error) {
      try { fs.unlinkSync(destination); } catch { /* database failure cleanup */ }
      throw error;
    }
  }

  static async remove(userId: string, req?: any) {
    const current = await (prisma.user as any).findUnique({ where: { id: userId }, select: { profileImageFileId: true } });
    if (!current) throw new NotFoundException('User profile not found');
    await prisma.$transaction(async (tx) => {
      await (tx.user as any).update({ where: { id: userId }, data: { profileImageFileId: null, profilePhoto: null } });
      if (current.profileImageFileId) {
        await (tx.mediaFile as any).update({ where: { id: current.profileImageFileId }, data: { archivedAt: new Date() } }).catch(() => null);
      }
    });
    await AuditService.log({
      actorId: userId, action: 'UPDATE', entityType: 'USER', entityId: userId,
      description: 'Removed canonical profile image',
      previousValues: { profileImageFileId: current.profileImageFileId },
      newValues: { profileImageFileId: null }, req,
    });
    return { fileId: null, url: null, thumbnailUrl: null, version: null };
  }

  static async stream(viewerUserId: string, targetUserId: string, res: Response) {
    if (!viewerUserId) throw new NotFoundException('Profile image not found');
    
    let resolvedUserId = targetUserId;
    
    try {
      const student = await prisma.student.findUnique({
        where: { id: targetUserId },
        select: { userId: true },
      });
      if (student?.userId) {
        resolvedUserId = student.userId;
      } else {
        const faculty = await prisma.faculty.findUnique({
          where: { id: targetUserId },
          select: { userId: true },
        });
        if (faculty?.userId) {
          resolvedUserId = faculty.userId;
        }
      }
    } catch (_) {}

    const target = await (prisma.user as any).findFirst({
      where: { id: resolvedUserId, status: 'ACTIVE' },
      select: { profileImageFile: true },
    });
    const file = target?.profileImageFile;
    if (!file || file.deletedAt || file.archivedAt || file.sourceModule !== 'PROFILE_AVATAR') {
      throw new NotFoundException('Profile image not found');
    }
    const physicalPath = resolveGovernedPhysicalPath(file.storageKey || file.path);
    if (!physicalPath) throw new NotFoundException('Profile image content is unavailable');

    const etag = `"${file.checksum || `${file.id}-${file.currentVersion}`}"`;
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', String(file.fileSize));
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=86400, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(physicalPath);
  }
}
