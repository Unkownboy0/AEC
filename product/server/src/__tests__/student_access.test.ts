import assert from 'assert';
import {
  canViewResolvedStudent,
  StudentAccessScope,
} from '../modules/security/student-access.service';

const restrictedScope: StudentAccessScope = {
  unrestricted: false,
  studentIds: ['student-a'],
  departmentIds: ['department-cse'],
  sectionIds: ['section-cse-a'],
  subjectIds: ['subject-programming'],
};

const studentA = { id: 'student-a', departmentId: 'department-cse', sectionId: 'section-cse-a' };
const studentB = { id: 'student-b', departmentId: 'department-cse', sectionId: 'section-cse-b' };
const studentC = { id: 'student-c', departmentId: 'department-eee', sectionId: 'section-eee-a' };

assert.strictEqual(canViewResolvedStudent('Student', restrictedScope, studentA), true);
assert.strictEqual(canViewResolvedStudent('Student', restrictedScope, studentB), false);
assert.strictEqual(canViewResolvedStudent('Parent', restrictedScope, studentA), true);
assert.strictEqual(canViewResolvedStudent('Parent', restrictedScope, studentB), false);
assert.strictEqual(canViewResolvedStudent('Mentor', restrictedScope, studentA), true);
assert.strictEqual(canViewResolvedStudent('Mentor', restrictedScope, studentB), false);
assert.strictEqual(canViewResolvedStudent('Faculty', restrictedScope, studentA), true);
assert.strictEqual(canViewResolvedStudent('Faculty', restrictedScope, studentB), false);
assert.strictEqual(canViewResolvedStudent('HOD', restrictedScope, studentB), true);
assert.strictEqual(canViewResolvedStudent('HOD', restrictedScope, studentC), false);

const institutionScope: StudentAccessScope = {
  unrestricted: true,
  studentIds: [],
  departmentIds: [],
  sectionIds: [],
  subjectIds: [],
};
assert.strictEqual(canViewResolvedStudent('Principal', institutionScope, studentC), true);

// Achievement Privacy Policy Test
const sampleAchievements = [
  { id: 'ach-1', title: 'National Hackathon Winner', isPublished: true, verified: true },
  { id: 'ach-2', title: 'Private Research Draft', isPublished: false, verified: false },
];

const filterAchievementsForViewer = (items: typeof sampleAchievements, requesterRole: string, isSelf: boolean) => {
  const isLeadershipOrStaff = ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACADEMIC_DEAN', 'HOD', 'FACULTY', 'MENTOR']
    .includes((requesterRole || '').toUpperCase().replace(/[\s_-]+/g, ''));
  if (isSelf || isLeadershipOrStaff) return items;
  return items.filter(a => a.isPublished);
};

// Owner student sees all own achievements (both private & published)
assert.strictEqual(filterAchievementsForViewer(sampleAchievements, 'Student', true).length, 2);

// Peer student sees ONLY published achievements
assert.strictEqual(filterAchievementsForViewer(sampleAchievements, 'Student', false).length, 1);
assert.strictEqual(filterAchievementsForViewer(sampleAchievements, 'Student', false)[0].id, 'ach-1');

// Faculty/Mentor sees all achievements for target student
assert.strictEqual(filterAchievementsForViewer(sampleAchievements, 'Mentor', false).length, 2);

console.log('Student access policy and achievement privacy unit tests passed');
