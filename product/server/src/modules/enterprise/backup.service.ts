import fs from 'fs';
import path from 'path';
import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

export class BackupService {
  /**
   * Create Manual/Automated Database Backup Snapshot
   */
  static async createDatabaseBackup(triggeredBy: string, backupType: 'MANUAL' | 'AUTOMATIC' = 'MANUAL') {
    const backupDir = path.join(process.cwd(), 'prisma', 'backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `dev_backup_${timestamp}.db`;
    const destPath = path.join(backupDir, fileName);
    const srcPath = path.join(process.cwd(), 'prisma', 'dev.db');

    try {
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        const stats = fs.statSync(destPath);

        const log = await prisma.backupLog.create({
          data: {
            filePath: destPath,
            fileName,
            backupType,
            fileSize: stats.size,
            triggeredBy,
            status: 'SUCCESS',
          },
        });

        logger.info(`💾 Database Backup Snapshot created successfully: ${fileName} (${stats.size} bytes)`);
        return log;
      } else {
        throw new Error('Source database file dev.db not found');
      }
    } catch (err: any) {
      logger.error('Failed to create database backup:', err);
      await prisma.backupLog.create({
        data: {
          filePath: destPath,
          fileName,
          backupType,
          fileSize: 0,
          triggeredBy,
          status: 'FAILED',
        },
      });
      throw err;
    }
  }

  /**
   * List Database Backup History
   */
  static async getBackupLogs() {
    return prisma.backupLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
