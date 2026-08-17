import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function getAdbPath() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const defaultAdb = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
  if (fs.existsSync(defaultAdb)) {
    return defaultAdb;
  }
  return 'adb';
}

const adb = getAdbPath();
const apkPath = path.resolve(REPO_ROOT, 'product/client/android/app/build/outputs/apk/debug/app-debug.apk');

try {
  console.log('🔄 Setting up reverse port forward for backend (5000)...');
  execSync(`"${adb}" reverse tcp:5000 tcp:5000`, { stdio: 'inherit' });
  execSync(`"${adb}" reverse tcp:5173 tcp:5173`, { stdio: 'inherit' });

  if (fs.existsSync(apkPath)) {
    console.log(`📦 Installing ${apkPath}...`);
    execSync(`"${adb}" install -r "${apkPath}"`, { stdio: 'inherit' });

    console.log('🚀 Launching CampusOS on connected device...');
    execSync(`"${adb}" shell am start -n com.campusos.app/.MainActivity`, { stdio: 'inherit' });
    console.log('✅ App launched successfully!');
  } else {
    console.error(`❌ APK not found at ${apkPath}. Run 'npm run android:build' first.`);
  }
} catch (err) {
  console.error('❌ Error executing Android runner:', err.message);
}
