import { prisma } from '../../lib/prisma';
import { Request } from 'express';

export interface AuditLogOptions {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  previousValues?: any;
  newValues?: any;
  req?: Request;
}

export class AuditService {
  static async log(options: AuditLogOptions) {
    try {
      const actorId = options.actorId || (options.req && (options.req as any).user?.id);
      const ipAddress = options.req ? (options.req.headers['x-forwarded-for'] as string || options.req.socket.remoteAddress) : undefined;
      const userAgent = options.req ? options.req.headers['user-agent'] : undefined;

      await prisma.auditLog.create({
        data: {
          actorId: actorId || null,
          action: options.action,
          entityType: options.entityType,
          entityId: options.entityId || null,
          description: options.description,
          previousValues: options.previousValues ? JSON.stringify(options.previousValues) : null,
          newValues: options.newValues ? JSON.stringify(options.newValues) : null,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (err) {
      console.error('Failed to create audit log entry:', err);
    }
  }
}
