import assert from 'assert';
import { selectAssignedHodDepartment } from '../modules/hod/hod.middleware';

const departments = [{ id: 'cse', name: 'CSE' }, { id: 'ece', name: 'ECE' }];
assert.equal(selectAssignedHodDepartment(departments).id, 'cse');
assert.equal(selectAssignedHodDepartment(departments, 'ece').id, 'ece');
assert.throws(() => selectAssignedHodDepartment(departments, 'civil'), /CROSS_DEPARTMENT_ACCESS_DENIED/);
assert.throws(() => selectAssignedHodDepartment([], 'cse'), /NO_ASSIGNED_DEPARTMENT/);

console.log('HOD department scope tests passed');
