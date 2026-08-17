import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';
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

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
      if (!file) throw new NotFoundException('File metadata not found');

      const relativePath = file.path.replace(/^[/\\]uploads[/\\]?/, '');
      const physicalPath = path.resolve(this.uploadsDir, relativePath);
      const relativeToRoot = path.relative(this.uploadsDir, physicalPath);
      if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        throw new BadRequestException('Invalid stored file path');
      }
      if (!fs.existsSync(physicalPath)) throw new NotFoundException('File content not found');

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/["\\\r\n]/g, '_')}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
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
      let file = await prisma.mediaFile.findUnique({ where: { id: targetId } }).catch(() => null);
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

      let physicalPath: string | null = null;
      let mimeType = 'image/jpeg';

      if (file) {
        const relativePath = file.path.replace(/^[/\\]uploads[/\\]?/, '');
        physicalPath = path.resolve(this.uploadsDir, relativePath);
        mimeType = file.mimeType || this.inferMimeType(file.name);
      } else {
        // Direct physical lookup in uploadsDir
        const cleanTarget = targetId.replace(/^(\/api\/files\/|\/uploads\/|\/)/, '');
        const candidate = path.resolve(this.uploadsDir, cleanTarget);
        const relativeToRoot = path.relative(this.uploadsDir, candidate);
        if (!relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot) && fs.existsSync(candidate)) {
          physicalPath = candidate;
          mimeType = this.inferMimeType(candidate);
        }
      }

      if (physicalPath && fs.existsSync(physicalPath) && fs.statSync(physicalPath).isFile()) {
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return res.sendFile(physicalPath);
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

      const mediaFile = await prisma.mediaFile.upsert({
        where: { path: targetWebPath },
        update: {
          fileSize: buffer.length,
          mimeType,
        },
        create: {
          name: safeFilename,
          path: targetWebPath,
          mimeType,
          fileSize: buffer.length,
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
   * Delete media file
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.mediaFile.findUnique({
        where: { id: req.params.id },
      });

      if (!file) {
        throw new NotFoundException('File metadata not found');
      }

      // Remove from disk
      const physicalPath = path.join(this.uploadsDir, file.path.replace(/^\/uploads/, ''));
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }

      await prisma.mediaFile.delete({
        where: { id: req.params.id },
      });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
          action: 'DELETE',
          module: 'FILE',
          description: `Deleted media file: ${file.name}`,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
