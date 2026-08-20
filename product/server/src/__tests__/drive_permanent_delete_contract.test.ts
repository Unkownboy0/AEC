import assert from 'assert';
import fs from 'fs';
import path from 'path';

const service = fs.readFileSync(path.join(__dirname, '../modules/campus-workspace/governed-file.service.ts'), 'utf8');
const routes = fs.readFileSync(path.join(__dirname, '../modules/campus-workspace/workspace.routes.ts'), 'utf8');
const client = fs.readFileSync(path.join(__dirname, '../../../client/src/pages/workspace/CampusDrivePage.tsx'), 'utf8');
const documents = fs.readFileSync(path.join(__dirname, '../modules/campus-workspace/workspace.document.service.ts'), 'utf8');

assert.match(service, /if \(!item\.isTrashed\)/, 'permanent deletion requires Trash state');
assert.match(service, /authorizeDriveItem[\s\S]*?'MANAGE'/, 'folder permanent deletion uses server-side MANAGE authorization');
assert.match(service, /childCount > 0/, 'non-empty folders cannot be silently destroyed');
assert.match(service, /action: 'PERMANENT_DELETE'/, 'folder permanent deletion is audited');
assert.match(routes, /drive\/folders\/:itemId\/permanent/, 'dedicated permanent-folder route is exposed');
assert.match(client, /permanentlyDeleteDriveFolder\(item\.id\)/, 'client calls real permanent-folder endpoint');
assert.doesNotMatch(client, /else \{\s*await workspaceApi\.updateDriveItem\(item\.id, \{ isTrashed: true \}\)/, 'client no longer reports re-trash as permanent deletion');
assert.match(documents, /tx\.campusDriveItem\.create/, 'Workspace document creation atomically registers a Drive item');
assert.match(documents, /mimeType: `application\/vnd\.campusos\./, 'Drive item retains Workspace editor type');
assert.match(documents, /campusDriveItem\.updateMany\(\{\s*where: \{ documentId \}[\s\S]*?name:/, 'document rename updates its canonical Drive item');
assert.match(documents, /status: 'TRASHED'[\s\S]*?isTrashed: true/, 'document trash updates Drive lifecycle');
assert.match(documents, /status: 'DRAFT'[\s\S]*?isTrashed: false/, 'document restore updates Drive lifecycle');
assert.match(documents, /campusDriveItem\.deleteMany\(\{ where: \{ documentId \} \}\)/, 'permanent document deletion removes its Drive record');

console.log('✅ Drive trash-only permanent-delete contract passed');
