import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { checkPermission } from '../../core/middlewares/auth.middleware';
import { GovernedFileService } from '../campus-workspace/governed-file.service';
import { AuditService } from '../security/audit.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ── File Upload Security Constants ──
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/csv',
  'application/vnd.ms-excel', // xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/zip', // zip
  'application/x-zip-compressed', // zip
  'text/plain', // txt
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.webp', '.xlsx', '.csv', '.xls', '.docx', '.pptx', '.zip', '.txt',
]);

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.js', '.ts', '.php', '.py', '.rb',
  '.jar', '.war', '.dll', '.so', '.msi', '.vbs', '.ps1', '.wsf',
  '.com', '.scr', '.pif', '.hta', '.cpl', '.inf', '.reg',
]);

export class FilesController {
  private uploadsDir = path.resolve(process.env.STORAGE_ROOT || path.join(__dirname, '../../../uploads'));

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * List all media files
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folder = (req.query.folder as string) || '/';
      const search = (req.query.search as string) || '';

      const where: any = {};
      if (folder) where.folder = folder;
      if (search) where.name = { contains: search };

      const files = await prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        status: 'success',
        data: files,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Converts legacy absolute Windows/Linux paths or URLs into canonical storage keys
   */
  private normalizeStorageKey(filePathOrKey: string): string {
    if (!filePathOrKey || filePathOrKey.trim() === '') return '';
    let clean = filePathOrKey.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      try {
        const parsed = new URL(clean);
        clean = parsed.pathname;
      } catch (_) {}
    }
    // Remove Windows drive letters or Linux absolute root prefixes
    clean = clean.replace(/^[a-zA-Z]:\\/, '').replace(/^[a-zA-Z]:\//, '');
    clean = clean.replace(/^.*[/\\]uploads[/\\]?/, '').replace(/^[/\\]+/, '');
    return clean;
  }

  private resolvePhysicalPath(filePathOrKey: string): string | null {
    if (!filePathOrKey || filePathOrKey.trim() === '') return null;

    // Prevent null byte injections
    if (filePathOrKey.includes('\0') || filePathOrKey.includes('%00')) {
      return null;
    }

    const clean = this.normalizeStorageKey(filePathOrKey);
    if (!clean) return null;

    const candidate = path.normalize(path.resolve(this.uploadsDir, clean));
    const relativeToRoot = path.relative(this.uploadsDir, candidate);

    // Strict storage root confinement
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
      return null;
    }

    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        // Verify real path resolved from symlinks stays inside real uploads directory
        const realCandidate = fs.realpathSync(candidate);
        const realUploadsDir = fs.realpathSync(this.uploadsDir);
        if (realCandidate.startsWith(realUploadsDir)) {
          return realCandidate;
        }
      }
    } catch (_) {}

    // Fallback: basename lookup in root uploads directory
    try {
      const baseName = path.basename(clean);
      const baseCandidate = path.normalize(path.join(this.uploadsDir, baseName));
      if (fs.existsSync(baseCandidate) && fs.statSync(baseCandidate).isFile()) {
        const realBaseCandidate = fs.realpathSync(baseCandidate);
        const realUploadsDir = fs.realpathSync(this.uploadsDir);
        if (realBaseCandidate.startsWith(realUploadsDir)) {
          return realBaseCandidate;
        }
      }
    } catch (_) {}

    return null;
  }

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file: any = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
      if (!file) throw new NotFoundException('File metadata not found');

      // New governed objects always pass through the canonical ACL service. Legacy
      // media retains its existing files:read permission boundary.
      if (file.ownerUserId || file.storageKey) {
        if (!req.user) throw new ForbiddenException('Authentication is required');
        const referenceId = typeof req.query.referenceId === 'string' ? req.query.referenceId : undefined;
        const reference = referenceId
          ? await prisma.governedFileReference.findFirst({
              where: { id: referenceId, fileId: file.id, deletedAt: null, authorizationMode: 'PARENT_RESOURCE' },
            })
          : null;
        await GovernedFileService.authorizeFileAccess({
          userId: req.user.id,
          activeRole: req.user.role,
          fileId: file.id,
          action: 'DOWNLOAD',
          driveItemId: typeof req.query.driveItemId === 'string' ? req.query.driveItemId : undefined,
          parentResource: reference ? {
            module: reference.module,
            resourceType: reference.resourceType,
            resourceId: reference.resourceId,
            authorizeParentResource: async () => {
              if (reference.resourceType !== 'TASK') return false;
              const task = await prisma.task.findFirst({
                where: {
                  id: reference.resourceId,
                  OR: [
                    { createdById: req.user!.id },
                    { assignees: { some: { assigneeId: req.user!.id } } },
                  ],
                },
                select: { id: true },
              });
              return Boolean(task);
            },
          } : undefined,
        });
      } else if (!req.user || !checkPermission(req.user.permissions, 'files:read')) {
        throw new ForbiddenException('You do not have permission to download this legacy file');
      }

      const physicalPath = this.resolvePhysicalPath(file.storageKey || file.path);
      if (!physicalPath) throw new NotFoundException('File content not found on server storage');

      const stat = fs.statSync(physicalPath);
      if (stat.size === 0) {
        throw new BadRequestException('The requested file is empty (0 bytes)');
      }

      const mimeType = file.mimeType || this.inferMimeType(file.name);
      const sanitizedFilename = file.name.replace(/[\r\n"\\/]/g, '_');
      const encodedFilename = encodeURIComponent(sanitizedFilename);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stat.size.toString());
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${sanitizedFilename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Private no-store header for sensitive document downloads
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      await AuditService.log({
        actorId: req.user?.id,
        action: 'DOWNLOAD', entityType: 'FILE', entityId: file.id,
        description: `Downloaded ${file.originalName || file.name}`,
        req,
      });
      res.sendFile(physicalPath);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Stream file content for inline rendering (avatars, attachments, media)
   */
  getContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetId = req.params.id || (req.query.id as string) || (req.query.path as string) || (req.query.file as string);
      if (!targetId) {
        return this.sendFallbackSvg(res);
      }

      // 1. Try finding by ID or filename or path in database
      let file: any = await prisma.mediaFile.findUnique({ where: { id: targetId } }).catch(() => null);
      if (!file) {
        file = await prisma.mediaFile.findFirst({
          where: {
            OR: [
              { id: targetId },
              { name: targetId },
              { path: targetId },
              { path: `/uploads/${targetId.replace(/^\/+/, '')}` },
            ],
          },
        }).catch(() => null);
      }

      // Public inline content exists for approved branding/avatar media only. A
      // governed Drive binary must never bypass its authenticated download route.
      if (file && file.sourceModule !== 'MEDIA' && file.sourceModule !== 'MEDIA_LIBRARY') {
        return this.sendFallbackSvg(res);
      }

      let physicalPath: string | null = null;
      let mimeType = 'image/jpeg';

      if (file) {
        physicalPath = this.resolvePhysicalPath(file.path);
        mimeType = file.mimeType || this.inferMimeType(file.name);
      } else {
        physicalPath = this.resolvePhysicalPath(targetId);
        if (physicalPath) mimeType = this.inferMimeType(physicalPath);
      }

      if (physicalPath && fs.existsSync(physicalPath) && fs.statSync(physicalPath).isFile()) {
        const stat = fs.statSync(physicalPath);
        if (stat.size > 0) {
          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Length', stat.size.toString());
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
          return res.sendFile(physicalPath);
        }
      }

      // Safe fallback SVG to prevent broken image icons
      return this.sendFallbackSvg(res);
    } catch (error) {
      return this.sendFallbackSvg(res);
    }
  };

  private inferMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.png': return 'image/png';
      case '.jpg':
      case '.jpeg': return 'image/jpeg';
      case '.webp': return 'image/webp';
      case '.gif': return 'image/gif';
      case '.svg': return 'image/svg+xml';
      case '.pdf': return 'application/pdf';
      default: return 'application/octet-stream';
    }
  }

  private sendFallbackSvg(res: Response) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="#4f46e5" rx="50"/>
      <circle cx="50" cy="40" r="18" fill="#ffffff" opacity="0.9"/>
      <path d="M22 84 C22 68 35 58 50 58 C65 58 78 68 78 84" fill="#ffffff" opacity="0.9"/>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);
  }

  /**
   * Upload file via base64 JSON payload (hardened)
   */
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, mimeType, folder = '/', base64 } = req.body;
      if (!name || !mimeType || !base64) {
        throw new BadRequestException('name, mimeType and base64 fields are required');
      }

      // ── 1. MIME type validation ──
      if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
        throw new BadRequestException(
          `File type "${mimeType}" is not allowed. Permitted: PDF, PNG, JPG, JPEG, WEBP, XLSX, CSV`
        );
      }

      // ── 2. Extension validation ──
      const originalExt = path.extname(name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(originalExt)) {
        throw new BadRequestException(
          `File extension "${originalExt}" is not allowed. Permitted: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
        );
      }

      // ── 3. Block double extensions (e.g. photo.jpg.exe) ──
      const nameParts = name.split('.');
      if (nameParts.length > 2) {
        const secondToLast = '.' + nameParts[nameParts.length - 2].toLowerCase();
        if (BLOCKED_EXTENSIONS.has(secondToLast) || BLOCKED_EXTENSIONS.has(originalExt)) {
          throw new BadRequestException('Suspicious file name detected — double extensions are not permitted');
        }
      }

      // ── 4. Block null bytes in filename ──
      if (name.includes('\0') || name.includes('%00')) {
        throw new BadRequestException('Invalid file name');
      }

      // ── 5. Size validation ──
      const buffer = Buffer.from(base64, 'base64');
      const maxUploadSetting = await prisma.systemSetting.findFirst({
        where: { key: 'MAX_UPLOAD_SIZE' }
      });
      const maxSize = maxUploadSetting ? parseInt(maxUploadSetting.value, 10) : 25 * 1024 * 1024;

      if (buffer.length > maxSize) {
        throw new BadRequestException(`File exceeds the allowed size limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
      }

      // ── 6. Randomize filename to prevent path guessing ──
      const randomId = crypto.randomUUID();
      const safeFilename = `${randomId}${originalExt}`;

      // ── 7. Sanitize folder path (prevent directory traversal) ──
      const sanitizedFolder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/\0/g, '').replace(/^\/+/, '');
      const targetSubFolder = path.resolve(this.uploadsDir, sanitizedFolder);
      const relativeToRoot = path.relative(this.uploadsDir, targetSubFolder);
      if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        throw new BadRequestException('Invalid upload folder');
      }
      if (!fs.existsSync(targetSubFolder)) {
        fs.mkdirSync(targetSubFolder, { recursive: true });
      }

      const filePath = path.join(targetSubFolder, safeFilename);
      
      // Write to disk
      fs.writeFileSync(filePath, buffer);

      const targetWebPath = `/uploads/${sanitizedFolder ? `${sanitizedFolder}/` : ''}${safeFilename}`;

      const mediaFile = await (prisma.mediaFile as any).upsert({
        where: { path: targetWebPath },
        update: {
          fileSize: buffer.length,
          mimeType,
          storageKey: `${sanitizedFolder ? `${sanitizedFolder}/` : ''}${safeFilename}`,
          originalName: name,
          safeName: safeFilename,
          checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
          ownerUserId: req.user!.id,
          createdByUserId: req.user!.id,
        },
        create: {
          name: safeFilename,
          path: targetWebPath,
          storageKey: `${sanitizedFolder ? `${sanitizedFolder}/` : ''}${safeFilename}`,
          originalName: name,
          safeName: safeFilename,
          mimeType,
          fileSize: buffer.length,
          checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
          ownerUserId: req.user!.id,
          createdByUserId: req.user!.id,
          sourceModule: 'MEDIA_LIBRARY',
          folder: sanitizedFolder,
        },
      });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPLOAD',
          module: 'FILE',
          description: `Uploaded media file: ${name} (stored as ${safeFilename}) to folder ${sanitizedFolder}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(201).json({
        status: 'success',
        data: {
          ...mediaFile,
          downloadUrl: `/api/files/${mediaFile.id}/download`,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete media file (Safe soft-delete / move to trash with reference protection)
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      if (!user) throw new ForbiddenException('Authentication required');

      const file = await prisma.mediaFile.findUnique({
        where: { id: req.params.id },
      });

      if (!file) {
        throw new NotFoundException('File metadata not found');
      }

      const isOwner = file.ownerUserId === user.id || file.createdByUserId === user.id;
      const isAdmin = ['Super Admin', 'College Admin', 'Principal'].includes(user.role);
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to delete this file');
      }

      // 1. Soft-delete MediaFile metadata
      await prisma.mediaFile.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      });

      // 2. Cascade soft-delete to CampusDriveItems owned by user
      await (prisma.campusDriveItem as any).updateMany({
        where: { fileId: file.id, ownerId: user.id, isTrashed: false },
        data: { isTrashed: true, trashedAt: new Date() },
      });

      // 3. Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          module: 'FILE',
          description: `Moved media file to trash: ${file.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'File moved to trash successfully',
        data: { id: file.id, deletedAt: new Date() },
      });
    } catch (error) {
      next(error);
    }
  };
}
