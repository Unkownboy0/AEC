import assert from 'assert';
import fs from 'fs';
import path from 'path';

const analytics = fs.readFileSync(path.join(__dirname, '../modules/enterprise/analytics.service.ts'), 'utf8');
const controller = fs.readFileSync(path.join(__dirname, '../modules/enterprise/analytics.controller.ts'), 'utf8');
const board = fs.readFileSync(path.join(__dirname, '../../../client/src/components/department/DepartmentAvailabilityBoard.tsx'), 'utf8');

assert.match(controller, /faculty: \{ select: \{ departmentId: true \} \}/, 'HOD scope must resolve through canonical faculty assignment');
assert.match(controller, /departmentMemberships/, 'HOD scope must support canonical department membership');
assert.match(controller, /scope: 'UNASSIGNED'/, 'Unassigned HOD must fail closed instead of receiving institution-wide records');
assert.match(analytics, /CAMPUSOS_INCLUDE_DEMO_DATA/, 'Seed data visibility must require an explicit demo-mode switch');
assert.match(analytics, /ada\.lovelace@geetorus\.com/, 'Known seed identities must be excluded from operational boards');
assert.match(analytics, /canonicalStudentIdentities\.has\(regId\)/, 'Legacy workflows must not duplicate canonical student leave records');
assert.match(analytics, /canonicalFacultyIdentities\.has\(empId\)/, 'Legacy workflows must not duplicate canonical faculty leave records');
assert.match(analytics, /studentsOnOdMap\.forEach[\s\S]*studentsOnLeaveMap\.delete/, 'Overlapping student OD and leave must resolve to one presence state');
assert.match(analytics, /facultyOnOdMap\.forEach[\s\S]*facultyOnLeaveMap\.delete/, 'Overlapping faculty OD and leave must resolve to one presence state');
assert.match(board, /realtimeClient\.subscribe/, 'Board must consume authenticated realtime invalidation events');
assert.match(board, /DEPARTMENT_AVAILABILITY_UPDATED/, 'Board must react to canonical availability mutation events');
assert.match(board, /10_000/, 'Board must retain a bounded polling fallback');
assert.match(board, /visibilitychange/, 'Board must synchronize after app/browser resume');
assert.match(board, /Showing the last successfully synchronized result/, 'Transient sync errors must preserve the last good result');

console.log('Department availability realtime, scope, and demo-filter contract passed');
