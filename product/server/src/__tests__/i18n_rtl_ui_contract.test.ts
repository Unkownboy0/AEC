import assert from 'assert';
import fs from 'fs';
import path from 'path';

const client = path.resolve(__dirname, '../../../client/src');
const language = fs.readFileSync(path.join(client, 'context/LanguageContext.tsx'), 'utf8');
const css = fs.readFileSync(path.join(client, 'index.css'), 'utf8');
const coe = fs.readFileSync(path.join(client, 'pages/coe/CoeHallTicketsPage.tsx'), 'utf8');
const student = fs.readFileSync(path.join(client, 'pages/student/StudentExaminations.tsx'), 'utf8');
const routes = fs.readFileSync(path.join(client, 'routes/Router.tsx'), 'utf8');
const nav = fs.readFileSync(path.join(client, 'navigation/route-registry.ts'), 'utf8');

for (const code of ['en','ta','hi','ml','te','kn','bn','mr','gu','pa','ur','ar']) assert.match(language, new RegExp(`code: '${code}'`));
assert.match(language, /new Intl\.PluralRules\(language\)/);
assert.match(language, /new Intl\.DateTimeFormat\(language/);
assert.match(language, /new Intl\.NumberFormat\(language/);
assert.match(language, /englishCatalog\[pluralKey\] \|\| englishCatalog\[key\]/, 'English fallback must precede raw key fallback');
assert.match(language, /document\.documentElement\.dir = direction/);
assert.match(css, /html\[dir="rtl"\][\s\S]+unicode-bidi: isolate/);
assert.match(css, /html\[dir="rtl"\] \.ProseMirror \{ direction: ltr/, 'RTL chrome must not reverse user-authored document content');
assert.match(coe, /useLanguage\(\)/);
assert.doesNotMatch(coe, />Hall Tickets</);
assert.match(coe, /\/coe\/hall-tickets/);
assert.match(student, /useLanguage\(\)/);
assert.match(routes, /path="coe\/hall-tickets"/);
assert.match(nav, /path: '\/coe\/hall-tickets'/);
console.log('PASS i18n runtime, RTL, COE operations UI, and route contracts');
