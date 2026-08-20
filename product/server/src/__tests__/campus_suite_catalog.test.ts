import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { listCampusSuiteApps } from '../modules/campus-workspace/campus-suite.catalog';

const allFeaturesEnabled = async () => true;

async function run() {
  const studentApps = await listCampusSuiteApps(
    { role: 'Student', permissions: [] },
    allFeaturesEnabled
  );
  const studentIds = studentApps.map((app) => app.id);
  assert.deepStrictEqual(studentIds.sort(), ['calendar', 'classroom', 'drive'].sort());
  assert.ok(studentIds.includes('drive'));
  assert.ok(studentIds.includes('calendar'));
  assert.ok(studentIds.includes('classroom'));
  assert.ok(!studentIds.includes('docs'));
  assert.ok(!studentIds.includes('chat'));
  assert.ok(!studentIds.includes('ai'));
  assert.ok(!studentIds.includes('admin-center'));

  const facultyApps = await listCampusSuiteApps(
    { role: 'Faculty', permissions: [] },
    allFeaturesEnabled
  );
  const facultyIds = facultyApps.map((app) => app.id);
  assert.ok(facultyIds.includes('drive'));
  assert.ok(facultyIds.includes('docs'));
  assert.ok(facultyIds.includes('sheets'));
  assert.ok(facultyIds.includes('classroom'));
  assert.ok(!facultyIds.includes('calendar'));
  assert.ok(!facultyIds.includes('chat'));

  const adminApps = await listCampusSuiteApps(
    { role: 'College Admin', permissions: ['settings:read', 'audit:read'] },
    allFeaturesEnabled
  );
  assert.ok(adminApps.some((app) => app.id === 'admin-center'));
  assert.ok(adminApps.some((app) => app.id === 'security'));

  const restrictedAdminApps = await listCampusSuiteApps(
    { role: 'College Admin', permissions: [] },
    allFeaturesEnabled
  );
  assert.ok(!restrictedAdminApps.some((app) => app.id === 'admin-center'));
  assert.ok(!restrictedAdminApps.some((app) => app.id === 'security'));

  const workspaceDisabled = await listCampusSuiteApps(
    { role: 'Student', permissions: [] },
    async (flag) => flag !== 'MODULE_CAMPUS_WORKSPACE_ENABLED'
  );
  assert.ok(!workspaceDisabled.some((app) => ['drive', 'docs', 'sheets', 'slides', 'forms', 'notes'].includes(app.id)));
  assert.ok(workspaceDisabled.some((app) => app.id === 'classroom'));

  const routerSource = fs.readFileSync(
    path.resolve(__dirname, '../../../client/src/routes/Router.tsx'),
    'utf8'
  );
  const demoRoles = [
    'Student', 'Faculty', 'Mentor', 'Class Adviser', 'HOD', 'Academic Dean',
    'Admission Dean', 'IQAC Dean', 'COE', 'Vice Principal', 'Principal',
    'Accountant', 'HR', 'Librarian', 'Hostel Warden', 'Transport Manager',
    'Placement Officer', 'College Admin', 'Super Admin', 'Parent',
  ];
  for (const role of demoRoles) {
    const permissions = ['settings:read', 'audit:read'];
    const apps = await listCampusSuiteApps({ role, permissions }, allFeaturesEnabled);
    for (const app of apps) {
      const route = app.path.split('?')[0].replace(/^\//, '');
      assert.ok(
        routerSource.includes(`path="${route}"`),
        `${role} catalog route is not registered: ${app.path}`
      );
    }
  }

  console.log('Campus suite catalog unit tests passed');
}

void run();
