import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const clientRoot = path.join(__dirname, '../../../client/src');
const workspace = fs.readFileSync(path.join(clientRoot, 'pages/workspace/CampusWorkspaceHome.tsx'), 'utf8');
const header = fs.readFileSync(path.join(clientRoot, 'components/shared/RoleHeader.tsx'), 'utf8');
const theme = fs.readFileSync(path.join(clientRoot, 'context/ThemeContext.tsx'), 'utf8');
const css = fs.readFileSync(path.join(clientRoot, 'index.css'), 'utf8');
const quickstartPath = path.join(clientRoot, 'navigation/quickstart-policy.ts');

assert.doesNotMatch(workspace, /Android App|iOS App|Native APK|Download APK|Download IPA|Add to Home Screen/i, 'normal Workspace UI has no app installer/distribution actions');
assert.match(workspace, /label: 'My Files'/, 'mobile tab uses compact My Files label');
assert.match(workspace, /label: 'Shared'/, 'mobile tab uses compact Shared label');
assert.match(workspace, /label: 'Trash'/, 'Trash is a first-class tab');
assert.match(workspace, /bottom-\[calc\(var\(--mobile-bottom-nav-height\)\+var\(--safe-area-bottom\)\+10px\)\]/, 'mobile file actions are bottom-nav and safe-area aware');
assert.match(workspace, /doc\.isOwner !== false/, 'destructive action is hidden for shared non-owner list items');
assert.ok(workspace.includes('Move "${doc.title}" to Trash?'), 'Move to Trash requires explicit title-aware confirmation');
assert.match(workspace, /permanentlyDeleteDocument/, 'Trash permanent-delete uses the canonical API');

assert.doesNotMatch(header, /Sem \$\{student\.semester\.number\} Year/, 'academic context cannot produce “Sem 1 Year”');
assert.match(header, /Year \$\{String\(academicYearNumber\)/, 'student context has a separate canonical year segment');
assert.match(header, /Section \$\{sectionValue\}/, 'student context uses canonical section when available');

assert.match(theme, /StatusBar\.setOverlaysWebView\(\{ overlay: false \}\)/, 'native WebView does not draw header controls under the status bar');
assert.match(theme, /applyTheme\(preference\)/, 'explicit Light/Dark/System preference is re-synchronized on resume');
assert.match(css, /campus-app-header\.pt-safe[\s\S]*?var\(--safe-area-top\)/, 'mobile header consumes the centralized safe-area token');

const compiled = ts.transpileModule(fs.readFileSync(quickstartPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleBox: { exports: any } = { exports: {} };
new Function('module', 'exports', compiled)(moduleBox, moduleBox.exports);
const { shouldShowQuickStart } = moduleBox.exports;
assert.strictEqual(shouldShowQuickStart({ pathname: '/student/dashboard', isKeyboardOpen: false, hasActions: true }), false, 'dashboard has no unrelated global FAB');
assert.strictEqual(shouldShowQuickStart({ pathname: '/workspace', isKeyboardOpen: false, hasActions: true }), false, 'Workspace uses its dedicated create sheet, not a second global FAB');
assert.strictEqual(shouldShowQuickStart({ pathname: '/workspace/drive', isKeyboardOpen: false, hasActions: true }), false, 'Drive content is not obscured by global FAB');

console.log('✅ Mobile native shell, Workspace recovery, Trash action, and installer-absence contract passed');
