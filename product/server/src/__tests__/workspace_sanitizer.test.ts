import assert from 'assert';
import { sanitizeDocHtml } from '../modules/workspace/html-sanitizer';

assert.strictEqual(sanitizeDocHtml('<script>alert(1)</script><p>hi</p>'), '<p>hi</p>');
assert.strictEqual(sanitizeDocHtml('<p onclick="evil()">hi</p>'), '<p>hi</p>');
assert.strictEqual(sanitizeDocHtml('<iframe src="evil"></iframe><p>ok</p>'), '<p>ok</p>');
assert.strictEqual(sanitizeDocHtml('<a href="javascript:alert(1)">x</a>'), '<a rel="noopener noreferrer">x</a>');
assert.strictEqual(sanitizeDocHtml('<unknown>text</unknown>'), 'text');
assert.strictEqual(sanitizeDocHtml('<p style="color: red; background: url(javascript:alert(1))">x</p>'), '<p style="color: red">x</p>');

// Legitimate editor output survives intact.
const good = '<h1>Title</h1><p><b>Bold</b> and <i>italic</i></p><ul><li>one</li></ul><table><tr><td>a</td></tr></table>';
assert.strictEqual(sanitizeDocHtml(good), good);

console.log('Workspace sanitizer unit tests passed');
