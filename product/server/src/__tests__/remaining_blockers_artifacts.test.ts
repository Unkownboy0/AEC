import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import { CertificateController } from '../modules/enterprise/certificate.controller';
import { generateHallTicketPdfBuffer } from '../utils/hall-ticket.pdf';

function savePdf(name: string, buffer: Buffer) {
  if (!process.env.PDF_QA_DIR) return;
  fs.mkdirSync(process.env.PDF_QA_DIR, { recursive: true });
  fs.writeFileSync(path.join(process.env.PDF_QA_DIR, name), buffer);
}

async function downloadCertificate(hash: string, user: any): Promise<{ body?: Buffer; error?: any }> {
  const result: { body?: Buffer; error?: any } = {};
  const response: any = { setHeader() { return response; }, status() { return response; }, send(body: Buffer) { result.body = body; return response; } };
  await new CertificateController().download({ params: { hash }, user } as any, response, (error: any) => { result.error = error; });
  return result;
}

async function run() {
  const routes = fs.readFileSync(path.resolve(__dirname, '../modules/coe/coe.routes.ts'), 'utf8');
  assert.match(routes, /student\/hall-ticket\.pdf', requireRole\(\['Student'\]\)/);
  assert.match(routes, /students\/:studentId\/hall-ticket\.pdf', coeOnly/);
  assert.match(routes, /hall-tickets', coeOnly, controller\.searchHallTickets/, 'COE search must retain the COE role boundary');
  const service = fs.readFileSync(path.resolve(__dirname, '../modules/coe/coe.service.ts'), 'utf8');
  assert.match(service, /status: 'PUBLISHED', publishedAt: \{ not: null \}/);
  assert.match(service, /examSeatAllocation\.findMany[\s\S]+status: 'PUBLISHED'/);
  assert.match(service, /searchHallTickets[\s\S]+take: 500/, 'COE search must be server scoped and bounded');
  assert.match(service, /searchHallTickets[\s\S]+status: 'PUBLISHED'[\s\S]+publishedAt: \{ not: null \}/, 'COE search must exclude unpublished hall tickets');

  const hallTicket = await generateHallTicketPdfBuffer({
    institutionName: 'GEETORUS INSTITUTE OF TECHNOLOGY', studentName: 'Runtime Fixture Student', registerNumber: '26CSE001',
    programme: 'B.E. Computer Science and Engineering', department: 'Computer Science and Engineering', semester: 'Semester 5',
    examName: 'November 2026 End Semester Examination', examType: 'END_SEMESTER',
    subjects: [
      { code: 'CS501', name: 'Distributed Systems', examDate: '2026-11-10', startTime: '09:30', endTime: '12:30', session: 'FORENOON', room: 'Main Block - A201', seatNumber: '014' },
      { code: 'CS502', name: 'Cloud Computing', examDate: '2026-11-13', startTime: '13:30', endTime: '16:30', session: 'AFTERNOON', room: 'Main Block - A201', seatNumber: '014' },
    ],
  });
  assert(hallTicket.length > 2500 && hallTicket.slice(0, 5).toString() === '%PDF-');
  savePdf('hall-ticket-fixture.pdf', hallTicket);

  const students = await prisma.student.findMany({ where: { deleted: false, status: 'ACTIVE', userId: { not: null } }, include: { user: true }, orderBy: { admissionNo: 'asc' }, take: 2 });
  assert(students.length >= 2, 'Certificate fixture requires two seeded active students');
  const owner = students[0], unrelated = students[1];
  const hashes = ['QA-BONAFIDE-DETERMINISTIC', 'QA-CONDUCT-DETERMINISTIC'];
  await (prisma as any).certificateRequest.deleteMany({ where: { verificationHash: { in: hashes } } });
  try {
    for (const [index, type] of ['BONAFIDE', 'CONDUCT'].entries()) {
      const hash = hashes[index];
      await (prisma as any).certificateRequest.create({ data: { studentId: owner.id, type, purpose: 'Automated release-gate verification', status: 'ISSUED', verificationHash: hash, issuedUrl: `/api/enterprise/certificates/download/${hash}` } });
      const allowed = await downloadCertificate(hash, { id: owner.userId, role: 'Student' });
      assert.ifError(allowed.error);
      assert(allowed.body && allowed.body.length > 2500 && allowed.body.slice(0, 5).toString() === '%PDF-');
      savePdf(`${type.toLowerCase()}-certificate-fixture.pdf`, allowed.body!);
      const denied = await downloadCertificate(hash, { id: unrelated.userId, role: 'Student' });
      assert(denied.error && denied.error.status === 403, `Unrelated student must be denied ${type}`);
      assert(!denied.body);
    }
  } finally { await (prisma as any).certificateRequest.deleteMany({ where: { verificationHash: { in: hashes } } }); }
  console.log('PASS remaining blocker artifact generation and authorization');
}

run().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
