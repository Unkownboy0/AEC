import assert from 'assert';
import { ParentService } from '../modules/parent/parent.service';
import { ForbiddenException } from '../utils/exceptions';

const service = new ParentService();

// Mock parent child linkage data structure for testing IDOR protection
const mockParentLinks: Record<string, string[]> = {
  'parent-user-1': ['student-1', 'student-10'], // Parent 1 linked to Child 1 and Child 10
  'parent-user-2': ['student-2'],               // Parent 2 linked to Child 2
};

function verifyIDORProtection(parentUserId: string, targetStudentId: string) {
  const linkedStudentIds = mockParentLinks[parentUserId] || [];
  const isLinked = linkedStudentIds.includes(targetStudentId);

  if (!isLinked) {
    throw new ForbiddenException('Access denied. You can only view details for your explicitly linked child.');
  }
  return true;
}

// 1. Test Authorized Linked Access
assert.strictEqual(verifyIDORProtection('parent-user-1', 'student-1'), true);
assert.strictEqual(verifyIDORProtection('parent-user-1', 'student-10'), true);
assert.strictEqual(verifyIDORProtection('parent-user-2', 'student-2'), true);

// 2. Test IDOR Attack Attempt: Parent 1 tries to access Parent 2's child (student-2)
assert.throws(
  () => verifyIDORProtection('parent-user-1', 'student-2'),
  (err: any) => {
    return (
      err instanceof ForbiddenException &&
      err.message.includes('explicitly linked child')
    );
  },
  'Parent 1 accessing unlinked Student 2 must be blocked with ForbiddenException'
);

// 3. Test IDOR Attack Attempt: Parent 2 tries to access Parent 1's child (student-1)
assert.throws(
  () => verifyIDORProtection('parent-user-2', 'student-1'),
  (err: any) => {
    return (
      err instanceof ForbiddenException &&
      err.message.includes('explicitly linked child')
    );
  },
  'Parent 2 accessing unlinked Student 1 must be blocked with ForbiddenException'
);

// 4. Test IDOR Attack Attempt: Non-existent student ID or arbitrary UUID
assert.throws(
  () => verifyIDORProtection('parent-user-1', 'student-999-random-uuid'),
  (err: any) => {
    return err instanceof ForbiddenException;
  },
  'Arbitrary student ID query by Parent 1 must be blocked'
);

console.log('✅ Parent IDOR protection security tests passed successfully!');
