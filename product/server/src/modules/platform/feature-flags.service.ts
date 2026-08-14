import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import { FLAG_DEFINITIONS } from './feature-flags.catalog';
import { resolveFlag, ResolveContext } from './feature-flags.resolver';

type Actor = { id: string };
type RequestMeta = { ip?: string; userAgent?: string };

const SCOPES = ['DEPARTMENT', 'ROLE', 'USER'] as const;
type Scope = (typeof SCOPES)[number];

export class FeatureFlagsService {
  // Idempotently seeds the well-known flags so they're always visible/manageable
  // in the control center, even before any admin has touched them.
  async ensureSeeded() {
    for (const def of FLAG_DEFINITIONS) {
      await prisma.featureFlag.upsert({
        where: { key: def.key },
        update: {},
        create: {
          key: def.key,
          name: def.name,
          description: def.description,
          category: def.category,
          status: def.status,
          defaultEnabled: def.defaultEnabled,
        },
      });
    }
  }

  async list() {
    return prisma.featureFlag.findMany({
      include: { overrides: true },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });
  }

  private async findOrThrow(key: string) {
    const flag = await prisma.featureFlag.findUnique({ where: { key }, include: { overrides: true } });
    if (!flag) throw new NotFoundException(`Feature flag "${key}" is not registered`);
    return flag;
  }

  async get(key: string) {
    return this.findOrThrow(key);
  }

  async create(input: { key: string; name: string; description?: string; category?: string; status?: string }, actor: Actor, meta: RequestMeta) {
    if (!input.key || !/^[a-z][a-z0-9.]*$/.test(input.key)) {
      throw new BadRequestException('Flag key must be lowercase dot.separated, e.g. "feature.attendance.qr"');
    }
    const existing = await prisma.featureFlag.findUnique({ where: { key: input.key } });
    if (existing) throw new BadRequestException(`Flag "${input.key}" already exists`);

    const flag = await prisma.featureFlag.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description ?? '',
        category: input.category ?? 'feature',
        status: input.status ?? 'EXPERIMENTAL',
        defaultEnabled: false,
      },
    });
    await this.audit(actor, meta, 'CREATE', flag.id, null, flag);
    return flag;
  }

  async update(key: string, changes: Partial<{ name: string; description: string; category: string; status: string; defaultEnabled: boolean; rolloutPercent: number; startAt: string | null; endAt: string | null; config: string | null }>, actor: Actor, meta: RequestMeta, reason?: string) {
    const before = await this.findOrThrow(key);
    if (changes.rolloutPercent !== undefined && (changes.rolloutPercent < 0 || changes.rolloutPercent > 100)) {
      throw new BadRequestException('rolloutPercent must be between 0 and 100');
    }
    const flag = await prisma.featureFlag.update({
      where: { key },
      data: {
        ...(changes.name !== undefined && { name: changes.name }),
        ...(changes.description !== undefined && { description: changes.description }),
        ...(changes.category !== undefined && { category: changes.category }),
        ...(changes.status !== undefined && { status: changes.status }),
        ...(changes.defaultEnabled !== undefined && { defaultEnabled: changes.defaultEnabled }),
        ...(changes.rolloutPercent !== undefined && { rolloutPercent: changes.rolloutPercent }),
        ...(changes.startAt !== undefined && { startAt: changes.startAt ? new Date(changes.startAt) : null }),
        ...(changes.endAt !== undefined && { endAt: changes.endAt ? new Date(changes.endAt) : null }),
        ...(changes.config !== undefined && { config: changes.config }),
      },
    });
    await this.audit(actor, meta, 'UPDATE', flag.id, before, flag, reason);
    return flag;
  }

  async upsertOverride(key: string, input: { scope: Scope; departmentId?: string; roleName?: string; userId?: string; enabled: boolean }, actor: Actor, meta: RequestMeta) {
    if (!SCOPES.includes(input.scope)) throw new BadRequestException('scope must be DEPARTMENT, ROLE or USER');
    const target = input.scope === 'DEPARTMENT' ? input.departmentId : input.scope === 'ROLE' ? input.roleName : input.userId;
    if (!target) throw new BadRequestException(`${input.scope.toLowerCase()} target is required for a ${input.scope} override`);

    const flag = await this.findOrThrow(key);
    const targetFilter = input.scope === 'DEPARTMENT' ? { departmentId: input.departmentId } : input.scope === 'ROLE' ? { roleName: input.roleName } : { userId: input.userId };
    const existing = flag.overrides.find((o) => o.scope === input.scope && (o as any)[input.scope === 'DEPARTMENT' ? 'departmentId' : input.scope === 'ROLE' ? 'roleName' : 'userId'] === target);

    const override = existing
      ? await prisma.featureFlagOverride.update({ where: { id: existing.id }, data: { enabled: input.enabled } })
      : await prisma.featureFlagOverride.create({ data: { flagId: flag.id, scope: input.scope, enabled: input.enabled, ...targetFilter } });

    await this.audit(actor, meta, existing ? 'UPDATE' : 'CREATE', flag.id, existing ?? null, override, undefined, 'FEATURE_FLAG_OVERRIDE');
    return override;
  }

  async deleteOverride(overrideId: string, actor: Actor, meta: RequestMeta) {
    const override = await prisma.featureFlagOverride.findUnique({ where: { id: overrideId } });
    if (!override) throw new NotFoundException('Override not found');
    await prisma.featureFlagOverride.delete({ where: { id: overrideId } });
    await this.audit(actor, meta, 'DELETE', override.flagId, override, null, undefined, 'FEATURE_FLAG_OVERRIDE');
    return { deleted: true };
  }

  async history(key: string) {
    const flag = await this.findOrThrow(key);
    return prisma.auditLog.findMany({
      where: { entityType: { in: ['FEATURE_FLAG', 'FEATURE_FLAG_OVERRIDE'] }, entityId: flag.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async resolve(key: string, ctx: ResolveContext) {
    const flag = await prisma.featureFlag.findUnique({ where: { key }, include: { overrides: true } });
    return resolveFlag(flag as any, (flag?.overrides ?? []) as any, ctx);
  }

  // Used by requireFeature middleware — resolves straight from a JWT-authenticated request's user id.
  async resolveForUser(key: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true, role: { select: { name: true } } } });
    return this.resolve(key, { userId, roleName: user?.role?.name ?? null, departmentId: user?.departmentId ?? null });
  }

  private async audit(actor: Actor, meta: RequestMeta, action: string, entityId: string, before: unknown, after: unknown, reason?: string, entityType: string = 'FEATURE_FLAG') {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action,
        entityType,
        entityId,
        description: reason ? `${action} ${entityType} (${reason})` : `${action} ${entityType}`,
        previousValues: before ? JSON.stringify(before) : null,
        newValues: after ? JSON.stringify(after) : null,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
  }
}

export const featureFlagsService = new FeatureFlagsService();
