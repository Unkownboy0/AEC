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
class FilesController {
    uploadsDir = path_1.default.join(__dirname, '../../../uploads');
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
    /**
     * Upload file via base64 JSON payload
     */
    upload = async (req, res, next) => {
        try {
            const { name, mimeType, folder = '/', base64 } = req.body;
            if (!name || !mimeType || !base64) {
                throw new exceptions_1.BadRequestException('name, mimeType and base64 fields are required');
            }
            // Check configurable max size constraint (default 25MB)
            const buffer = Buffer.from(base64, 'base64');
            const maxUploadSetting = await prisma_1.prisma.systemSetting.findFirst({
                where: { key: 'MAX_UPLOAD_SIZE' }
            });
            const maxSize = maxUploadSetting ? parseInt(maxUploadSetting.value, 10) : 25 * 1024 * 1024;
            if (buffer.length > maxSize) {
                throw new exceptions_1.BadRequestException(`File exceeds the allowed size limit of ${(maxSize / (1024 * 1024)).toFixed(0)}MB`);
            }
            // Ensure specific target subfolder exists
            const targetSubFolder = path_1.default.join(this.uploadsDir, folder.replace(/\.\./g, '')); // Avoid directory traversal
            if (!fs_1.default.existsSync(targetSubFolder)) {
                fs_1.default.mkdirSync(targetSubFolder, { recursive: true });
            }
            const filePath = path_1.default.join(targetSubFolder, name);
            // Write to disk
            fs_1.default.writeFileSync(filePath, buffer);
            const targetWebPath = `/uploads${folder === '/' ? '/' : folder + '/'}${name}`;
            const mediaFile = await prisma_1.prisma.mediaFile.upsert({
                where: { path: targetWebPath },
                update: {
                    fileSize: buffer.length,
                    mimeType,
                },
                create: {
                    name,
                    path: targetWebPath,
                    mimeType,
                    fileSize: buffer.length,
                    folder,
                },
            });
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UPLOAD',
                    module: 'FILE',
                    description: `Uploaded media file: ${name} to folder ${folder}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(201).json({
                status: 'success',
                data: mediaFile,
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