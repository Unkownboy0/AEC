import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';
import crypto from 'crypto';

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
          rollNo: student?.rollNumber,
          department: student?.department?.name || 'Engineering',
          verifiedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
