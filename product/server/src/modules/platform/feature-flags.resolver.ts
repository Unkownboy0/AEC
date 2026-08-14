import { createHash } from 'crypto';

export type FlagRecord = {
  key: string;
  defaultEnabled: boolean;
  rolloutPercent: number;
  startAt: Date | null;
  endAt: Date | null;
};

export type OverrideRecord = {
  scope: 'DEPARTMENT' | 'ROLE' | 'USER';
  departmentId: string | null;
  roleName: string | null;
  userId: string | null;
  enabled: boolean;
};

export type ResolveContext = {
  userId?: string | null;
  roleName?: string | null;
  departmentId?: string | null;
};

export type ResolveResult = {
  enabled: boolean;
  source: 'unregistered' | 'schedule' | 'user' | 'role' | 'department' | 'default' | 'rollout';
};

// Deterministic 0-99 bucket per (flag key, user) so a rollout percentage is
// sticky for a given user instead of flapping on every request.
const rolloutBucket = (key: string, userId: string): number => {
  const digest = createHash('md5').update(`${key}:${userId}`).digest('hex').slice(0, 8);
  return parseInt(digest, 16) % 100;
};

export const resolveFlag = (
  flag: FlagRecord | null,
  overrides: OverrideRecord[],
  ctx: ResolveContext,
  now: Date = new Date(),
): ResolveResult => {
  if (!flag) return { enabled: true, source: 'unregistered' };

  if (flag.startAt && now < flag.startAt) return { enabled: false, source: 'schedule' };
  if (flag.endAt && now > flag.endAt) return { enabled: false, source: 'schedule' };

  if (ctx.userId) {
    const hit = overrides.find((o) => o.scope === 'USER' && o.userId === ctx.userId);
    if (hit) return { enabled: hit.enabled, source: 'user' };
  }
  if (ctx.roleName) {
    const hit = overrides.find((o) => o.scope === 'ROLE' && o.roleName === ctx.roleName);
    if (hit) return { enabled: hit.enabled, source: 'role' };
  }
  if (ctx.departmentId) {
    const hit = overrides.find((o) => o.scope === 'DEPARTMENT' && o.departmentId === ctx.departmentId);
    if (hit) return { enabled: hit.enabled, source: 'department' };
  }

  if (!flag.defaultEnabled) return { enabled: false, source: 'default' };
  if (flag.rolloutPercent >= 100) return { enabled: true, source: 'default' };
  if (flag.rolloutPercent <= 0) return { enabled: false, source: 'rollout' };
  const bucket = rolloutBucket(flag.key, ctx.userId ?? 'anon');
  return { enabled: bucket < flag.rolloutPercent, source: 'rollout' };
};
