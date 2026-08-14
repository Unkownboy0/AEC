import PDFDocument from 'pdfkit';
import { PdfWatermarkService } from '../../services/pdf-watermark.service';

const money = (value: unknown) => `INR ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export function writeFeeReceipt(doc: PDFKit.PDFDocument, payment: any) {
  const student = payment.student;
  const bill = payment.bill;
  const college = process.env.COLLEGE_NAME || 'CampusOS College';
  const left = 52;
  const right = 543;

  // 1. Draw Institutional Background Watermark
  PdfWatermarkService.drawWatermarkOnCurrentPage(doc, { isReceipt: true });

  doc.rect(0, 0, 595.28, 116).fill('#111827');
  doc.fillColor('#8b5cf6').fontSize(13).font('Helvetica-Bold').text('CAMPUSOS', left, 34);
  doc.fillColor('#ffffff').fontSize(22).text(college, left, 55);
  doc.fillColor('#cbd5e1').fontSize(9).font('Helvetica').text('OFFICIAL FEE PAYMENT RECEIPT', left, 87);
  doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text(payment.receiptNumber, 350, 55, { width: 193, align: 'right' });
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('RECEIPT NUMBER', 350, 42, { width: 193, align: 'right' });

  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Student details', left, 150);
  doc.moveTo(left, 171).lineTo(right, 171).strokeColor('#e2e8f0').stroke();
  const row = (label: string, value: string, y: number, x = left, width = 230) => {
    doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label.toUpperCase(), x, y);
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(value || '—', x, y + 13, { width });
  };
  row('Student name', `${student.firstName} ${student.lastName}`.trim(), 188);
  row('Register number', student.admissionNo, 188, 313);
  row('Fee / invoice', `${bill.category.name} · ${bill.invoiceNumber || bill.id}`, 234);
  row('Academic year / semester', `${bill.academicYearLabel || '—'} · ${bill.semesterLabel || '—'}`, 234, 313);

  doc.roundedRect(left, 302, right - left, 92, 8).fill('#f8fafc');
  row('Amount paid', money(payment.amount), 322, 70, 150);
  row('Payment method', payment.method.replaceAll('_', ' '), 322, 230, 145);
  row('Transaction reference', payment.providerPaymentId || payment.externalReference || payment.transactionId, 322, 386, 140);

  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('Payment confirmation', left, 432);
  doc.moveTo(left, 453).lineTo(right, 453).strokeColor('#e2e8f0').stroke();
  row('Payment timestamp', new Date(payment.paymentDate || payment.verifiedAt || payment.createdAt).toLocaleString('en-IN'), 470);
  row('Status', 'VERIFIED / PAID', 470, 313);
  row('Internal transaction ID', payment.transactionId, 518, left, 440);

  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(
    'This computer-generated receipt confirms a payment verified by CampusOS. No signature is required.',
    left, 690, { width: right - left, align: 'center' },
  );
  doc.moveTo(left, 675).lineTo(right, 675).strokeColor('#e2e8f0').stroke();
}

export function createFeeReceipt(payment: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `Fee Receipt ${payment.receiptNumber}` } });
  writeFeeReceipt(doc, payment);
  return doc;
}
