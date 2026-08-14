import { prisma } from '../../lib/prisma';

export const logWorkspaceAudit = async (
  actorId: string,
  meta: { ip?: string; userAgent?: string },
  action: string,
  entityType: string,
  entityId: string,
  description: string,
) => {
  await prisma.auditLog.create({
    data: { actorId, action, entityType, entityId, description, ipAddress: meta.ip, userAgent: meta.userAgent },
  });
};
