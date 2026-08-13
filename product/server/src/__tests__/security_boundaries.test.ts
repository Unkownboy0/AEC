import assert from 'assert';
import {
  canArchiveComplaint,
  canRunEnterpriseBulkAction,
} from '../modules/enterprise/enterprise-authorization';
import { canManageSports } from '../modules/sports/sports.authorization';
import {
  createBookingSchema,
  createTeamSchema,
} from '../modules/sports/sports.validator';

assert.strictEqual(canRunEnterpriseBulkAction('Student'), false);
assert.strictEqual(canRunEnterpriseBulkAction('HOD'), false);
assert.strictEqual(canRunEnterpriseBulkAction('Super Admin'), true);

assert.strictEqual(canArchiveComplaint('Student'), false);
assert.strictEqual(canArchiveComplaint('Faculty'), false);
assert.strictEqual(canArchiveComplaint('Grievance Officer'), true);
assert.strictEqual(canArchiveComplaint('Principal'), true);

assert.strictEqual(canManageSports('Student'), false);
assert.strictEqual(canManageSports('Faculty'), false);
assert.strictEqual(canManageSports('Sports Coordinator'), true);
assert.strictEqual(canManageSports('Super Admin'), true);

assert.strictEqual(createTeamSchema.safeParse({}).success, false);
assert.strictEqual(createTeamSchema.safeParse({ name: 'Campus XI', sport: 'Cricket' }).success, true);
assert.strictEqual(createBookingSchema.safeParse({
  facilityName: 'Main Ground',
  date: '2026-08-20',
  startTime: '10:00',
  endTime: '09:00',
  purpose: 'Practice session',
}).success, false);

console.log('Security boundary unit tests passed');
