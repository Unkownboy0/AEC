import assert from 'assert';
import { administrationDashboardQuerySchema, administrationExportQuerySchema, isAdministrationDeanRole } from '../modules/administration-dean/administration-dean.validator';

assert.equal(isAdministrationDeanRole('Admission Dean'), true);
assert.equal(isAdministrationDeanRole('Administration & Admission Dean'), true);
assert.equal(isAdministrationDeanRole('ADMINISTRATION_AND_ADMISSION_DEAN'), true);
assert.equal(isAdministrationDeanRole('IQAC Dean'), false);
assert.equal(isAdministrationDeanRole('COE'), false);
assert.equal(administrationDashboardQuerySchema.parse({}).periodDays, 30);
assert.equal(administrationDashboardQuerySchema.safeParse({ periodDays: 2 }).success, false);
assert.equal(administrationExportQuerySchema.parse({ format: 'PDF' }).format, 'PDF');
assert.equal(administrationExportQuerySchema.safeParse({ format: 'CSV' }).success, false);

console.log('Administration Dean policy tests passed');
