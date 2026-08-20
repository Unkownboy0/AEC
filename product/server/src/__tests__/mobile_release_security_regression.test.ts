import assert from 'assert';
import fs from 'fs';
import path from 'path';

const clientRoot = path.join(__dirname, '../../../client');
const gradle = fs.readFileSync(path.join(clientRoot, 'android/app/build.gradle'), 'utf8');
const mainManifest = fs.readFileSync(path.join(clientRoot, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
const mainNetwork = fs.readFileSync(path.join(clientRoot, 'android/app/src/main/res/xml/network_security_config.xml'), 'utf8');
const debugManifest = fs.readFileSync(path.join(clientRoot, 'android/app/src/debug/AndroidManifest.xml'), 'utf8');
const environment = fs.readFileSync(path.join(clientRoot, 'src/shared/config/environment.ts'), 'utf8');
const loginPage = fs.readFileSync(path.join(clientRoot, 'src/pages/Login.tsx'), 'utf8');
const apiPolicySource = fs.readFileSync(path.join(clientRoot, 'src/config/api-url-policy.ts'), 'utf8');
const validateProductionApiUrl = new Function(
  `${apiPolicySource.split('export type DeploymentMode')[0].replace('export function', 'function').replace('apiUrl: string', 'apiUrl').replace('): boolean', ')')}\nreturn validateProductionApiUrl;`,
)() as (value: string) => boolean;
const onPremPolicySource = apiPolicySource
  .replace(/export type DeploymentMode[^;]+;/, '')
  .replace(/export function/g, 'function')
  .replace(/: string/g, '')
  .replace(/: boolean/g, '')
  .replace(/, mode: DeploymentMode/, ', mode');
const validateOnPremApiUrl = new Function(`${onPremPolicySource}\nreturn validateOnPremApiUrl;`)() as (value: string) => boolean;
const iosProject = fs.readFileSync(path.join(clientRoot, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
const iosEntitlements = fs.readFileSync(path.join(clientRoot, 'ios/App/App/App.entitlements'), 'utf8');
const iosInfo = fs.readFileSync(path.join(clientRoot, 'ios/App/App/Info.plist'), 'utf8');

assert.ok(!/signingConfig\s+signingConfigs\.debug/.test(gradle), 'Release must never fall back to debug signing');
assert.match(gradle, /throw new GradleException\('CampusOS release signing is required/, 'Missing release signing must fail the build');
assert.match(mainManifest, /usesCleartextTraffic="false"/, 'Main/release manifest must forbid cleartext');
assert.match(mainNetwork, /base-config cleartextTrafficPermitted="false"/, 'Release network policy must be HTTPS-only');
assert.match(debugManifest, /usesCleartextTraffic="true"/, 'LAN HTTP remains available only in debug source set');
assert.ok(!environment.includes('10.226.116.201'), 'Production runtime must not contain the developer LAN fallback');
assert.match(loginPage, /import\.meta\.env\.DEV && showServerConfig/, 'LAN configuration UI must be tree-gated to development builds');

assert.strictEqual(validateProductionApiUrl('http://localhost:5000/api'), false);
assert.strictEqual(validateProductionApiUrl(''), false);
assert.strictEqual(validateProductionApiUrl('https://127.0.0.1/api'), false);
assert.strictEqual(validateProductionApiUrl('https://10.0.0.5/api'), false);
assert.strictEqual(validateProductionApiUrl('https://172.16.0.5/api'), false);
assert.strictEqual(validateProductionApiUrl('https://172.31.255.254/api'), false);
assert.strictEqual(validateProductionApiUrl('https://192.168.1.5/api'), false);
assert.strictEqual(validateProductionApiUrl('http://campus.example.edu/api'), false);
assert.strictEqual(validateProductionApiUrl('https://campus.example.edu/api'), true);
assert.strictEqual(validateOnPremApiUrl('http://10.0.0.5:5000/api'), true);
assert.strictEqual(validateOnPremApiUrl('http://172.16.0.5:5000/api'), true);
assert.strictEqual(validateOnPremApiUrl('https://172.31.255.254/api'), true);
assert.strictEqual(validateOnPremApiUrl('http://192.168.1.5:5000/api'), true);
assert.strictEqual(validateOnPremApiUrl('http://127.0.0.1:5000/api'), false);
assert.strictEqual(validateOnPremApiUrl('http://169.254.1.5:5000/api'), false);
assert.strictEqual(validateOnPremApiUrl('http://0.0.0.0:5000/api'), false);
assert.strictEqual(validateOnPremApiUrl('http://campus.example.edu/api'), false);
assert.strictEqual(validateOnPremApiUrl(''), false);

assert.match(iosProject, /com\.apple\.Push = \{ enabled = 1; \}/, 'Xcode Push Notifications capability must be enabled');
assert.match(iosProject, /CODE_SIGN_ENTITLEMENTS = App\/App\.entitlements/, 'Target must use the APNs entitlements file');
assert.match(iosEntitlements, /\$\(APS_ENVIRONMENT\)/, 'APNs environment must follow the Xcode build configuration');
assert.match(iosInfo, /<string>remote-notification<\/string>/, 'Remote-notification background mode must be declared');

console.log('✅ Mobile release signing, transport, API URL, and APNs source policies passed');
