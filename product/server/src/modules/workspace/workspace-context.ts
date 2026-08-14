import { prisma } from '../../lib/prisma';
import { ActorCtx } from './workspace-permissions';

export const loadActorContext = async (userId: string): Promise<ActorCtx> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, role: { select: { name: true } } } });
  return { userId, roleName: user?.role?.name ?? null, departmentId: user?.departmentId ?? null };
};
