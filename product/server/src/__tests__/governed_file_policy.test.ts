import assert from 'assert';
import {
  actorHasGrantedAccess,
  grantAllowsAction,
  grantIsActive,
  grantMatchesActor,
} from '../modules/campus-workspace/governed-file.policy';

const actor = {
  userId: 'user-a',
  role: 'Faculty',
  workspace: 'Faculty',
  departmentId: 'department-cse',
};

function run() {
  const viewGrant = { principalType: 'SPECIFIC_USER', principalId: 'user-a', accessLevel: 'VIEW' };
  assert.ok(grantMatchesActor(viewGrant, actor));
  assert.ok(grantAllowsAction(viewGrant, 'VIEW'));
  assert.ok(!grantAllowsAction(viewGrant, 'DOWNLOAD'));
  assert.ok(!grantAllowsAction(viewGrant, 'EDIT'));

  const downloadGrant = { ...viewGrant, accessLevel: 'DOWNLOAD' };
  assert.ok(grantAllowsAction(downloadGrant, 'VIEW'));
  assert.ok(grantAllowsAction(downloadGrant, 'DOWNLOAD'));
  assert.ok(!grantAllowsAction(downloadGrant, 'EDIT'));

  assert.ok(grantMatchesActor({ principalType: 'ROLE', principalId: 'faculty', accessLevel: 'VIEW' }, actor));
  assert.ok(grantMatchesActor({ principalType: 'WORKSPACE', principalId: 'FACULTY', accessLevel: 'VIEW' }, actor));
  assert.ok(grantMatchesActor({ principalType: 'DEPARTMENT', principalId: 'department-cse', accessLevel: 'VIEW' }, actor));
  assert.ok(grantMatchesActor({ principalType: 'ALL_INSTITUTION', principalId: null, accessLevel: 'VIEW' }, actor));
  assert.ok(!grantMatchesActor({ principalType: 'SPECIFIC_USER', principalId: 'user-b', accessLevel: 'MANAGE' }, actor));

  const expired = { ...viewGrant, expiresAt: new Date(Date.now() - 1_000) };
  const revoked = { ...viewGrant, revokedAt: new Date() };
  assert.ok(!grantIsActive(expired));
  assert.ok(!grantIsActive(revoked));
  assert.ok(!actorHasGrantedAccess([expired, revoked], actor, 'VIEW'));

  const manage = { principalType: 'ROLE', principalId: 'Faculty', accessLevel: 'MANAGE' };
  assert.ok(actorHasGrantedAccess([manage], actor, 'VIEW'));
  assert.ok(actorHasGrantedAccess([manage], actor, 'DOWNLOAD'));
  assert.ok(actorHasGrantedAccess([manage], actor, 'COMMENT'));
  assert.ok(actorHasGrantedAccess([manage], actor, 'EDIT'));
  assert.ok(actorHasGrantedAccess([manage], actor, 'MANAGE'));

  console.log('Governed file policy unit tests passed');
}

run();
