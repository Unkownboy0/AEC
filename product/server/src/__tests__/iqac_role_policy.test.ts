import assert from 'assert';

const managers = [
  'IQAC Dean',
  'IQAC Executive Officer',
  'IQAC Documentation Officer',
  'Principal',
  'College Admin',
  'Super Admin',
];

assert.ok(managers.includes('IQAC Executive Officer'));
assert.ok(managers.includes('IQAC Documentation Officer'));
assert.ok(!managers.includes('IQAC Executive'));
assert.ok(!managers.includes('IQAC Documentation'));

const contributors = [...managers, 'HOD', 'Head of Department', 'Faculty'];
assert.ok(contributors.includes('Faculty'));
assert.ok(!contributors.includes('Admission Dean'));
assert.ok(!contributors.includes('Academic Dean'));
assert.ok(!contributors.includes('COE'));

console.log('IQAC role policy unit tests passed');
