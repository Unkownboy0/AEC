import assert from 'assert';
import { validateCommonUpload } from '../modules/files/file-upload.validation';
import { normalizeProfileGender } from '../modules/users/profile-values';
import { profileImageDescriptor } from '../modules/users/profile-media.service';

const images = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const validate = (name: string, mimeType: string, bytes: Buffer, maximumBytes = 1024) => validateCommonUpload({
  name, mimeType, base64: bytes.toString('base64'), maximumBytes,
  allowedMimeTypes: images, allowedExtensions: imageExtensions,
});

function run() {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(2)]);

  assert.strictEqual(validate('photo.jpg', 'image/jpeg', jpeg).mimeType, 'image/jpeg');
  assert.strictEqual(validate('photo.png', 'image/png', png).extension, '.png');
  assert.strictEqual(validate('photo.webp', 'image/webp', webp).buffer.length, webp.length);
  assert.throws(() => validate('photo.png', 'image/jpeg', jpeg), /extension does not match/i);
  assert.throws(() => validate('photo.jpg', 'image/jpeg', Buffer.from('not-an-image')), /content does not match/i);
  assert.throws(() => validate('photo.jpg', 'image/jpeg', jpeg, 2), /exceeds/i);
  assert.throws(() => validateCommonUpload({ name: 'photo.jpg', mimeType: 'image/jpeg', base64: '***', maximumBytes: 10, allowedMimeTypes: images, allowedExtensions: imageExtensions }), /base64/i);

  assert.strictEqual(normalizeProfileGender('Female'), 'FEMALE');
  assert.strictEqual(normalizeProfileGender('prefer not to disclose'), 'PREFER_NOT_TO_SAY');
  assert.strictEqual(normalizeProfileGender(null), 'UNSPECIFIED');
  assert.throws(() => normalizeProfileGender('invalid-value'), /must be one of/i);

  const descriptor = profileImageDescriptor({
    id: 'user-1', profileImageFileId: 'file-1', profilePhoto: '/legacy.jpg',
    profileImageFile: { checksum: 'abcdef0123456789abcdef', currentVersion: 1 },
  });
  assert.strictEqual(descriptor.fileId, 'file-1');
  assert.strictEqual(descriptor.url, '/users/user-1/avatar?v=abcdef0123456789');
  assert.ok(!descriptor.url?.includes('/legacy.jpg'));
  console.log('Profile media validation tests passed');
}

run();
