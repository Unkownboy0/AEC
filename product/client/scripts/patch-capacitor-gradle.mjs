import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const moduleDirectory = resolve('android/capacitor-cordova-android-plugins');
const buildFile = resolve(moduleDirectory, 'build.gradle');
const libraryDirectories = [resolve(moduleDirectory, 'src/main/libs'), resolve(moduleDirectory, 'libs')];

const hasLocalAar = libraryDirectories.some((directory) =>
  existsSync(directory) && readdirSync(directory).some((name) => name.toLowerCase().endsWith('.aar')),
);

if (!existsSync(buildFile) || hasLocalAar) process.exit(0);

const source = readFileSync(buildFile, 'utf8');
const patched = source.replace(/\n\s*flatDir\s*\{\s*\n?\s*dirs\s+['"]src\/main\/libs['"],\s*['"]libs['"]\s*\n?\s*\}/, '');

if (patched !== source) {
  writeFileSync(buildFile, patched, 'utf8');
  console.log('Removed unused flatDir repository from generated Capacitor Cordova module.');
}
