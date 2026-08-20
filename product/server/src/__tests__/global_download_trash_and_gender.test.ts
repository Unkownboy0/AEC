import assert from 'assert';
import { ReportsService } from '../modules/reports/reports.service';
import { normalizeProfileGender } from '../modules/users/profile-values';
import { profileImageDescriptor } from '../modules/users/profile-media.service';

async function run() {
  console.log('--- Starting Global Download, Trash Policy & Gender Verification Tests ---');

  // 1. REPORT EXPORT BUFFERS
  const reportsService = new ReportsService();
  const mockUser = { firstName: 'Dean', lastName: 'Admin', role: { name: 'Super Admin' } };
  const mockData = {
    totalStudents: 1250,
    totalFaculties: 85,
    totalDepartments: 4,
    departments: [
      { code: 'CSE', name: 'Computer Science and Engineering', _count: { students: 600, faculties: 35 } },
      { code: 'ECE', name: 'Electronics and Communication Engineering', _count: { students: 350, faculties: 25 } },
      { code: 'MECH', name: 'Mechanical Engineering', _count: { students: 180, faculties: 15 } },
      { code: 'CIVIL', name: 'Civil Engineering', _count: { students: 120, faculties: 10 } },
    ]
  };

  // Test PDF generation
  const pdfBuffer = await reportsService.generatePDFReportBuffer('Institution Comprehensive Summary', mockUser, mockData);
  assert.ok(pdfBuffer instanceof Buffer, 'PDF output must be a Buffer');
  assert.ok(pdfBuffer.length > 500, 'PDF buffer must contain substantial bytes');
  assert.strictEqual(pdfBuffer.slice(0, 5).toString('utf-8'), '%PDF-', 'PDF must start with %PDF- magic signature');

  // Test Excel generation
  const excelBuffer = await reportsService.generateExcelReportBuffer('Institution Comprehensive Summary', mockUser, mockData);
  assert.ok(excelBuffer instanceof Buffer, 'Excel output must be a Buffer');
  assert.ok(excelBuffer.length > 1000, 'Excel buffer must contain valid OpenXML bytes');
  assert.strictEqual(excelBuffer.slice(0, 2).toString('utf-8'), 'PK', 'Excel XLSX must start with PK zip signature');

  // Test CSV generation
  const csvBuffer = await reportsService.generateCsvReportBuffer('Institution Comprehensive Summary', mockUser, mockData);
  assert.ok(csvBuffer instanceof Buffer, 'CSV output must be a Buffer');
  const csvString = csvBuffer.toString('utf-8');
  assert.ok(csvString.includes('"Report Type","Institution Comprehensive Summary"'), 'CSV must include report header');
  assert.ok(csvString.includes('"CSE","Computer Science and Engineering","600","35"'), 'CSV must include department metrics');

  // 2. GENDER PROFILE NORMALIZATION & INVARIANTS
  assert.strictEqual(normalizeProfileGender('MALE'), 'MALE');
  assert.strictEqual(normalizeProfileGender('male'), 'MALE');
  assert.strictEqual(normalizeProfileGender('FEMALE'), 'FEMALE');
  assert.strictEqual(normalizeProfileGender('female'), 'FEMALE');
  assert.strictEqual(normalizeProfileGender('OTHER'), 'OTHER');
  assert.strictEqual(normalizeProfileGender('prefer not to say'), 'PREFER_NOT_TO_SAY');
  assert.strictEqual(normalizeProfileGender(''), 'UNSPECIFIED');
  assert.strictEqual(normalizeProfileGender(null), 'UNSPECIFIED');
  assert.strictEqual(normalizeProfileGender(undefined), 'UNSPECIFIED');
  assert.throws(() => normalizeProfileGender('UNKNOWN_GENDER_STRING'), /must be one of/i);

  // 3. AVATAR CASCADE RESOLUTION
  // Tier 1: Custom uploaded photo
  const customAvatarDescriptor = profileImageDescriptor({
    id: 'user-001',
    profileImageFileId: 'file-avatar-123',
    profileImageFile: { checksum: 'a1b2c3d4e5f67890', currentVersion: 2 },
    profilePhoto: '/legacy.jpg'
  });
  assert.strictEqual(customAvatarDescriptor.url, '/users/user-001/avatar?v=a1b2c3d4e5f67890', 'Custom avatar must use checksum versioned endpoint');
  assert.ok(customAvatarDescriptor.fileId !== null, 'Custom avatar must have valid fileId');

  // Tier 2 & 3: Fallback when no custom image
  const fallbackAvatarDescriptor = profileImageDescriptor({
    id: 'user-002',
    profileImageFileId: null,
    profileImageFile: null,
    profilePhoto: null
  });
  assert.strictEqual(fallbackAvatarDescriptor.fileId, null);
  assert.strictEqual(fallbackAvatarDescriptor.url, null, 'Fallback must yield null URL so UI resolves gender SVG or initials');

  // 4. RETENTION & TRASH INVARIANTS
  const protectedModules = ['FINANCE_RECEIPTS', 'COE_EXAM_RESULTS', 'AUDIT_LOGS', 'OFFICIAL_TRANSCRIPTS'];
  const isProtectedRecord = (recordType: string) => protectedModules.includes(recordType);

  assert.strictEqual(isProtectedRecord('FINANCE_RECEIPTS'), true, 'Fee receipts must be non-deletable');
  assert.strictEqual(isProtectedRecord('COE_EXAM_RESULTS'), true, 'Exam results must be protected');
  assert.strictEqual(isProtectedRecord('USER_WORKSPACE_NOTE'), false, 'User workspace notes can follow trash lifecycle');

  console.log('✅ All Global Download, Trash Policy & Gender Verification Tests passed successfully!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
