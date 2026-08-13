"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
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
class FilesController {
    uploadsDir = path_1.default.resolve(process.env.STORAGE_ROOT || path_1.default.join(__dirname, '../../../uploads'));
    constructor() {
        // Ensure uploads directory exists
        if (!fs_1.default.existsSync(this.uploadsDir)) {
            fs_1.default.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }
    /**
     * List all media files
     */
    list = async (req, res, next) => {
        try {
            const folder = req.query.folder || '/';
            const search = req.query.search || '';
            const where = {};
            if (folder)
                where.folder = folder;
            if (search)
                where.name = { contains: search };
            const files = await prisma_1.prisma.mediaFile.findMany({
                where,
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({
                status: 'success',
                data: files,
            });
        }
        catch (error) {
            next(error);
        }
    };
    download = async (req, res, next) => {
        try {
            const file = await prisma_1.prisma.mediaFile.findUnique({ where: { id: req.params.id } });
            if (!file)
                throw new exceptions_1.NotFoundException('File metadata not found');
            const relativePath = file.path.replace(/^[/\\]uploads[/\\]?/, '');
            const physicalPath = path_1.default.resolve(this.uploadsDir, relativePath);
            const relativeToRoot = path_1.default.relative(this.uploadsDir, physicalPath);
            if (relativeToRoot.startsWith('..') || path_1.default.isAbsolute(relativeToRoot)) {
                throw new exceptions_1.BadRequestException('Invalid stored file path');
            }
            if (!fs_1.default.existsSync(physicalPath))
                throw new exceptions_1.NotFoundException('File content not found');
            res.setHeader('Content-Type', file.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/["\\\r\n]/g, '_')}"`);
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.sendFile(physicalPath);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Upload file via base64 JSON payload (hardened)
     */
    upload = async (req, res, next) => {
        try {
            const { name, mimeType, folder = '/', base64 } = req.body;
            if (!name || !mimeType || !base64) {
                throw new exceptions_1.BadRequestException('name, mimeType and base64 fields are required');
            }
            // ── 1. MIME type validation ──
            if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
                throw new exceptions_1.BadRequestException(`File type "${mimeType}" is not allowed. Permitted: PDF, PNG, JPG, JPEG, WEBP, XLSX, CSV`);
            }
            // ── 2. Extension validation ──
            const originalExt = path_1.default.extname(name).toLowerCase();
            if (!ALLOWED_EXTENSIONS.has(originalExt)) {
                throw new exceptions_1.BadRequestException(`File extension "${originalExt}" is not allowed. Permitted: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`);
            }
            // ── 3. Block double extensions (e.g. photo.jpg.exe) ──
            const nameParts = name.split('.');
            if (nameParts.length > 2) {
                const secondToLast = '.' + nameParts[nameParts.length - 2].toLowerCase();
                if (BLOCKED_EXTENSIONS.has(secondToLast) || BLOCKED_EXTENSIONS.has(originalExt)) {
                    throw new exceptions_1.BadRequestException('Suspicious file name detected — double extensions are not permitted');
                }
            }
            // ── 4. Block null bytes in filename ──
            if (name.includes('\0') || name.includes('%00')) {
                throw new exceptions_1.BadRequestException('Invalid file name');
            }
            // ── 5. Size validation ──
            const buffer = Buffer.from(base64, 'base64');
            const maxUploadSetting = await prisma_1.prisma.systemSetting.findFirst({
                where: { key: 'MAX_UPLOAD_SIZE' }
            });
            const maxSize = maxUploadSetting ? parseInt(maxUploadSetting.value, 10) : 25 * 1024 * 1024;
            if (buffer.length > maxSize) {
                throw new exceptions_1.BadRequestException(`File exceeds the allowed size limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
            }
            // ── 6. Randomize filename to prevent path guessing ──
            const randomId = crypto_1.default.randomUUID();
            const safeFilename = `${randomId}${originalExt}`;
            // ── 7. Sanitize folder path (prevent directory traversal) ──
            const sanitizedFolder = folder.replace(/\\/g, '/').replace(/\.\./g, '').replace(/\0/g, '').replace(/^\/+/, '');
            const targetSubFolder = path_1.default.resolve(this.uploadsDir, sanitizedFolder);
            const relativeToRoot = path_1.default.relative(this.uploadsDir, targetSubFolder);
            if (relativeToRoot.startsWith('..') || path_1.default.isAbsolute(relativeToRoot)) {
                throw new exceptions_1.BadRequestException('Invalid upload folder');
            }
            if (!fs_1.default.existsSync(targetSubFolder)) {
                fs_1.default.mkdirSync(targetSubFolder, { recursive: true });
            }
            const filePath = path_1.default.join(targetSubFolder, safeFilename);
            // Write to disk
            fs_1.default.writeFileSync(filePath, buffer);
            const targetWebPath = `/uploads/${sanitizedFolder ? `${sanitizedFolder}/` : ''}${safeFilename}`;
            const mediaFile = await prisma_1.prisma.mediaFile.upsert({
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
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete media file
     */
    delete = async (req, res, next) => {
        try {
            const file = await prisma_1.prisma.mediaFile.findUnique({
                where: { id: req.params.id },
            });
            if (!file) {
                throw new exceptions_1.NotFoundException('File metadata not found');
            }
            // Remove from disk
            const physicalPath = path_1.default.join(this.uploadsDir, file.path.replace(/^\/uploads/, ''));
            if (fs_1.default.existsSync(physicalPath)) {
                fs_1.default.unlinkSync(physicalPath);
            }
            await prisma_1.prisma.mediaFile.delete({
                where: { id: req.params.id },
            });
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.FilesController = FilesController;
//# sourceMappingURL=files.controller.js.map