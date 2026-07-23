"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAttendanceReportPdf = generateAttendanceReportPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Draw college shield logo
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
    // Draw 'G'
    doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(size * 0.55)
        .text('G', x + size * 0.25, y + size * 0.18, { lineBreak: false });
    doc.restore();
}
async function generateAttendanceReportPdf(data) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));
        const { student, attendanceRecords, settings, registerNo, rollNo } = data;
        // College Info from settings
        const collegeName = settings['college_name'] || 'GEETORUS CAMPUS COLLEGE';
        const collegeAddress = settings['college_address'] || '456 Innovation Road, Tech Park, City';
        const collegeEmail = settings['college_email'] || 'info@geetorus.edu';
        // ----------------------------------------------------
        // HEADER: Branding & Banner
        // ----------------------------------------------------
        // Top primary background header strip
        doc.rect(40, 40, 515, 75).fill('#0f172a'); // Slate-900
        // College Shield Logo
        drawCollegeLogo(doc, 55, 50, 45, '#6366f1');
        // Title Texts
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(collegeName.toUpperCase(), 115, 55);
        doc.fillColor('#94a3b8')
            .font('Helvetica')
            .fontSize(8)
            .text(collegeAddress, 115, 75)
            .text(`Email: ${collegeEmail}  |  ERP Portal: GEETORUS CAMPUSOS`, 115, 87);
        // ----------------------------------------------------
        // SECTION: Student Profile
        // ----------------------------------------------------
        let currentY = 135;
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('STUDENT BIO-DATA SUMMARY', 40, currentY);
        // Horizontal line separator
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 22;
        let photoInserted = false;
        if (student.user?.profilePhoto) {
            const cleanPath = student.user.profilePhoto.startsWith('/') ? student.user.profilePhoto.slice(1) : student.user.profilePhoto;
            const physicalPath = path_1.default.join(process.cwd(), cleanPath);
            if (fs_1.default.existsSync(physicalPath)) {
                try {
                    doc.image(physicalPath, 40, currentY, { width: 70, height: 75 });
                    photoInserted = true;
                }
                catch (e) {
                    console.error('Failed to embed profile photo in PDF:', e);
                }
            }
        }
        // If no photo inserted, draw a placeholder grey avatar box
        if (!photoInserted) {
            doc.save()
                .rect(40, currentY, 70, 75)
                .fillAndStroke('#f1f5f9', '#cbd5e1');
            doc.fillColor('#94a3b8')
                .font('Helvetica-Bold')
                .fontSize(18)
                .text(`${student.firstName[0]}${student.lastName[0]}`.toUpperCase(), 58, currentY + 28);
            doc.restore();
        }
        // Bio Details (draw in two columns next to avatar)
        const textStartCol1 = 130;
        const textStartCol2 = 350;
        doc.fillColor('#475569').font('Helvetica').fontSize(8.5);
        // Row 1
        doc.text('Full Name:', textStartCol1, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(`${student.firstName} ${student.lastName}`, textStartCol1 + 75, currentY)
            .fillColor('#475569').font('Helvetica').text('Admission No:', textStartCol2, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(student.admissionNo, textStartCol2 + 85, currentY);
        currentY += 16;
        doc.fillColor('#475569').font('Helvetica');
        // Row 2
        doc.text('Register No:', textStartCol1, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(registerNo, textStartCol1 + 75, currentY)
            .fillColor('#475569').font('Helvetica').text('Roll Number:', textStartCol2, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(rollNo, textStartCol2 + 85, currentY);
        currentY += 16;
        doc.fillColor('#475569').font('Helvetica');
        // Row 3
        doc.text('Department:', textStartCol1, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(student.department?.name || 'N/A', textStartCol1 + 75, currentY)
            .fillColor('#475569').font('Helvetica').text('Program / Level:', textStartCol2, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(`${student.program?.name || 'N/A'} (${student.program?.code || ''})`, textStartCol2 + 85, currentY);
        currentY += 16;
        doc.fillColor('#475569').font('Helvetica');
        // Row 4
        doc.text('Term Placement:', textStartCol1, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(`Semester ${student.semester?.number || 'N/A'} / Section ${student.section?.name || 'A'}`, textStartCol1 + 75, currentY)
            .fillColor('#475569').font('Helvetica').text('Academic Term:', textStartCol2, currentY)
            .fillColor('#0f172a').font('Helvetica-Bold').text(student.academicYear?.name || 'N/A', textStartCol2 + 85, currentY);
        currentY = Math.max(currentY + 30, 235);
        // ----------------------------------------------------
        // STATISTICS CALCULATION
        // ----------------------------------------------------
        const totalWorking = attendanceRecords.length;
        const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        const leave = attendanceRecords.filter(r => r.status === 'LEAVE').length;
        const od = attendanceRecords.filter(r => r.status === 'OD' || r.status === 'ON_DUTY').length;
        const overallPercent = totalWorking > 0 ? Math.round(((present + od) / totalWorking) * 100) : 100;
        // ----------------------------------------------------
        // SECTION: Attendance Summary Cards
        // ----------------------------------------------------
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('ATTENDANCE METRICS SUMMARY', 40, currentY);
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 20;
        // Grid of cards
        const cardWidth = 80;
        const cardGap = 7;
        let cardX = 40;
        const summaryCards = [
            { title: 'WORKING DAYS', val: totalWorking, color: '#f8fafc', textCol: '#0f172a' },
            { title: 'PRESENT', val: present, color: '#f0fdf4', textCol: '#16a34a' },
            { title: 'ABSENT', val: absent, color: '#fef2f2', textCol: '#dc2626' },
            { title: 'LATE', val: leave, color: '#fffbeb', textCol: '#d97706' },
            { title: 'ON DUTY (OD)', val: od, color: '#eff6ff', textCol: '#2563eb' },
            { title: 'OVERALL RATE', val: `${overallPercent}%`, color: overallPercent >= 75 ? '#ecfdf5' : '#fff1f2', textCol: overallPercent >= 75 ? '#059669' : '#e11d48' }
        ];
        summaryCards.forEach((c) => {
            doc.save()
                .rect(cardX, currentY, cardWidth, 45)
                .fillAndStroke(c.color, '#e2e8f0');
            doc.fillColor('#64748b')
                .font('Helvetica-Bold')
                .fontSize(6.5)
                .text(c.title, cardX + 5, currentY + 8, { width: cardWidth - 10, align: 'center' });
            doc.fillColor(c.textCol)
                .font('Helvetica-Bold')
                .fontSize(13)
                .text(String(c.val), cardX + 5, currentY + 23, { width: cardWidth - 10, align: 'center' });
            doc.restore();
            cardX += cardWidth + cardGap;
        });
        currentY += 60;
        // ----------------------------------------------------
        // SECTION: Subject-wise Attendance Table
        // ----------------------------------------------------
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('SUBJECT-WISE ATTENDANCE REGISTRY', 40, currentY);
        doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 20;
        // Table Header
        doc.save().rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
        doc.text('CODE', 45, currentY + 6)
            .text('SUBJECT NAME', 100, currentY + 6)
            .text('FACULTY COORDINATOR', 240, currentY + 6)
            .text('CLASSES', 370, currentY + 6)
            .text('PRESENT', 415, currentY + 6)
            .text('ABSENT', 465, currentY + 6)
            .text('RATE %', 510, currentY + 6);
        doc.restore();
        currentY += 20;
        // Calculate subject-wise metrics
        const subjectsMap = {};
        attendanceRecords.forEach((r) => {
            if (r.subject) {
                if (!subjectsMap[r.subject.id]) {
                    subjectsMap[r.subject.id] = {
                        id: r.subject.id,
                        code: r.subject.code,
                        name: r.subject.name,
                        faculty: r.faculty ? `${r.faculty.firstName} ${r.faculty.lastName}` : 'N/A',
                        total: 0,
                        present: 0,
                        absent: 0
                    };
                }
                subjectsMap[r.subject.id].total++;
                if (r.status === 'PRESENT' || r.status === 'OD' || r.status === 'ON_DUTY') {
                    subjectsMap[r.subject.id].present++;
                }
                else if (r.status === 'ABSENT') {
                    subjectsMap[r.subject.id].absent++;
                }
            }
        });
        Object.values(subjectsMap).forEach((s, idx) => {
            const sPercent = s.total > 0 ? Math.round((s.present / s.total) * 100) : 100;
            // Zebra striping
            if (idx % 2 === 1) {
                doc.save().rect(40, currentY, 515, 20).fill('#f8fafc');
            }
            doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(7.5);
            doc.text(s.code, 45, currentY + 6);
            doc.font('Helvetica').text(s.name, 100, currentY + 6, { width: 130, height: 12, ellipsis: true });
            doc.text(s.faculty, 240, currentY + 6, { width: 120, height: 12, ellipsis: true });
            doc.text(String(s.total), 370, currentY + 6, { align: 'center', width: 35 });
            doc.text(String(s.present), 415, currentY + 6, { align: 'center', width: 40 });
            doc.text(String(s.absent), 465, currentY + 6, { align: 'center', width: 35 });
            // Color percentage red if low
            doc.fillColor(sPercent < 75 ? '#dc2626' : '#16a34a')
                .font('Helvetica-Bold')
                .text(`${sPercent}%`, 510, currentY + 6);
            currentY += 20;
        });
        currentY += 15;
        // ----------------------------------------------------
        // SECTION: Monthly Breakdown Table
        // ----------------------------------------------------
        doc.fillColor('#0f172a')
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('MONTHLY RECORD LEDGER', 40, currentY);
        doc.strokeColor('#e2e8f0').moveTo(40, currentY + 12).lineTo(555, currentY + 12).stroke();
        currentY += 20;
        // Table Header
        doc.save().rect(40, currentY, 515, 18).fill('#f1f5f9');
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(7.5);
        doc.text('MONTH', 50, currentY + 5)
            .text('WORKING DAYS', 180, currentY + 5)
            .text('PRESENT', 280, currentY + 5)
            .text('ABSENT', 380, currentY + 5)
            .text('MONTHLY RATE %', 470, currentY + 5);
        doc.restore();
        currentY += 18;
        // Calculate monthly metrics
        const monthsMap = {};
        attendanceRecords.forEach((r) => {
            const dateObj = new Date(r.date);
            const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const mName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!monthsMap[mKey]) {
                monthsMap[mKey] = { name: mName, total: 0, present: 0, absent: 0 };
            }
            monthsMap[mKey].total++;
            if (r.status === 'PRESENT' || r.status === 'OD' || r.status === 'ON_DUTY') {
                monthsMap[mKey].present++;
            }
            else if (r.status === 'ABSENT') {
                monthsMap[mKey].absent++;
            }
        });
        Object.values(monthsMap).forEach((m, idx) => {
            const mPercent = m.total > 0 ? Math.round((m.present / m.total) * 100) : 100;
            if (idx % 2 === 1) {
                doc.save().rect(40, currentY, 515, 18).fill('#f8fafc');
            }
            doc.fillColor('#334155').font('Helvetica').fontSize(7.5);
            doc.text(m.name, 50, currentY + 5);
            doc.text(String(m.total), 180, currentY + 5);
            doc.text(String(m.present), 280, currentY + 5);
            doc.text(String(m.absent), 380, currentY + 5);
            doc.fillColor(mPercent < 75 ? '#dc2626' : '#059669')
                .font('Helvetica-Bold')
                .text(`${mPercent}%`, 470, currentY + 5);
            currentY += 18;
        });
        currentY += 20;
        // ----------------------------------------------------
        // REMARKS & SYSTEM FOOTER
        // ----------------------------------------------------
        // Box for eligibility remarks
        doc.save()
            .rect(40, currentY, 515, 40)
            .fillAndStroke(overallPercent >= 75 ? '#ecfdf5' : '#fff1f2', overallPercent >= 75 ? '#10b981' : '#f43f5e');
        doc.fillColor(overallPercent >= 75 ? '#065f46' : '#9f1239')
            .font('Helvetica-Bold')
            .fontSize(8.5)
            .text('EXAMINATION ELIGIBILITY REMARKS:', 50, currentY + 10)
            .font('Helvetica')
            .text(overallPercent >= 75
            ? `ELIGIBLE - Overall attendance is ${overallPercent}%, satisfying the minimum required threshold of 75%.`
            : `ALERT INELIGIBLE - Low attendance alert! Overall attendance is ${overallPercent}%, which falls below the mandatory 75% examination threshold. Please consult your Class Advisor Mrs. Ada Lovelace immediately.`, 50, currentY + 22);
        doc.restore();
        currentY += 60;
        // Signatures / Timestamp
        doc.fillColor('#64748b').font('Helvetica').fontSize(7.5);
        doc.text(`Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 40, currentY)
            .text(`Generated On: ${new Date().toLocaleString()}`, 40, currentY + 12)
            .text(`Generated By: ${student.firstName} ${student.lastName} (Student Portal Self-Service)`, 40, currentY + 24);
        doc.text('Signature of Controller of Examinations', 390, currentY + 24, { align: 'right', width: 165 });
        // Draw signature line
        doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(390, currentY + 18).lineTo(555, currentY + 18).stroke();
        doc.end();
    });
}
//# sourceMappingURL=attendance.pdf.js.map