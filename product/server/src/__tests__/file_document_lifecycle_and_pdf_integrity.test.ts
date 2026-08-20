import assert from 'assert';
import { generateStudentIDCardPdfBuffer } from '../utils/idcard.pdf';
import { generateFeeReceiptBuffer } from '../modules/fees/fee-receipt';
import { generateAttendanceReportPdf } from '../utils/attendance.pdf';
import { GovernedFileService } from '../modules/campus-workspace/governed-file.service';
import fs from 'fs';
import path from 'path';

function saveQaPdf(name: string, buffer: Buffer) {
  if (!process.env.PDF_QA_DIR) return;
  fs.mkdirSync(process.env.PDF_QA_DIR, { recursive: true });
  fs.writeFileSync(path.join(process.env.PDF_QA_DIR, name), buffer);
}

async function runTests() {
  console.log('🚀 Running File & Document Lifecycle + PDF Byte Integrity Test Suite...');

  const mockStudent = {
    id: 'test-student-1',
    admissionNo: '2026IT001',
    firstName: 'Suresh',
    lastName: 'Kumar',
    email: 'suresh.kumar@geetorus.edu',
    bloodGroup: 'O+',
    dateOfAdmission: new Date('2026-08-01'),
    department: { name: 'Information Technology', code: 'IT' },
    program: { name: 'B.Tech IT', duration: 4 },
    semester: { name: '5' },
    user: {
      id: 'test-user-student-1',
      profilePhoto: null,
      profileImage: null,
    },
  };

  const mockSettings = {
    COLLEGE_NAME: 'GEETORUS INSTITUTE OF TECHNOLOGY',
    COLLEGE_ADDRESS: '456 Innovation Road, Chennai',
    COLLEGE_PHONE: '+91 44 2345 6789',
    COLLEGE_EMAIL: 'info@geetorus.edu.in',
    COLLEGE_WEBSITE: 'https://geetorus.edu.in',
    BRAND_COLOR: '#4f46e5',
  };

  // ── 1. PDF Generation & Byte Integrity ──────────────────────────────────
  console.log('  Testing Student ID Card PDF buffer generation...');
  const idCardBuffer = await generateStudentIDCardPdfBuffer({
    student: mockStudent,
    settings: mockSettings,
    registerNo: '26IT001',
    rollNo: '26IT001',
    validUntil: '2026 - 2030',
  });

  assert(Buffer.isBuffer(idCardBuffer), 'Student ID card output must be a Buffer');
  assert(idCardBuffer.length > 1000, `Student ID card buffer too small: ${idCardBuffer.length} bytes`);
  assert.strictEqual(idCardBuffer.slice(0, 5).toString(), '%PDF-', 'Student ID card must start with %PDF-');
  saveQaPdf('student-id-fixture.pdf', idCardBuffer);
  console.log(`    ✅ Student ID Card PDF generated successfully (${idCardBuffer.length} bytes, signature verified)`);

  console.log('  Testing Fee Receipt PDF buffer generation...');
  const mockPayment = {
    id: 'pay-001',
    receiptNumber: 'REC-2026-0001',
    amount: 45000,
    method: 'ONLINE_NET_BANKING',
    transactionId: 'TXN-987654321',
    paymentDate: new Date(),
    student: mockStudent,
    bill: {
      id: 'bill-001',
      invoiceNumber: 'INV-2026-001',
      academicYearLabel: '2026-2027',
      semesterLabel: 'Semester 5',
      category: { name: 'Tuition Fee' },
    },
  };

  const feeReceiptBuffer = await generateFeeReceiptBuffer(mockPayment);
  assert(Buffer.isBuffer(feeReceiptBuffer), 'Fee receipt output must be a Buffer');
  assert(feeReceiptBuffer.length > 1000, `Fee receipt buffer too small: ${feeReceiptBuffer.length} bytes`);
  assert.strictEqual(feeReceiptBuffer.slice(0, 5).toString(), '%PDF-', 'Fee receipt must start with %PDF-');
  saveQaPdf('fee-receipt-fixture.pdf', feeReceiptBuffer);
  console.log(`    ✅ Fee Receipt PDF generated successfully (${feeReceiptBuffer.length} bytes, signature verified)`);

  console.log('  Testing Attendance Report PDF buffer generation...');
  const mockAttendance = [
    {
      id: 'att-1',
      date: new Date('2026-08-10'),
      status: 'PRESENT',
      subject: { name: 'Distributed Systems', code: 'CS501' },
      faculty: { firstName: 'Dr. Ramesh', lastName: 'V' },
    },
    {
      id: 'att-2',
      date: new Date('2026-08-11'),
      status: 'PRESENT',
      subject: { name: 'Cloud Computing', code: 'CS502' },
      faculty: { firstName: 'Dr. Priya', lastName: 'S' },
    },
  ];

  const attendanceBuffer = await generateAttendanceReportPdf({
    student: mockStudent,
    attendanceRecords: mockAttendance,
    settings: mockSettings,
    registerNo: '26IT001',
    rollNo: '26IT001',
  });

  assert(Buffer.isBuffer(attendanceBuffer), 'Attendance report output must be a Buffer');
  assert(attendanceBuffer.length > 1500, `Attendance report buffer too small: ${attendanceBuffer.length} bytes`);
  assert.strictEqual(attendanceBuffer.slice(0, 5).toString(), '%PDF-', 'Attendance report must start with %PDF-');
  saveQaPdf('attendance-fixture.pdf', attendanceBuffer);
  console.log(`    ✅ Attendance Report PDF generated successfully (${attendanceBuffer.length} bytes, signature verified)`);

  // ── 2. Drive Item Serialization & Trash Metadata ────────────────────────
  console.log('  Testing Drive Item Serialization & Trash Metadata...');
  const trashedDate = new Date('2026-08-19T10:00:00Z');
  const mockDriveItem = {
    id: 'item-101',
    name: 'Lecture_Notes.pdf',
    isFolder: false,
    parentId: null,
    fileId: 'file-101',
    mimeType: 'application/pdf',
    fileSize: 204800,
    ownerId: 'user-001',
    scope: 'PERSONAL',
    isStarred: true,
    isTrashed: true,
    trashedAt: trashedDate,
    createdAt: new Date('2026-08-18T10:00:00Z'),
    updatedAt: new Date('2026-08-19T10:00:00Z'),
    file: {
      mimeType: 'application/pdf',
      fileSize: 204800,
      checksum: 'abc123checksum',
    },
  };

  const clientItem = GovernedFileService.toClientDriveItem(mockDriveItem);
  assert.strictEqual(clientItem.id, 'item-101');
  assert.strictEqual(clientItem.isTrashed, true);
  assert.strictEqual(clientItem.trashedAt, trashedDate);
  assert.strictEqual(clientItem.downloadUrl, '/api/files/file-101/download?driveItemId=item-101');
  console.log('    ✅ Drive Item serialization correctly includes trashedAt and downloadUrl');

  console.log('\n🎉 ALL FILE/DOCUMENT LIFECYCLE & PDF TESTS PASSED WITH EXIT CODE 0!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
