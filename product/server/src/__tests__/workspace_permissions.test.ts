import assert from 'assert';
import { resolveAccess, atLeast } from '../modules/workspace/workspace-permissions';

const owner = { userId: 'u1', roleName: 'Faculty', departmentId: 'cse' };
const stranger = { userId: 'u2', roleName: 'Faculty', departmentId: 'ece' };
const deptmate = { userId: 'u3', roleName: 'Faculty', departmentId: 'cse' };

const personalFile = { ownerId: 'u1', departmentId: 'cse', scope: 'PERSONAL' };
assert.strictEqual(resolveAccess(personalFile, [], owner), 'OWNER');
assert.strictEqual(resolveAccess(personalFile, [], stranger), null);
assert.strictEqual(resolveAccess(personalFile, [], deptmate), null); // personal scope has no department baseline

const deptFile = { ownerId: 'u1', departmentId: 'cse', scope: 'DEPARTMENT' };
assert.strictEqual(resolveAccess(deptFile, [], deptmate), 'VIEWER');
assert.strictEqual(resolveAccess(deptFile, [], stranger), null);

const instFile = { ownerId: 'u1', departmentId: 'cse', scope: 'INSTITUTION' };
assert.strictEqual(resolveAccess(instFile, [], stranger), 'VIEWER');

// Explicit user share upgrades a stranger past scope baseline.
const shares = [{ scope: 'USER', userId: 'u2', roleName: null, departmentId: null, permission: 'EDITOR' }];
assert.strictEqual(resolveAccess(personalFile, shares, stranger), 'EDITOR');

// Highest applicable wins.
const mixedShares = [
  { scope: 'DEPARTMENT', userId: null, roleName: null, departmentId: 'cse', permission: 'VIEWER' },
  { scope: 'USER', userId: 'u3', roleName: null, departmentId: null, permission: 'EDITOR' },
];
assert.strictEqual(resolveAccess(personalFile, mixedShares, deptmate), 'EDITOR');

assert.ok(atLeast('EDITOR', 'VIEWER'));
assert.ok(!atLeast('VIEWER', 'EDITOR'));
assert.ok(!atLeast(null, 'VIEWER'));

console.log('Workspace permissions unit tests passed');
