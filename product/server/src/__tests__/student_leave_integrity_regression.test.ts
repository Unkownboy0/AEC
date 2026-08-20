import assert from 'assert';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, '../modules/enterprise/student-leave.service.ts'), 'utf8');

assert.ok(!source.includes('STUDENT-MOCK'), 'Production leave path must not fabricate a student ID');
assert.ok(!source.includes('Student Requester'), 'Production leave path must not fabricate a student name');
assert.ok(!source.includes('REG-2026-001'), 'Production leave path must not fabricate a register number');
assert.match(source, /assertResolvedWorkflowStudent\(wfReq\)/, 'Workflow fallback must enforce the Student relation');
assert.match(source, /STUDENT_RELATION_UNRESOLVED/, 'Integrity failure must expose a stable structured error code');
assert.match(source, /Action has been blocked/, 'Approvers must receive a safe blocked-action message');

console.log('✅ Student leave unresolved-relation integrity regression passed');
