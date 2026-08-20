import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '../src');
const groups = [
  ['Student', /(?:^|[\\/])pages[\\/]student[\\/]|StudentPortal|StudentDashboard/],
  ['Faculty', /(?:^|[\\/])(pages|modules)[\\/]faculty[\\/]|FacultyPortal/],
  ['Mentor', /(?:^|[\\/])pages[\\/]mentor[\\/]|MentorWorkspace/],
  ['HOD', /(?:^|[\\/])(pages|modules)[\\/]hod[\\/]|Hod|HOD/],
  ['Principal', /(?:^|[\\/])pages[\\/]principal[\\/]|Principal/],
  ['COE', /(?:^|[\\/])pages[\\/]coe[\\/]|CoeWorkspace/],
  ['Operations/Admin', /(?:^|[\\/])pages[\\/](admin|enterprise|accounts)[\\/]|Admin|Enterprise/],
  ['Campus Workspace', /(?:^|[\\/])(pages|components|modules)[\\/]workspace[\\/]|Campus(Drive|Docs|Sheets|Slides|Forms|Notes|Report)/],
  ['Shared shell', /(?:^|[\\/])(layouts|navigation|components[\\/](common|shared))[\\/]|App\.tsx|Router\.tsx/],
];
const ignored = /^(?:[A-Z0-9_./:-]+|https?:|#[0-9a-f]+|[a-z-]+:\S+)$/i;
const normalize = (value) => value.replace(/\s+/g, ' ').trim();
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(path.join(dir, entry.name)) : entry.name.endsWith('.tsx') ? [path.join(dir, entry.name)] : []); }
function strings(source) {
  const values = new Set();
  const patterns = [/>([^<>{}]*[A-Za-z][^<>{}]*)</g, /(?:label|title|placeholder|aria-label|description|subtitle)=['"]([^'"]*[A-Za-z][^'"]*)['"]/g];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) { const value = normalize(match[1]); if (value.length > 1 && value.length < 180 && !ignored.test(value)) values.add(value); }
  return values;
}
function translated(source) { return new Set([...source.matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => normalize(match[1]))); }

const result = new Map(groups.map(([name]) => [name, { files: 0, visible: new Set(), translated: new Set() }]));
for (const file of files(root)) {
  const relative = path.relative(root, file);
  const group = groups.find(([, matcher]) => matcher.test(relative))?.[0] || 'Other production UI';
  if (!result.has(group)) result.set(group, { files: 0, visible: new Set(), translated: new Set() });
  const row = result.get(group); row.files++;
  const source = fs.readFileSync(file, 'utf8');
  strings(source).forEach((value) => row.visible.add(value));
  translated(source).forEach((value) => row.translated.add(value));
}
console.log(JSON.stringify([...result].map(([module, row]) => ({ module, files: row.files, totalUiKeys: new Set([...row.visible, ...row.translated]).size, translatedKeys: row.translated.size, missingKeys: [...row.visible].filter((value) => !row.translated.has(value)).length, englishFallbackCount: [...row.visible].filter((value) => !row.translated.has(value)).length })), null, 2));
