import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { PdfWatermarkService } from '../../services/pdf-watermark.service';

export class CertificateController {
  /**
   * Apply for a new certificate (Bonafide, Conduct, Course Completion, etc.)
   */
  apply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { type, purpose } = req.body;

      if (!type || !purpose) {
        throw new BadRequestException('Certificate type and purpose are required');
      }

      const student = await prisma.student.findFirst({
        where: { userId: user.id }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      const hash = crypto.createHash('sha256').update(`${student.id}-${type}-${Date.now()}`).digest('hex').substring(0, 16);
      const verificationHash = `GIT-CERT-${hash.toUpperCase()}`;

      const certificate = await (prisma as any).certificateRequest.create({
        data: {
          studentId: student.id,
          type,
          purpose,
          status: 'ISSUED', // Auto-issue standard verified digital certificates
          verificationHash,
          issuedUrl: `/api/enterprise/certificates/download/${verificationHash}`,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://geetorus.edu.in/verify/${verificationHash}`
        }
      });

      res.status(201).json({
        status: 'success',
        data: certificate
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List certificate applications for the logged-in student
   */
  listMyCertificates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const student = await prisma.student.findFirst({
        where: { userId: user.id }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      const certificates = await (prisma as any).certificateRequest.findMany({
        where: { studentId: student.id },
        orderBy: { appliedAt: 'desc' }
      });

      res.status(200).json({
        status: 'success',
        data: certificates
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Public verification endpoint for QR code check
   */
  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hash } = req.params;
      const certificate = await (prisma as any).certificateRequest.findFirst({
        where: { verificationHash: hash }
      });

      if (!certificate) {
        throw new NotFoundException('Certificate verification record not found or revoked');
      }

      const student = await prisma.student.findUnique({
        where: { id: certificate.studentId },
        include: { department: true }
      });

      res.status(200).json({
        status: 'success',
        data: {
          certificate,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Enrolled Student',
          rollNo: (student as any)?.rollNo || (student as any)?.admissionNo,
          department: student?.department?.name || 'Engineering',
          verifiedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download official digital certificate with institutional background watermark
   */
  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hash } = req.params;
      const certificate = await (prisma as any).certificateRequest.findFirst({
        where: { verificationHash: hash },
      });

      if (!certificate) {
        throw new NotFoundException('Certificate record not found');
      }

      const student = await prisma.student.findUnique({
        where: { id: certificate.studentId },
        include: { department: true, program: true, semester: true, academicYear: true },
      });

      if (!student) {
        throw new NotFoundException('Student record not found');
      }

      const branding = await PdfWatermarkService.getBrandingSettings();
      const collegeName = branding.collegeName || 'CampusOS Institution';

      const certTitle = certificate.type.replace(/_/g, ' ');
      const filename = `${student.firstName}_${student.admissionNo}_${certificate.type}_Certificate.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `${certTitle} - ${student.firstName} ${student.lastName}`,
          Author: collegeName,
          Subject: `Official ${certTitle}`,
        },
      });

      // 1. Apply Central Institutional Watermark
      PdfWatermarkService.applyWatermark(doc, { scale: 0.5, opacity: 0.045 });

      doc.pipe(res);

      // Certificate Border
      doc.rect(20, 20, 555, 802).lineWidth(2).strokeColor('#4f46e5').stroke();
      doc.rect(25, 25, 545, 792).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // Top Institutional Header
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1e1b4b').text(collegeName.toUpperCase(), 40, 55, { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('Approved by AICTE | Affiliated to Anna University | Accredited by NAAC', 40, 78, { align: 'center' });
      doc.moveDown(0.5);

      // Gold Decorative Divider
      doc.moveTo(80, 96).lineTo(515, 96).lineWidth(1.5).strokeColor('#d97706').stroke();

      // Certificate Badge / Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#4338ca').text(certTitle.toUpperCase() + ' CERTIFICATE', 40, 125, { align: 'center' });
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text(`Ref. No: ${certificate.verificationHash}`, 40, 148, { align: 'center' });

      // Certificate Attestation Body
      const studentFullName = `${student.firstName} ${student.lastName}`.toUpperCase();
      const regNo = student.admissionNo || 'N/A';
      const deptName = student.department?.name || 'Engineering & Technology';
      const semName = student.semester?.name ? `Semester ${student.semester.name}` : 'Current Academic Term';
      const acadYear = student.academicYear?.name || '2026-2027';

      doc.moveDown(3);
      doc.fontSize(11).font('Helvetica').fillColor('#1e293b').lineGap(8);

      let attestationParagraph = '';
      if (certificate.type === 'BONAFIDE') {
        attestationParagraph = `This is to certify that Mr./Ms. ${studentFullName} (Register No: ${regNo}) is a bonafide student of ${collegeName}, studying in ${deptName}, ${semName} during the academic year ${acadYear}.\n\nThis certificate is issued on the student's request for the purpose of ${certificate.purpose || 'General Verification'}.`;
      } else if (certificate.type === 'CONDUCT') {
        attestationParagraph = `This is to certify that Mr./Ms. ${studentFullName} (Register No: ${regNo}) is a student of this institution in the department of ${deptName}. During the period of study, their conduct and character have been found to be GOOD.\n\nThis certificate is issued for the purpose of ${certificate.purpose || 'Official Records'}.`;
      } else {
        attestationParagraph = `This is to certify that Mr./Ms. ${studentFullName} (Register No: ${regNo}) is an enrolled student in ${deptName} at ${collegeName}.\n\nThis certificate is officially issued with institutional verification for ${certificate.purpose || 'Academic Requirement'}.`;
      }

      doc.text(attestationParagraph, 60, 200, { width: 475, align: 'justify', lineGap: 6 });

      // Verification Details Box
      doc.roundedRect(60, 360, 475, 75, 8).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155').text('DIGITAL VERIFICATION & AUTHENTICATION', 75, 375);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b')
        .text(`• Verification Hash: ${certificate.verificationHash}`, 75, 395)
        .text(`• Issued Date: ${new Date(certificate.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 75, 410)
        .text(`• Verification Portal: https://geetorus.edu.in/verify/${certificate.verificationHash}`, 75, 425);

      // Signatures
      const sigY = 620;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b');
      doc.text('Head of Department (HOD)', 60, sigY + 50);
      doc.text('Dean of Academic Affairs', 230, sigY + 50, { align: 'center', width: 140 });
      doc.text('Principal & Head of Institution', 375, sigY + 50, { align: 'right', width: 160 });

      // Signature line rules
      doc.strokeColor('#94a3b8').lineWidth(0.75)
        .moveTo(60, sigY + 45).lineTo(180, sigY + 45).stroke()
        .moveTo(230, sigY + 45).lineTo(370, sigY + 45).stroke()
        .moveTo(395, sigY + 45).lineTo(535, sigY + 45).stroke();

      // Footer
      doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8')
        .text('This is a digitally verified institutional document generated by CampusOS with cryptographic watermark and verification hash.', 40, 770, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      next(error);
    }
  };
}
