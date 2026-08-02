import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import crypto from 'crypto';

export class GovernanceService {
  /**
   * 1. Create & Manage Governance Documents
   */
  static async createDocument(authorId: string, data: {
    title: string;
    category?: string;
    departmentId?: string;
    fileUrl?: string;
    keywords?: string;
    expiryDate?: string;
  }) {
    const count = await prisma.governanceDocument.count();
    const documentNumber = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const doc = await prisma.governanceDocument.create({
      data: {
        documentNumber,
        title: data.title,
        category: data.category || 'CIRCULAR',
        departmentId: data.departmentId || null,
        authorId,
        lifecycleState: 'DRAFT',
        fileUrl: data.fileUrl || null,
        keywords: data.keywords || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });

    await AuditService.log({
      actorId: authorId,
      action: 'CREATE',
      entityType: 'GOVERNANCE_DOC',
      entityId: doc.id,
      description: `Created Governance Document ${doc.documentNumber}: ${doc.title}`,
    });

    return doc;
  }

  /**
   * 2. Transition Document Lifecycle State
   */
  static async updateState(docId: string, userId: string, nextState: string) {
    const doc = await prisma.governanceDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Governance document not found');

    const updated = await prisma.governanceDocument.update({
      where: { id: docId },
      data: { lifecycleState: nextState },
    });

    await AuditService.log({
      actorId: userId,
      action: 'UPDATE',
      entityType: 'GOVERNANCE_DOC',
      entityId: docId,
      description: `Changed state of document ${doc.documentNumber} from ${doc.lifecycleState} to ${nextState}`,
    });

    return updated;
  }

  /**
   * 3. Digital Signature / E-Sign
   */
  static async signDocument(docId: string, signerId: string, signerRole: string, ipAddress?: string) {
    const doc = await prisma.governanceDocument.findUnique({ where: { id: docId } });
    if (!doc) throw new NotFoundException('Governance document not found');

    const qrVerificationToken = `SIG-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const rawData = `${doc.id}:${signerId}:${signerRole}:${Date.now()}`;
    const signatureHash = crypto.createHash('sha256').update(rawData).digest('hex');

    const signature = await prisma.digitalSignature.create({
      data: {
        documentId: docId,
        signerId,
        signerRole,
        signatureHash,
        qrVerificationToken,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });

    // Auto update state to APPROVED or PUBLISHED
    await prisma.governanceDocument.update({
      where: { id: docId },
      data: { lifecycleState: 'APPROVED' },
    });

    await AuditService.log({
      actorId: signerId,
      action: 'APPROVE',
      entityType: 'GOVERNANCE_DOC',
      entityId: docId,
      description: `Digitally signed document ${doc.documentNumber} (${doc.title}) with token ${qrVerificationToken}`,
    });

    return signature;
  }

  /**
   * 4. Verify Digital Signature QR Code
   */
  static async verifySignature(qrToken: string) {
    const sig = await prisma.digitalSignature.findUnique({
      where: { qrVerificationToken: qrToken },
      include: {
        document: true,
      },
    });

    if (!sig) return { valid: false, message: 'Invalid or tampered digital signature QR code.' };

    return {
      valid: true,
      signature: {
        token: sig.qrVerificationToken,
        signedAt: sig.signedAt,
        signerRole: sig.signerRole,
        documentNumber: sig.document.documentNumber,
        documentTitle: sig.document.title,
        status: sig.document.lifecycleState,
      },
    };
  }

  /**
   * 5. Knowledge Base & SOP Library
   */
  static async getSopLibrary(category?: string) {
    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = category;
    return await prisma.sopLibraryItem.findMany({ where, orderBy: { title: 'asc' } });
  }

  static async createSopItem(data: {
    title: string;
    category?: string;
    content: string;
    attachmentUrl?: string;
    accessRoles?: string[];
  }) {
    return await prisma.sopLibraryItem.create({
      data: {
        title: data.title,
        category: data.category || 'POLICY',
        content: data.content,
        attachmentUrl: data.attachmentUrl || null,
        accessRoles: data.accessRoles ? JSON.stringify(data.accessRoles) : null,
      },
    });
  }
}
