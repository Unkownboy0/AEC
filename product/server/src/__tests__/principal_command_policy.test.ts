import assert from 'assert';
import { principalDashboardQuerySchema, principalReturnSchema } from '../modules/principal-command/principal-command.validator';

assert.strictEqual(principalDashboardQuerySchema.safeParse({ periodDays: '30' }).success, true);
assert.strictEqual(principalDashboardQuerySchema.safeParse({ periodDays: '1' }).success, false);
assert.strictEqual(principalDashboardQuerySchema.safeParse({ periodDays: '366' }).success, false);
assert.strictEqual(principalDashboardQuerySchema.safeParse({ departmentId: 'not-a-uuid' }).success, false);
assert.strictEqual(principalReturnSchema.safeParse({ remarks: 'Correct the supporting document.' }).success, true);
assert.strictEqual(principalReturnSchema.safeParse({ remarks: '' }).success, false);

console.log('Principal command policy unit tests passed');
