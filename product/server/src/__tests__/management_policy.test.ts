import assert from 'assert';
import { managementQuerySchema } from '../modules/management/management.validator';
import { managementRoles, normalizeManagementRole, resolveManagementViewer } from '../modules/management/management.types';

assert.strictEqual(normalizeManagementRole('Governing Body'), 'GOVERNING_BODY');
assert.strictEqual(managementRoles.includes('MANAGEMENT'), true);
assert.strictEqual(managementQuerySchema.safeParse({ periodDays: '30' }).success, true);
assert.strictEqual(managementQuerySchema.safeParse({ periodDays: '2' }).success, false);
assert.strictEqual(managementQuerySchema.safeParse({ periodDays: '366' }).success, false);

const summaryOnly = resolveManagementViewer({ id: '1', email: 'board@example.edu', role: 'Management', permissions: ['dashboard:view'] });
assert.strictEqual(summaryOnly.canDrillDown, false);
assert.strictEqual(summaryOnly.canExport, false);

const reporter = resolveManagementViewer({ id: '2', email: 'chair@example.edu', role: 'Governing Body', permissions: ['reports:read', 'reports:export'] });
assert.strictEqual(reporter.canDrillDown, true);
assert.strictEqual(reporter.canExport, true);

console.log('Management policy unit tests passed');
