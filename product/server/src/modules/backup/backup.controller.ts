import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { env } from '../../config/env';

const execFileAsync = promisify(execFile);

export class BackupController {
  private backupsDir = path.resolve(env.BACKUP_ROOT);

  private postgresEnvironment() {
    const databaseUrl = new URL(env.DATABASE_URL);
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
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  /**
   * List all backup logs
   */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.backupLog.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({
        status: 'success',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Trigger database backup manually
   */
  trigger = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `campusos_${timestamp}.dump`;
      const targetPath = path.join(this.backupsDir, fileName);

      await execFileAsync(env.PG_DUMP_PATH, [
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        `--file=${targetPath}`,
      ], { env: this.postgresEnvironment(), windowsHide: true });

      const stats = fs.statSync(targetPath);

      const log = await prisma.backupLog.create({
        data: {
          filePath: targetPath,
          fileName,
          backupType: 'MANUAL',
          fileSize: stats.size,
          triggeredBy: req.user!.email,
          status: 'SUCCESS',
        },
      });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
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
    } catch (error: any) {
      // Record failure if we can
      await prisma.backupLog.create({
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
  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await prisma.backupLog.findUnique({
        where: { id: req.params.id },
      });

      if (!log || log.status === 'FAILED') {
        throw new NotFoundException('Backup log record not found');
      }

      if (!fs.existsSync(log.filePath)) {
        throw new NotFoundException('Backup physical file was deleted or cannot be found on disk');
      }

      res.download(log.filePath, log.fileName);
    } catch (error) {
      next(error);
    }
  };

  /** Validate that pg_restore can read the archive. An actual restore is an
   * offline runbook operation and is never performed against the live DB here. */
  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await prisma.backupLog.findUnique({
        where: { id: req.params.id },
      });

      if (!log || log.status === 'FAILED') {
        throw new NotFoundException('Backup log record not found');
      }

      if (!fs.existsSync(log.filePath)) {
        throw new NotFoundException('Backup physical file not found');
      }

      const configuredDirectory = path.dirname(env.PG_DUMP_PATH);
      const pgRestoreExecutable = process.platform === 'win32' ? 'pg_restore.exe' : 'pg_restore';
      const pgRestorePath = configuredDirectory === '.' ? pgRestoreExecutable : path.join(configuredDirectory, pgRestoreExecutable);
      await execFileAsync(pgRestorePath, ['--list', log.filePath], { windowsHide: true });

      // Audit Log
      await prisma.userActivityLog.create({
        data: {
          userId: req.user!.id,
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
    } catch (error) {
      next(error);
    }
  };
}
