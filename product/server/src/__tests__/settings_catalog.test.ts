import assert from 'assert';
import { SETTING_BY_KEY, validateSettingChanges } from '../modules/settings/settings.catalog';

assert.ok(SETTING_BY_KEY.has('COLLEGE_NAME'));
assert.ok(SETTING_BY_KEY.has('OD_MIN_ADVANCE_DAYS'));
assert.ok(!SETTING_BY_KEY.has('JWT_SECRET'));
assert.ok(!SETTING_BY_KEY.has('DATABASE_URL'));

assert.deepStrictEqual(validateSettingChanges({ OD_MIN_ADVANCE_DAYS: 3 }), { OD_MIN_ADVANCE_DAYS: '3' });
assert.throws(() => validateSettingChanges({ OD_MIN_ADVANCE_DAYS: -1 }));
assert.throws(() => validateSettingChanges({ COLLEGE_WEBSITE: 'http://insecure.example' }));
assert.throws(() => validateSettingChanges({ JWT_SECRET: 'must-not-be-writable' }));
assert.throws(() => validateSettingChanges({}));

console.log('Settings catalog unit tests passed');
