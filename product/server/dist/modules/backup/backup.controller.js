"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupController = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const env_1 = require("../../config/env");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
class BackupController {
    backupsDir = path_1.default.resolve(env_1.env.BACKUP_ROOT);
    postgresEnvironment() {
        const databaseUrl = new URL(env_1.env.DATABASE_URL);
        return {
            ...process.env,
            PGHOST: databaseUrl.hostname,
            PGPORT: databaseUrl.port || '5432',
            PGUSER: decodeURIComponent(databaseUrl.username),
            PGPASSWORD: decodeURIComponent(databaseUrl.password),
            PGDATABASE: databaseUrl.pathname.replace(/^\//, ''),
            PGSSLMODE: databaseUrl.searchParams.get('sslmode') || process.env.PGSSLMODE,
        };
    }
    constructor() {
        // Ensure backups directory exists
        if (!fs_1.default.existsSync(this.backupsDir)) {
            fs_1.default.mkdirSync(this.backupsDir, { recursive: true });
        }
    }
    /**
     * List all backup logs
     */
    list = async (req, res, next) => {
        try {
            const logs = await prisma_1.prisma.backupLog.findMany({
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({
                status: 'success',
                data: logs,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Trigger database backup manually
     */
    trigger = async (req, res, next) => {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `campusos_${timestamp}.dump`;
            const targetPath = path_1.default.join(this.backupsDir, fileName);
            await execFileAsync(env_1.env.PG_DUMP_PATH, [
                '--format=custom',
                '--no-owner',
                '--no-privileges',
                `--file=${targetPath}`,
            ], { env: this.postgresEnvironment(), windowsHide: true });
            const stats = fs_1.default.statSync(targetPath);
            const log = await prisma_1.prisma.backupLog.create({
                data: {
                    filePath: targetPath,
                    fileName,
                    backupType: 'MANUAL',
                    fileSize: stats.size,
                    triggeredBy: req.user.email,
                    status: 'SUCCESS',
                },
            });
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CREATE',
                    module: 'BACKUP',
                    description: `Created manual database backup file: ${fileName}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(201).json({
                status: 'success',
                data: log,
            });
        }
        catch (error) {
            // Record failure if we can
            await prisma_1.prisma.backupLog.create({
                data: {
                    filePath: '',
                    fileName: 'Failed_PostgreSQL_Backup.dump',
                    backupType: 'MANUAL',
                    fileSize: 0,
                    triggeredBy: req.user?.email || 'SYSTEM',
                    status: 'FAILED',
                },
            }).catch(() => null);
            next(error);
        }
    };
    /**
     * Download a backup file
     */
    download = async (req, res, next) => {
        try {
            const log = await prisma_1.prisma.backupLog.findUnique({
                where: { id: req.params.id },
            });
            if (!log || log.status === 'FAILED') {
                throw new exceptions_1.NotFoundException('Backup log record not found');
            }
            if (!fs_1.default.existsSync(log.filePath)) {
                throw new exceptions_1.NotFoundException('Backup physical file was deleted or cannot be found on disk');
            }
            res.download(log.filePath, log.fileName);
        }
        catch (error) {
            next(error);
        }
    };
    /** Validate that pg_restore can read the archive. An actual restore is an
     * offline runbook operation and is never performed against the live DB here. */
    restore = async (req, res, next) => {
        try {
            const log = await prisma_1.prisma.backupLog.findUnique({
                where: { id: req.params.id },
            });
            if (!log || log.status === 'FAILED') {
                throw new exceptions_1.NotFoundException('Backup log record not found');
            }
            if (!fs_1.default.existsSync(log.filePath)) {
                throw new exceptions_1.NotFoundException('Backup physical file not found');
            }
            const configuredDirectory = path_1.default.dirname(env_1.env.PG_DUMP_PATH);
            const pgRestoreExecutable = process.platform === 'win32' ? 'pg_restore.exe' : 'pg_restore';
            const pgRestorePath = configuredDirectory === '.' ? pgRestoreExecutable : path_1.default.join(configuredDirectory, pgRestoreExecutable);
            await execFileAsync(pgRestorePath, ['--list', log.filePath], { windowsHide: true });
            // Audit Log
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: req.user.id,
                    action: 'UPDATE',
                    module: 'BACKUP',
                    description: `Validated PostgreSQL backup archive: ${log.fileName}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                },
            });
            res.status(200).json({
                status: 'success',
                message: `PostgreSQL archive ${log.fileName} passed pg_restore structural validation. A separate restore drill is still required.`,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.BackupController = BackupController;
//# sourceMappingURL=backup.controller.js.map