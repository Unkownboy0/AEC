import assert from 'assert';
import { resolveFlag } from '../modules/platform/feature-flags.resolver';

const flag = { key: 'feature.parent.portal', defaultEnabled: true, rolloutPercent: 100, startAt: null, endAt: null };

// Unregistered flag resolves open — code capability without a control is not blocked.
assert.strictEqual(resolveFlag(null, [], {}).enabled, true);

// Default enabled, no overrides.
assert.strictEqual(resolveFlag(flag, [], { userId: 'u1' }).enabled, true);

// Globally disabled default.
assert.strictEqual(resolveFlag({ ...flag, defaultEnabled: false }, [], { userId: 'u1' }).enabled, false);

// Department override wins over default.
const deptOff = [{ scope: 'DEPARTMENT' as const, departmentId: 'ece', roleName: null, userId: null, enabled: false }];
assert.strictEqual(resolveFlag(flag, deptOff, { userId: 'u1', departmentId: 'ece' }).enabled, false);
assert.strictEqual(resolveFlag(flag, deptOff, { userId: 'u1', departmentId: 'it' }).enabled, true);

// User override wins over department and role.
const mixed = [
  { scope: 'DEPARTMENT' as const, departmentId: 'ece', roleName: null, userId: null, enabled: false },
  { scope: 'ROLE' as const, departmentId: null, roleName: 'Faculty', userId: null, enabled: false },
  { scope: 'USER' as const, departmentId: null, roleName: null, userId: 'u1', enabled: true },
];
assert.strictEqual(resolveFlag(flag, mixed, { userId: 'u1', roleName: 'Faculty', departmentId: 'ece' }).enabled, true);
assert.strictEqual(resolveFlag(flag, mixed, { userId: 'u2', roleName: 'Faculty', departmentId: 'ece' }).enabled, false);

// Schedule window.
const future = { ...flag, startAt: new Date('2999-01-01') };
assert.strictEqual(resolveFlag(future, [], { userId: 'u1' }, new Date('2026-01-01')).enabled, false);
const expired = { ...flag, endAt: new Date('2000-01-01') };
assert.strictEqual(resolveFlag(expired, [], { userId: 'u1' }, new Date('2026-01-01')).enabled, false);

// Rollout percentage is deterministic per user (same call twice must agree).
const rollout = { ...flag, rolloutPercent: 50 };
const first = resolveFlag(rollout, [], { userId: 'stable-user' }).enabled;
const second = resolveFlag(rollout, [], { userId: 'stable-user' }).enabled;
assert.strictEqual(first, second);
assert.strictEqual(resolveFlag({ ...flag, rolloutPercent: 0 }, [], { userId: 'anyone' }).enabled, false);
assert.strictEqual(resolveFlag({ ...flag, rolloutPercent: 100 }, [], { userId: 'anyone' }).enabled, true);

console.log('Feature flag resolver unit tests passed');
