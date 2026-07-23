"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStudentIDCardPDF = buildStudentIDCardPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const exceptions_1 = require("./exceptions");
/**
 * Draw a beautiful vector shield emblem as the college logo
 */
function drawCollegeLogo(doc, x, y, size, color) {
    doc.save();
    doc.moveTo(x + size / 2, y)
        .lineTo(x + size, y + size * 0.25)
        .lineTo(x + size, y + size * 0.65)
        .quadraticCurveTo(x + size, y + size, x + size / 2, y + size)
        .quadraticCurveTo(x, y + size, x, y + size * 0.65)
        .lineTo(x, y + size * 0.25)
        .closePath()
        .fill(color);
    // Draw a white 'G' inside the shield
    doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(size * 0.55)
        .text('G', x + size * 0.25, y + size * 0.18, { lineBreak: false });
    doc.restore();
}
/**
 * Draw a realistic principal signature using bezier curves
 */
function drawPrincipalSignature(doc, x, y) {
    doc.save();
    doc.strokeColor('#1e40af') // blue ink
        .lineWidth(0.8)
        .moveTo(x, y + 6)
        .bezierCurveTo(x + 8, y - 5, x + 15, y + 12, x + 24, y + 2)
        .bezierCurveTo(x + 28, y - 2, x + 32, y + 10, x + 40, y + 4)
        .stroke();
    doc.restore();
}
/**
 * Draw alternating black and white vertical bars for a clean barcode effect
 */
function drawBarcode(doc, x, y, height) {
    doc.save();
    const pattern = [1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2];
    let currentX = x;
    pattern.forEach((w, index) => {
        const isBlack = index % 2 === 0;
        if (isBlack) {
            doc.rect(currentX, y, w, height).fill('#000000');
        }
        currentX += w;
    });
    doc.restore();
}
/**
 * Build a two-page CR80 size PDF card (Front & Back)
 */
async function buildStudentIDCardPDF(data) {
    const { student, settings, registerNo, rollNo, validUntil } = data;
    const brandColor = settings.BRAND_COLOR || '#4f46e5';
    // 1. Resolve student photo
    let photoBuffer = null;
    if (student.user?.profilePhoto) {
        try {
            const rawPath = student.user.profilePhoto;
            if (rawPath.startsWith('data:image')) {
                const base64Data = rawPath.split(';base64,').pop();
                if (base64Data) {
                    photoBuffer = Buffer.from(base64Data, 'base64');
                }
            }
            else {
                // Resolve local path relative to server root
                const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
                const localPath = path_1.default.join(process.cwd(), cleanPath);
                if (fs_1.default.existsSync(localPath)) {
                    photoBuffer = fs_1.default.readFileSync(localPath);
                }
            }
        }
        catch (err) {
            console.error('Failed to parse profile photo:', err);
        }
    }
    // Force photo upload validation
    if (!photoBuffer) {
        throw new exceptions_1.BadRequestException('Student profile photo is missing. Please upload a profile photo from Settings before downloading.');
    }
    // 2. Generate QR Code
    let qrBuffer;
    try {
        const verificationUrl = `${settings.COLLEGE_WEBSITE || 'https://geetorus.com'}/verify/student/${student.id}`;
        const qrPayload = JSON.stringify({
            studentId: student.id,
            registerNo,
            admissionNo: student.admissionNo,
            collegeId: 'GEETORUS-CAMPUS',
            verificationUrl
        });
        qrBuffer = await qrcode_1.default.toBuffer(qrPayload, {
            type: 'png',
            margin: 1,
            width: 120
        });
    }
    catch (err) {
        throw new exceptions_1.BadRequestException('Dynamic QR Code generation failed.');
    }
    // Resolve principal signature
    let signatureBuffer = null;
    if (settings.PRINCIPAL_SIGNATURE) {
        try {
            const rawPath = settings.PRINCIPAL_SIGNATURE;
            if (rawPath.startsWith('data:image')) {
                const base64Data = rawPath.split(';base64,').pop();
                if (base64Data) {
                    signatureBuffer = Buffer.from(base64Data, 'base64');
                }
            }
            else {
                const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
                const localPath = path_1.default.join(process.cwd(), cleanPath);
                if (fs_1.default.existsSync(localPath)) {
                    signatureBuffer = fs_1.default.readFileSync(localPath);
                }
            }
        }
        catch (err) {
            console.error('Failed to parse principal signature:', err);
        }
    }
    // 3. Initialize PDFKit document
    // CR80 standard card size is 85.6mm x 53.98mm, which is 242.6 x 153.0 points.
    const doc = new pdfkit_1.default({
        size: [153.0, 242.6],
        margins: { top: 0, left: 0, bottom: 0, right: 0 }
    });
    // ==========================================
    // PAGE 1: FRONT SIDE
    // ==========================================
    // A. Top Header Band
    doc.rect(0, 0, 153.0, 38).fill(brandColor);
    // College Logo (Shield Emblem)
    drawCollegeLogo(doc, 6, 6, 12, '#ffffff');
    // College Name & Card Subtitle
    doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(4.5)
        .text((settings.COLLEGE_NAME || 'GEETORUS CAMPUS').toUpperCase(), 22, 9, { width: 125, align: 'left' });
    doc.font('Helvetica')
        .fontSize(3.5)
        .fillColor('#e0e7ff')
        .text('OFFICIAL DIGITAL IDENTITY CARD', 22, 16);
    // B. Card Body White Area
    doc.rect(0, 38, 153.0, 204.6).fill('#ffffff');
    // Student Photo (Circle Clip & Draw)
    doc.save();
    const photoX = 52.5; // (153 - 48) / 2
    const photoY = 46.0;
    const photoSize = 48.0;
    // Draw white background circle for photo border
    doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 2)
        .fill('#e2e8f0');
    // Clip to circle and draw photo
    doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2)
        .clip();
    doc.image(photoBuffer, photoX, photoY, { width: photoSize, height: photoSize });
    doc.restore();
    // Student Name
    doc.fillColor('#1e293b')
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text(`${student.firstName} ${student.lastName}`.toUpperCase(), 10, 102, { width: 133, align: 'center' });
    // Student Role Badge
    doc.roundedRect(51.5, 114, 50, 8, 2).fill('#f1f5f9');
    doc.fillColor(brandColor)
        .font('Helvetica-Bold')
        .fontSize(4)
        .text('STUDENT', 51.5, 116, { width: 50, align: 'center' });
    // Academic Info Fields Grid
    const gridY = 129;
    const col1X = 14;
    const col2X = 58;
    const rowH = 9.5;
    const fields = [
        { label: 'Admission No', val: student.admissionNo },
        { label: 'Register No', val: registerNo },
        { label: 'Roll Number', val: rollNo },
        { label: 'Program / Dept', val: `${student.program.code} / ${student.department.code}` },
        { label: 'Semester / Sec', val: `${student.semester.name} / ${student.section.name}` },
        { label: 'Blood Group', val: student.bloodGroup || 'N/A' },
    ];
    fields.forEach((f, idx) => {
        const curY = gridY + idx * rowH;
        // Label
        doc.fillColor('#64748b')
            .font('Helvetica-Bold')
            .fontSize(4.2)
            .text(f.label, col1X, curY);
        // Separator :
        doc.text(':', col2X - 6, curY);
        // Value
        doc.fillColor('#1e293b')
            .font('Helvetica')
            .fontSize(4.2)
            .text(f.val, col2X, curY, { width: 85, align: 'left' });
    });
    // Barcode & Principal Signature Line
    drawBarcode(doc, 14, 192, 10);
    doc.fillColor('#64748b')
        .font('Helvetica')
        .fontSize(3.5)
        .text(student.admissionNo, 14, 204);
    // Principal Signature
    if (signatureBuffer) {
        try {
            doc.image(signatureBuffer, 95, 186, { width: 50, height: 16, fit: [50, 16] });
        }
        catch (e) {
            console.error('Failed to draw signature image in PDF:', e);
            doc.fillColor('#dc2626')
                .font('Helvetica-Bold')
                .fontSize(3.5)
                .text('Signature Load Failed', 90, 196, { width: 60, align: 'center' });
        }
    }
    else {
        doc.fillColor('#64748b')
            .font('Helvetica-Bold')
            .fontSize(3.5)
            .text('Principal Signature Not Configured', 90, 196, { width: 60, align: 'center' });
    }
    doc.fillColor('#64748b')
        .font('Helvetica-Bold')
        .fontSize(4)
        .text('PRINCIPAL', 100, 204, { width: 40, align: 'center' });
    // C. Bottom Color Accent Strip
    doc.rect(0, 239.6, 153.0, 3).fill(brandColor);
    // ==========================================
    // PAGE 2: BACK SIDE
    // ==========================================
    doc.addPage({
        size: [153.0, 242.6],
        margins: { top: 0, left: 0, bottom: 0, right: 0 }
    });
    // A. Back Header Band
    doc.rect(0, 0, 153.0, 24).fill(brandColor);
    doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(5)
        .text('EMERGENCY INFORMATION & ADDRESS', 10, 9, { width: 133, align: 'center' });
    // B. Card Body White Area
    doc.rect(0, 24, 153.0, 218.6).fill('#ffffff');
    // Contact Details
    const contactY = 36;
    const contactRowH = 9.5;
    const backFields = [
        { label: 'Parent / Guardian', val: student.parentName },
        { label: 'Emergency Phone', val: student.parentPhone },
        { label: 'College Address', val: settings.COLLEGE_ADDRESS || '123 Education Boulevard, Campus City, 600001' },
        { label: 'College Phone', val: settings.COLLEGE_PHONE || '+91 98765 43210' },
        { label: 'College Website', val: settings.COLLEGE_WEBSITE || 'https://geetorus.com' },
        { label: 'Valid Until', val: validUntil },
    ];
    backFields.forEach((f, idx) => {
        const curY = contactY + idx * contactRowH;
        // Label
        doc.fillColor('#64748b')
            .font('Helvetica-Bold')
            .fontSize(4.2)
            .text(f.label, col1X, curY);
        // Separator :
        doc.text(':', col2X - 6, curY);
        // Value
        doc.fillColor('#1e293b')
            .font('Helvetica')
            .fontSize(4.2)
            .text(f.val, col2X, curY, { width: 85, align: 'left' });
    });
    // C. Terms / Instructions Box
    const instY = 100;
    doc.roundedRect(14, instY, 125, 48, 3).fill('#f8fafc');
    doc.rect(14, instY, 125, 48).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
    doc.fillColor('#475569')
        .font('Helvetica-Bold')
        .fontSize(4.5)
        .text('IMPORTANT INSTRUCTIONS:', 18, instY + 5);
    const instructions = [
        '1. This card is non-transferable and remains college property.',
        '2. Must be worn and visible at all times on campus premises.',
        '3. Loss must be reported immediately to the Registrar office.',
        '4. If found, please return to the administration department.',
    ];
    instructions.forEach((inst, idx) => {
        doc.font('Helvetica')
            .fontSize(3.8)
            .text(inst, 18, instY + 14 + idx * 7.5, { width: 117, lineGap: 1 });
    });
    // D. QR Code Verification Center
    const qrX = 56.5; // (153 - 40) / 2
    const qrY = 160;
    const qrSize = 40.0;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc.fillColor('#64748b')
        .font('Helvetica-Bold')
        .fontSize(4)
        .text('SCAN TO VERIFY CARD SECURITY', 10, 206, { width: 133, align: 'center' });
    // E. Bottom Color Accent Strip
    doc.rect(0, 239.6, 153.0, 3).fill(brandColor);
    return doc;
}
//# sourceMappingURL=idcard.pdf.js.map