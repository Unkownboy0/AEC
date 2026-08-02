import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';
import { DocumentGeneratorService } from './document-generator.service';
import { logger } from '../../utils/logger';

export class DigitalIdService {
  /**
   * Issue & Download Live Student Digital ID PDF
   */
  static async getStudentDigitalId(userId: string, targetStudentId?: string): Promise<{ buffer: Buffer; filename: string }> {
    let studentId = targetStudentId;

    if (!studentId) {
      const student = await prisma.student.findFirst({ where: { userId } });
      if (!student) throw new NotFoundException('Student profile not found');
      studentId = student.id;
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        program: true,
        course: true,
        semester: true,
        section: true,
      },
    });

    if (!student) throw new NotFoundException('Student record not found');

    // Resolve or generate active DigitalIdCard record
    let card = await prisma.digitalIdCard.findFirst({
      where: { ownerId: student.id, ownerType: 'STUDENT', status: 'ACTIVE' },
    });

    if (!card) {
      const token = `IDV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 4); // 4-year card validity

      card = await prisma.digitalIdCard.create({
        data: {
          ownerType: 'STUDENT',
          ownerId: student.id,
          userId: student.userId || userId,
          verificationToken: token,
          status: 'ACTIVE',
          expiryDate: expiry,
        },
      });
    }

    // Audit Download Event
    try {
      await prisma.documentDownloadAudit.create({
        data: {
          userId,
          userRole: 'Student',
          action: 'STUDENT_ID_DOWNLOADED',
          documentType: 'DIGITAL_ID_PDF',
          targetEntityId: student.id,
          targetEntityType: 'Student',
        },
      });
    } catch (_) {}

    const buffer = await DocumentGeneratorService.generateDigitalIdPdf('STUDENT', student, card.verificationToken);
    const filename = `Student_ID_${student.admissionNo || student.id}.pdf`;

    logger.info(`🪪 Student Digital ID generated for ${student.firstName} ${student.lastName} [Token: ${card.verificationToken}]`);
    return { buffer, filename };
  }

  /**
   * Issue & Download Live Faculty Digital ID PDF
   */
  static async getFacultyDigitalId(userId: string, targetFacultyId?: string): Promise<{ buffer: Buffer; filename: string }> {
    let facultyId = targetFacultyId;

    if (!facultyId) {
      const faculty = await prisma.faculty.findFirst({ where: { userId } });
      if (!faculty) throw new NotFoundException('Faculty profile not found');
      facultyId = faculty.id;
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });

    if (!faculty) throw new NotFoundException('Faculty record not found');

    let card = await prisma.digitalIdCard.findFirst({
      where: { ownerId: faculty.id, ownerType: 'FACULTY', status: 'ACTIVE' },
    });

    if (!card) {
      const token = `IDV-FAC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 5);

      card = await prisma.digitalIdCard.create({
        data: {
          ownerType: 'FACULTY',
          ownerId: faculty.id,
          userId: faculty.userId || userId,
          verificationToken: token,
          status: 'ACTIVE',
          expiryDate: expiry,
        },
      });
    }

    // Audit Download Event
    try {
      await prisma.documentDownloadAudit.create({
        data: {
          userId,
          userRole: 'Faculty',
          action: 'FACULTY_ID_DOWNLOADED',
          documentType: 'DIGITAL_ID_PDF',
          targetEntityId: faculty.id,
          targetEntityType: 'Faculty',
        },
      });
    } catch (_) {}

    const buffer = await DocumentGeneratorService.generateDigitalIdPdf('FACULTY', faculty, card.verificationToken);
    const filename = `Faculty_ID_${faculty.employeeId || faculty.id}.pdf`;

    logger.info(`🪪 Faculty Digital ID generated for Prof. ${faculty.firstName} ${faculty.lastName} [Token: ${card.verificationToken}]`);
    return { buffer, filename };
  }

  /**
   * Public Non-Sensitive QR ID Verification Endpoint
   */
  static async verifyIdCardToken(token: string) {
    const card = await prisma.digitalIdCard.findUnique({
      where: { verificationToken: token },
    });

    if (!card) {
      return {
        isValid: false,
        status: 'INVALID_TOKEN',
        message: 'This ID card verification token is invalid or non-existent.',
      };
    }

    if (card.status !== 'ACTIVE') {
      return {
        isValid: false,
        status: card.status,
        message: `This ID card has been ${card.status.toLowerCase()} and is no longer valid.`,
      };
    }

    if (new Date() > card.expiryDate) {
      return {
        isValid: false,
        status: 'EXPIRED',
        message: 'This ID card has expired.',
      };
    }

    let maskedName = 'STUDENT';
    let department = 'COLLEGE DEPT';

    if (card.ownerType === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id: card.ownerId },
        include: { department: true },
      });
      if (student) {
        maskedName = `${student.firstName} ${student.lastName}`;
        department = student.department?.name || 'Department';
      }
    } else {
      const faculty = await prisma.faculty.findUnique({
        where: { id: card.ownerId },
        include: { department: true },
      });
      if (faculty) {
        maskedName = `Prof. ${faculty.firstName} ${faculty.lastName}`;
        department = faculty.department?.name || 'Department';
      }
    }

    return {
      isValid: true,
      status: 'ACTIVE',
      institution: 'AEC CampusOS ERP Institution',
      ownerType: card.ownerType,
      name: maskedName,
      department,
      cardVersion: card.cardVersion,
      issueDate: card.issueDate,
      expiryDate: card.expiryDate,
    };
  }
}
