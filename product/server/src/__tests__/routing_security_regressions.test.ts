import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { grantMatchesActor } from '../modules/campus-workspace/governed-file.policy';

const enterprise = fs.readFileSync(path.join(__dirname, '../modules/enterprise/enterprise.service.ts'), 'utf8');
const complaintRouting = fs.readFileSync(path.join(__dirname, '../modules/enterprise/complaint-routing.service.ts'), 'utf8');
const recipientResolver = fs.readFileSync(path.join(__dirname, '../modules/notifications/recipient-resolver.service.ts'), 'utf8');
const governedFiles = fs.readFileSync(path.join(__dirname, '../modules/campus-workspace/governed-file.service.ts'), 'utf8');

assert.match(enterprise, /ComplaintRoutingService\.resolveOwner/, 'Every complaint must use the central owner resolver');
assert.match(enterprise, /COMPLAINT_ACKNOWLEDGED/, 'Complaint requester must receive acknowledgement');
assert.match(complaintRouting, /ACADEMIC[\s\S]*findDepartmentHod/, 'Academic complaints must prefer the operating department HOD');
assert.match(complaintRouting, /GENERAL:[\s\S]*Grievance Officer/, 'General complaints must have a central triage owner');
assert.match(recipientResolver, /prisma\.task\.findUnique/, 'Task recipients must be derivable from taskId in the database');
assert.match(recipientResolver, /principalType === 'ALL_INSTITUTION'/, 'Institution-wide shares must resolve an explicit audience');
assert.match(governedFiles, /principalType !== 'SPECIFIC_USER'[\s\S]*dispatchDomainEvent/, 'Scoped file shares must dispatch after ACL persistence');
assert.strictEqual(grantMatchesActor({ principalType: 'SECTION', principalId: 'sec-1', accessLevel: 'VIEW' }, { userId: 'u-1', role: 'Student', sectionId: 'sec-1' }), true);
assert.strictEqual(grantMatchesActor({ principalType: 'SECTION', principalId: 'sec-1', accessLevel: 'VIEW' }, { userId: 'u-2', role: 'Student', sectionId: 'sec-2' }), false);

console.log('✅ Complaint, task, and governed-share routing regressions passed');
