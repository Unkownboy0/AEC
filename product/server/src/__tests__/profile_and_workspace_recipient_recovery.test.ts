import assert from 'assert';
import fs from 'fs';
import path from 'path';

const read = (relative: string) => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');

const auth = read('modules/auth/auth.service.ts');
const routes = read('modules/campus-workspace/workspace.routes.ts');
const controller = read('modules/campus-workspace/workspace.controller.ts');
const recipients = read('modules/campus-workspace/workspace-recipient.service.ts');
const documents = read('modules/campus-workspace/workspace.document.service.ts');
const modal = fs.readFileSync(path.join(__dirname, '../../../client/src/components/workspace/WorkspaceShareModal.tsx'), 'utf8');
const profile = fs.readFileSync(path.join(__dirname, '../../../client/src/pages/Profile.tsx'), 'utf8');

assert.match(auth, /profileImageDescriptor\(user as any\)/, '/me must use the canonical versioned avatar descriptor');
assert.doesNotMatch(auth, /let profileImageUrl = user\.profilePhoto/, '/me must not rebuild current avatar from legacy profilePhoto only');

assert.match(routes, /get\('\/share-recipients'/, 'Workspace must mount authorized recipient discovery');
assert.match(controller, /assertShareEnvelope/, 'Share mutations must authorize scope and permission envelope');
assert.match(controller, /assertEligible/, 'Share mutations must recheck selected user eligibility server-side');
assert.match(recipients, /key === 'PARENT'/, 'Parent discovery must fail closed');
assert.match(recipients, /key === 'STUDENT'/, 'Student discovery must use relationship-scoped rules');
assert.match(recipients, /Institution-wide sharing is not permitted/, 'Institution-wide scope must be role-gated');
assert.match(documents, /userId: e\.userId/, 'Canonical user IDs must be persisted in document ACL entries');
assert.match(documents, /shared .* with .* access/, 'Specific-user share notifications must identify the actor and document');

assert.match(modal, /\/workspace\/share-recipients/, 'Rendered share UI must call the mounted Workspace recipient endpoint');
assert.match(modal, /userId: entry\.id/, 'Share UI must submit canonical user IDs, not email text');
assert.match(modal, /No authorized recipients match this search/, 'Recipient discovery must explain authorization-scoped empty results');
assert.match(modal, /does not submit this document for approval/, 'Share and workflow submission must remain visibly separate');
assert.doesNotMatch(modal, /\/users\/search/, 'Dead user-search endpoint must not remain in the active share UI');

for (const fake of ['+91 98765 43210', 'Computer Science & Engineering', 'ADM2026001', 'EMP001']) {
  assert.ok(!profile.includes(fake), `Production Profile page must not display fake fallback: ${fake}`);
}

console.log('Profile identity and authorized Workspace recipient recovery contract passed');
