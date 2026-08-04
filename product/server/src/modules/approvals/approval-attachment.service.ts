import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { AttachmentDto, CreateAttachmentInput } from './approval.types';
import { ApprovalTimelineService } from './approval-timeline.service';

export class ApprovalAttachmentService {
  /**
   * Retrieve active attachments for a request. Returns [] if none exist.
   */
  static async getAttachmentsForRequest(requestId: string): Promise<AttachmentDto[]> {
    try {
      const attachments = await (prisma as any).approvalAttachment.findMany({
        where: {
          requestId,
          status: 'AVAILABLE',
          deletedAt: null,
        },
        orderBy: { uploadedAt: 'desc' },
      });

      return attachments.map((a: any) => ({
        id: a.id,
        requestId: a.requestId,
        fileName: a.originalFileName || a.fileName,
        originalFileName: a.originalFileName || a.fileName,
        mimeType: a.mimeType || 'application/octet-stream',
        fileSize: a.fileSize || 0,
        status: a.status,
        uploadedAt: a.uploadedAt ? new Date(a.uploadedAt).toISOString() : new Date().toISOString(),
        uploadedBy: {
          id: a.uploadedByUserId || undefined,
          name: 'Applicant / Faculty',
          role: 'Applicant',
        },
        canPreview: Boolean(a.mimeType?.includes('pdf') || a.mimeType?.includes('image')),
        canDownload: true,
        downloadUrl: `/api/approval-requests/${a.requestId}/attachments/${a.id}/download`,
      }));
    } catch (err) {
      logger.warn(`Error fetching attachments for request ${requestId}:`, err);
      return [];
    }
  }

  /**
   * Register a newly uploaded file attachment
   */
  static async createAttachment(input: CreateAttachmentInput): Promise<AttachmentDto> {
    const attachment = await (prisma as any).approvalAttachment.create({
      data: {
        requestId: input.requestId,
        uploadedByUserId: input.uploadedByUserId || null,
        fileName: input.fileName,
        originalFileName: input.originalFileName,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        checksum: input.checksum || null,
        status: 'AVAILABLE',
      },
    });

    // Record timeline event for file upload
    await ApprovalTimelineService.recordEvent({
      requestId: input.requestId,
      eventType: 'ATTACHMENT_UPLOADED',
      actorUserId: input.uploadedByUserId,
      actorNameSnapshot: 'Applicant',
      actorRole: 'APPLICANT',
      actorDisplayRole: 'Applicant',
      attachmentId: attachment.id,
      remarks: `Uploaded document: ${input.originalFileName}`,
      idempotencyKey: `${input.requestId}:ATTACHMENT_UPLOADED:${attachment.id}`,
    });

    return {
      id: attachment.id,
      requestId: attachment.requestId,
      fileName: attachment.originalFileName || attachment.fileName,
      originalFileName: attachment.originalFileName || attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      status: attachment.status,
      uploadedAt: new Date(attachment.uploadedAt).toISOString(),
      canPreview: Boolean(attachment.mimeType?.includes('pdf') || attachment.mimeType?.includes('image')),
      canDownload: true,
      downloadUrl: `/api/approval-requests/${attachment.requestId}/attachments/${attachment.id}/download`,
    };
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      await (prisma as any).approvalAttachment.update({
        where: { id: attachmentId },
        data: {
          status: 'DELETED',
          deletedAt: new Date(),
        },
      });
      return true;
    } catch (err) {
      logger.error('Error deleting attachment:', err);
      return false;
    }
  }
}
