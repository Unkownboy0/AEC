import assert from 'assert';
import fs from 'fs';
import path from 'path';

const clientRoot = path.join(__dirname, '../../../client');
const serverRoot = path.join(__dirname, '..');
const repoRoot = path.join(clientRoot, '../..');
const readClient = (relative: string) => fs.readFileSync(path.join(clientRoot, relative), 'utf8');
const readServer = (relative: string) => fs.readFileSync(path.join(serverRoot, relative), 'utf8');

const language = readClient('src/context/LanguageContext.tsx');
for (const code of ['en', 'ta', 'hi', 'ml', 'te', 'kn', 'bn', 'mr', 'gu', 'pa', 'ur', 'ar']) {
  assert.match(language, new RegExp(`code: '${code}'`), `Language ${code} must be selectable`);
}
assert.match(language, /documentElement\.dir = direction/, 'Arabic and Urdu must update document direction');
assert.match(language, /Dashboard: /);
assert.match(language, /Notifications: /);
assert.match(language, /Download: /);

const settings = readClient('src/pages/Settings.tsx');
assert.match(settings, /api\.put\('\/users\/profile\/preferences'/, 'Personal settings must persist through the existing profile API');
assert.match(settings, /BUILD_INFO\.commit/, 'Internal diagnostics must expose the source commit');
assert.match(settings, /notificationsEnabled: !notificationsEnabled/, 'Notification toggle must persist the actual next value');

const bottomNav = readClient('src/layouts/mobile/MobileBottomNav.tsx');
assert.ok(!bottomNav.includes('backdrop-blur-sm'), 'Bottom navigation must not retain glow/blur decoration');
assert.match(bottomNav, /t\(tab\.shortLabel \|\| tab\.label\)/, 'Bottom navigation labels must use the active language');

const fabPolicy = readClient('src/navigation/quickstart-policy.ts');
for (const pattern of ['/profile', '/settings', '/student\\/id-card', '/student\\/certificates', '/student\\/fees', '/hod\\/approvals']) {
  assert.ok(fabPolicy.includes(pattern), `FAB exclusion policy must cover ${pattern}`);
}
assert.match(fabPolicy, /hasActions/, 'FAB must require a real contextual create action');

const router = readClient('src/routes/Router.tsx');
for (const route of ['hod/faculty', 'hod/mentors', 'hod/allocation', 'hod/timetable', 'hod/leave-approvals']) {
  assert.ok(router.includes(`path="${route}"`), `HOD client route ${route} must be mounted`);
}

const hodRoutes = readServer('modules/hod/hod.routes.ts');
for (const endpoint of ['/allocation/subjects', '/allocation/sections', '/allocation/faculty-workload', '/allocation/assign', '/allocation']) {
  assert.ok(hodRoutes.includes(`'${endpoint}'`), `HOD allocation API ${endpoint} must be mounted`);
}
const hodController = readServer('modules/hod/hod.controller.ts');
assert.match(hodController, /Section does not belong to your department/, 'Allocation must reject cross-department sections');
assert.ok(!hodController.includes('subject.semesterId || sectionId'), 'A section ID must never be written as a semester ID');
assert.match(hodController, /availableSlots/, 'Faculty workload response must include free/busy capacity');

const documents = readServer('modules/campus-workspace/workspace.document.service.ts');
const createStart = documents.indexOf('static async createDocument');
const shareStart = documents.indexOf('static async shareDocument');
assert.ok(createStart >= 0 && shareStart > createStart);
const createBody = documents.slice(createStart, shareStart);
assert.ok(!createBody.includes('submitForWorkflow'), 'Creating a personal document must not implicitly submit it');
assert.ok(documents.includes('static async shareDocument'));
assert.ok(documents.includes('static async submitForWorkflow'));

const pruneScript = readClient('scripts/prune-stale-mobile-assets.js');
assert.match(pruneScript, /endsWith\('\.apk'\)/, 'Mobile builds must prune nested APK payloads');
assert.match(pruneScript, /endsWith\('\.aab'\)/, 'Mobile builds must prune nested AAB payloads');

for (const relative of ['local-server-hosting/nginx/nginx.conf', 'local-server-hosting/lan-to-public-hosting/nginx/nginx-secure-public.conf']) {
  const nginx = fs.readFileSync(path.join(repoRoot, relative), 'utf8');
  assert.match(nginx, /location = \/api\/rbac\/stream/);
  assert.match(nginx, /proxy_buffering off/);
  assert.match(nginx, /proxy_read_timeout 1h/);
}

console.log('Post-security functional route, settings, localization, FAB, allocation, workspace, and packaging contracts passed');
