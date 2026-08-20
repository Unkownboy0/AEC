import assert from 'assert';
import fs from 'fs';
import path from 'path';

const appSource = fs.readFileSync(path.join(__dirname, '../app.ts'), 'utf8');
const routeSource = fs.readFileSync(path.join(__dirname, '../modules/approvals/approval.routes.ts'), 'utf8');
const controllerSource = fs.readFileSync(path.join(__dirname, '../modules/approvals/approval.controller.ts'), 'utf8');

assert.match(appSource, /app\.use\('\/api', approvalRoutes\)/, 'Canonical approval router must be mounted at /api');
for (const suffix of ['details', 'timeline', 'attachments']) {
  assert.ok(routeSource.includes(`/approval-requests/:requestId/${suffix}`), `${suffix} route must exist`);
}
assert.ok(routeSource.includes('requireApprovalRequestAccess'), 'All approval resources must enforce participant/scope access');
assert.match(controllerSource, /allowedRequestIds\.includes\(attachment\.requestId\)/, 'Attachment download must bind attachment to authorized request');

console.log('✅ Approval route mount and authorization contract passed');
