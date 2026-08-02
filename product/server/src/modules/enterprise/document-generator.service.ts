import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma';
import { NotFoundException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';

export class DocumentGeneratorService {
  /**
   * Generate CR80 ID-1 Standard Digital ID Card PDF Buffer
   * Physical Ratio: 85.60mm x 53.98mm (242.6pt x 153pt @ 72DPI, scaled x2 -> 485pt x 306pt)
   */
  static async generateDigitalIdPdf(ownerType: 'STUDENT' | 'FACULTY', entity: any, verificationToken: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [243, 153], // Exact CR80 ID-1 standard dimensions in points
          margins: { top: 6, bottom: 6, left: 6, right: 6 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Generate Verification QR Code Buffer
        const qrUrl = `https://campusos.edu/verify/id-card/${verificationToken}`;
        const qrBuffer = await QRCode.toBuffer(qrUrl, { margin: 1, width: 42 });

        // Background card fill
        doc.rect(0, 0, 243, 153).fill('#0f172a'); // Dark Slate Theme
        doc.rect(0, 0, 243, 26).fill('#4f46e5');  // Indigo Top Header

        // Header Title
        doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text('AEC CAMPUSOS ERP', 8, 5, { align: 'center' });
        doc.fontSize(5).font('Helvetica').text('HIGHER EDUCATION ERP ERP PLATFORM', 8, 14, { align: 'center' });

        // Photo / Avatar Placeholder
        doc.rect(8, 34, 45, 55).fillAndStroke('#1e293b', '#6366f1');
        doc.fillColor('#94a3b8').fontSize(5).text(ownerType === 'STUDENT' ? 'PHOTO' : 'FACULTY', 8, 58, { width: 45, align: 'center' });

        // Student / Faculty Identity Details
        const name = `${entity.firstName || ''} ${entity.lastName || ''}`.toUpperCase();
        const idNo = entity.admissionNo || entity.registerNumber || entity.employeeId || 'STU-2026';
        const dept = entity.department?.code || 'CSE';
        const prog = entity.program?.code || entity.designation || 'B.Tech';

        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold').text(name.substring(0, 20), 58, 34);
        doc.fillColor('#818cf8').fontSize(6).font('Helvetica-Bold').text(`ID: ${idNo}`, 58, 45);
        doc.fillColor('#cbd5e1').fontSize(5).font('Helvetica').text(`DEPT: ${dept} | PROG: ${prog}`, 58, 54);
        if (entity.bloodGroup) {
          doc.fillColor('#f43f5e').fontSize(5).font('Helvetica-Bold').text(`BLOOD GROUP: ${entity.bloodGroup}`, 58, 62);
        }

        // Draw QR Code
        doc.image(qrBuffer, 192, 34, { width: 42, height: 42 });

        // Footer Divider Line
        doc.moveTo(8, 100).lineTo(235, 100).strokeColor('#334155').stroke();

        // Footer Principal Signature Asset & Expiry Notice
        doc.fillColor('#94a3b8').fontSize(4.5).font('Helvetica').text(`ISSUED: ${new Date().toLocaleDateString()}`, 8, 106);
        doc.fillColor('#94a3b8').fontSize(4.5).font('Helvetica').text('VALID THRU: 2028-06-30', 8, 114);

        // Principal Signature Text Stamp
        doc.fillColor('#818cf8').fontSize(5).font('Helvetica-Bold').text('APPROVED SIGNATURE', 160, 106, { align: 'right' });
        doc.fillColor('#64748b').fontSize(4).font('Helvetica').text('PRINCIPAL / ISSUING AUTHORITY', 160, 114, { align: 'right' });

        doc.end();
      } catch (err) {
        logger.error('Failed to generate Digital ID PDF:', err);
        reject(err);
      }
    });
  }

  /**
   * Generate Live Excel Workbooks (.xlsx) using ExcelJS
   */
  static async generateExcelWorkbook(sheetName: string, columns: Array<{ header: string; key: string; width?: number }>, data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AEC CampusOS ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
    });

    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F46E5' }, // Indigo Header
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add rows
    data.forEach((item) => {
      sheet.addRow(item);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generate Live UTF-8 Encoded CSV File Buffer
   */
  static generateCsvBuffer(headers: string[], rows: any[][]): Buffer {
    const lines = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',')];

    rows.forEach((row) => {
      const line = row.map((cell) => {
        const val = cell !== null && cell !== undefined ? String(cell) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',');
      lines.push(line);
    });

    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
