import PDFDocument from 'pdfkit';
import fs from 'fs';
import { PdfWatermarkService } from '../services/pdf-watermark.service';

export interface HallTicketSubject {
  code: string;
  name: string;
  examDate: Date | string;
  startTime: string;
  endTime: string;
  session: string;
  room?: string | null;
  seatNumber?: string | null;
  instructions?: string | null;
}

export interface HallTicketPdfInput {
  institutionName: string;
  studentName: string;
  registerNumber: string;
  programme: string;
  department: string;
  semester: string;
  examName: string;
  examType?: string | null;
  studentPhotoPath?: string | null;
  subjects: HallTicketSubject[];
}

const displayDate = (value: Date | string) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

export async function generateHallTicketPdfBuffer(input: HallTicketPdfInput): Promise<Buffer> {
  if (!input.subjects.length) throw new Error('A hall ticket requires at least one published subject allocation');
  const doc = new PDFDocument({ size: 'A4', margin: 38, info: { Title: `Hall Ticket - ${input.studentName}`, Author: input.institutionName } });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  PdfWatermarkService.applyWatermark(doc, { opacity: 0.035, scale: 0.46 });

  const logo = PdfWatermarkService.getLogoPath();
  if (logo) doc.image(logo, 42, 36, { fit: [60, 60], align: 'center', valign: 'center' });
  doc.font('Helvetica-Bold').fillColor('#172554').fontSize(17).text(input.institutionName.toUpperCase(), 112, 43, { width: 430, align: 'center' });
  doc.font('Helvetica').fillColor('#475569').fontSize(9).text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', 112, 69, { width: 430, align: 'center' });
  doc.moveTo(38, 104).lineTo(557, 104).lineWidth(1.5).strokeColor('#1d4ed8').stroke();
  doc.font('Helvetica-Bold').fillColor('#1e3a8a').fontSize(16).text('HALL TICKET', 38, 118, { width: 519, align: 'center' });
  doc.fontSize(10).fillColor('#334155').text(`${input.examName}${input.examType ? ` - ${input.examType}` : ''}`, 38, 141, { width: 519, align: 'center' });

  if (input.studentPhotoPath && fs.existsSync(input.studentPhotoPath)) {
    try { doc.image(input.studentPhotoPath, 457, 168, { fit: [82, 98], align: 'center', valign: 'center' }); } catch { /* malformed legacy image: omit safely */ }
  }
  doc.rect(457, 168, 82, 98).lineWidth(0.7).strokeColor('#94a3b8').stroke();
  const rows: Array<[string, string]> = [
    ['Student name', input.studentName], ['Register number', input.registerNumber],
    ['Programme', input.programme], ['Department', input.department], ['Semester', input.semester],
  ];
  let y = 171;
  for (const [label, value] of rows) {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#64748b').text(label.toUpperCase(), 48, y, { width: 105 });
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(value || 'Not available', 158, y - 1, { width: 282, ellipsis: true });
    y += 20;
  }

  y = 290;
  const columns = [
    { x: 38, w: 64, label: 'DATE' }, { x: 102, w: 62, label: 'SESSION' },
    { x: 164, w: 72, label: 'CODE' }, { x: 236, w: 145, label: 'SUBJECT' },
    { x: 381, w: 100, label: 'TIME' }, { x: 481, w: 76, label: 'ROOM / SEAT' },
  ];
  doc.rect(38, y, 519, 25).fill('#1e3a8a');
  columns.forEach((col) => doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff').text(col.label, col.x + 4, y + 9, { width: col.w - 8, align: 'center' }));
  y += 25;
  for (const subject of input.subjects) {
    if (y > 690) { doc.addPage(); y = 48; }
    const height = 42;
    doc.rect(38, y, 519, height).fillAndStroke('#ffffff', '#cbd5e1');
    const values = [displayDate(subject.examDate), subject.session, subject.code, subject.name, `${subject.startTime}-${subject.endTime}`, [subject.room, subject.seatNumber ? `Seat ${subject.seatNumber}` : null].filter(Boolean).join('\n')];
    columns.forEach((col, index) => doc.font(index === 2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.7).fillColor('#0f172a').text(values[index] || '-', col.x + 4, y + 8, { width: col.w - 8, height: height - 10, align: index === 3 ? 'left' : 'center', ellipsis: true }));
    y += height;
  }

  const instructionY = Math.max(y + 20, 570);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e3a8a').text('CANDIDATE INSTRUCTIONS', 48, instructionY);
  const instructions = Array.from(new Set(input.subjects.map((item) => item.instructions).filter(Boolean)));
  const defaultInstructions = ['Report at least 30 minutes before the examination.', 'Carry this hall ticket and the institutional identity card.', 'Electronic devices and unauthorized materials are prohibited.', 'Follow the invigilator and examination regulations at all times.'];
  doc.font('Helvetica').fontSize(8.5).fillColor('#334155').list(instructions.length ? instructions : defaultInstructions, 58, instructionY + 18, { width: 475, bulletRadius: 1.5, textIndent: 8, lineGap: 3 });
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text('Candidate signature', 48, 742);
  doc.text('Controller of Examinations', 403, 742, { width: 145, align: 'right' });
  doc.moveTo(48, 737).lineTo(165, 737).strokeColor('#64748b').stroke();
  doc.moveTo(420, 737).lineTo(548, 737).stroke();
  doc.font('Helvetica').fontSize(7).fillColor('#64748b').text('Generated from published CampusOS examination and seat-allocation records.', 38, 787, { width: 519, align: 'center' });

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => {
      const output = Buffer.concat(chunks);
      if (output.length < 1000 || output.slice(0, 5).toString() !== '%PDF-') return reject(new Error('Generated hall ticket PDF is invalid'));
      resolve(output);
    });
    doc.on('error', reject);
    doc.end();
  });
}
