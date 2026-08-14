import assert from 'assert';
import { applyMergeFields } from '../modules/workspace/merge-fields-apply';

const fields = { 'institution.name': 'Geetorus Institute', 'department.name': 'CSE' };

const first = applyMergeFields('<h1>{{institution.name}}</h1><p>{{department.name}}</p>', fields);
assert.strictEqual(first, '<h1><span data-field="institution.name">Geetorus Institute</span></h1><p><span data-field="department.name">CSE</span></p>');

// Refresh: re-resolving an already-merged span updates it in place (idempotent), not a stale copy.
const refreshed = applyMergeFields(first, { 'institution.name': 'Renamed College', 'department.name': 'CSE' });
assert.ok(refreshed.includes('<span data-field="institution.name">Renamed College</span>'));

// Unknown tokens are left untouched rather than silently dropped.
const unknown = applyMergeFields('{{student.name}}', fields);
assert.strictEqual(unknown, '{{student.name}}');

// XSS via a field value is escaped, not injected as markup.
const xss = applyMergeFields('{{institution.name}}', { 'institution.name': '<script>evil()</script>' });
assert.ok(!xss.includes('<script>'));

console.log('Workspace merge-field unit tests passed');
