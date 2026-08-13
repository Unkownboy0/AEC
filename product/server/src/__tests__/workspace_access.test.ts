import assert from 'assert';
import { collectAuthorizedWorkspaceNames } from '../modules/auth/workspace-access';

const result = collectAuthorizedWorkspaceNames(
  'IQAC Dean',
  [
    { roleName: 'Faculty', status: 'ACTIVE' },
    { roleName: 'Admission Dean', status: 'INACTIVE' },
  ],
  [
    { role: { name: 'Mentor', status: 'ACTIVE' } },
    { role: { name: 'Principal', status: 'INACTIVE' } },
  ]
);

assert.deepStrictEqual(result, ['IQAC Dean', 'Faculty', 'Mentor']);
assert.ok(!result.includes('Admission Dean'));
assert.ok(!result.includes('Principal'));

const primaryOnly = collectAuthorizedWorkspaceNames('Student', [], []);
assert.deepStrictEqual(primaryOnly, ['Student']);

console.log('Workspace access unit tests passed');
