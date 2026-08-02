import os from 'os';
import { prisma } from '../../lib/prisma';

export class HealthService {
  /**
   * Health Probe (/api/health)
   */
  static async getHealthStatus() {
    let dbStatus = 'ONLINE';
    let dbLatencyMs = 0;

    const startTime = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - startTime;
    } catch (err) {
      dbStatus = 'OFFLINE';
    }

    const memory = process.memoryUsage();

    return {
      status: dbStatus === 'ONLINE' ? 'HEALTHY' : 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        cpuCores: os.cpus().length,
        freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
      },
      processMemory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
      },
    };
  }

  /**
   * Readiness Probe (/api/readiness)
   */
  static async getReadinessStatus() {
    const requiredEnvKeys = ['DATABASE_URL', 'JWT_SECRET'];
    const missingKeys = requiredEnvKeys.filter((key) => !process.env[key]);

    let isDbReady = false;
    try {
      await prisma.user.findFirst();
      isDbReady = true;
    } catch (_) {}

    const isReady = missingKeys.length === 0 && isDbReady;

    return {
      isReady,
      status: isReady ? 'READY' : 'NOT_READY',
      checks: {
        environmentVariables: missingKeys.length === 0 ? 'PASS' : `FAIL (Missing: ${missingKeys.join(', ')})`,
        databaseConnectivity: isDbReady ? 'PASS' : 'FAIL',
      },
    };
  }

  /**
   * Operational Metrics Probe (/api/metrics)
   */
  static async getMetricsSummary() {
    const [totalUsers, totalStudents, totalFaculty, totalAudits] = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.securityAuditLog.count(),
    ]);

    return {
      metrics: {
        totalUsers,
        totalStudents,
        totalFaculty,
        totalSecurityAudits: totalAudits,
        processUptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }
}
