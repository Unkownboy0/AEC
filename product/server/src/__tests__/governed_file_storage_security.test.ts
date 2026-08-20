import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveGovernedPhysicalPath } from '../modules/campus-workspace/governed-file.service';

function run() {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'campusos-governed-file-'));
  const root = path.join(sandbox, 'storage');
  const outside = path.join(sandbox, 'outside');
  fs.mkdirSync(path.join(root, 'drive', 'user-a'), { recursive: true });
  fs.mkdirSync(outside, { recursive: true });
  const valid = path.join(root, 'drive', 'user-a', 'proof.pdf');
  const secret = path.join(outside, 'secret.pdf');
  fs.writeFileSync(valid, 'governed file');
  fs.writeFileSync(secret, 'outside root');

  const previousRoot = process.env.STORAGE_ROOT;
  process.env.STORAGE_ROOT = root;
  try {
    assert.strictEqual(resolveGovernedPhysicalPath('drive/user-a/proof.pdf'), fs.realpathSync(valid));
    assert.strictEqual(resolveGovernedPhysicalPath('../outside/secret.pdf'), null);
    assert.strictEqual(resolveGovernedPhysicalPath('drive/user-a/../../outside/secret.pdf'), null);
    assert.strictEqual(resolveGovernedPhysicalPath('\0secret.pdf'), null);
    assert.strictEqual(resolveGovernedPhysicalPath(secret), null);

    const junction = path.join(root, 'escaped-link');
    try {
      fs.symlinkSync(outside, junction, 'junction');
      assert.strictEqual(resolveGovernedPhysicalPath('escaped-link/secret.pdf'), null);
    } catch (error: any) {
      if (!['EPERM', 'EACCES', 'UNKNOWN'].includes(error?.code)) throw error;
      console.log('Symlink creation unavailable; realpath escape branch statically retained.');
    }
  } finally {
    if (previousRoot === undefined) delete process.env.STORAGE_ROOT;
    else process.env.STORAGE_ROOT = previousRoot;
    fs.rmSync(sandbox, { recursive: true, force: true });
  }
  console.log('Governed file storage security tests passed');
}

run();
