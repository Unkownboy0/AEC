import assert from 'assert';
import { provisioningFileRequestSchema, provisioningRequestSchema, provisioningRowSchema } from '../modules/users/provisioning.validator';

const validAccount = { profileType: 'ACCOUNT_ONLY', email: 'security.officer@example.edu', firstName: 'Asha', lastName: 'Raman', roleName: 'Security' };
assert.strictEqual(provisioningRowSchema.safeParse(validAccount).success, true);
assert.strictEqual(provisioningRowSchema.safeParse({ ...validAccount, email: 'invalid' }).success, false);
assert.strictEqual(provisioningRowSchema.safeParse({ ...validAccount, profileType: 'UNKNOWN' }).success, false);
assert.strictEqual(provisioningRequestSchema.safeParse({ rows: [] }).success, false);
assert.strictEqual(provisioningRequestSchema.safeParse({ rows: [validAccount] }).success, true);
assert.strictEqual(provisioningFileRequestSchema.safeParse({ fileName: 'users.xlsx', base64: 'YWJj' }).success, true);
assert.strictEqual(provisioningFileRequestSchema.safeParse({ fileName: 'users.exe', base64: 'YWJj' }).success, false);

console.log('Provisioning validator unit tests passed');
