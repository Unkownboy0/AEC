import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException, ForbiddenException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';

export interface UploadAcademicFileDto {
  taskId: string;
  assignmentId?: string;
  fileScope: 'REFERENCE' | 'HOD_DRAFT' | 'HOD_SUBMISSION' | 'DEAN_REVIEW' | 'COMMON_CLARIFICATION' | 'CORRECTION_SUPPORT';
  fileName: string;
  originalFileName: string;
  storageReference: string;
  mimeType: string;
  fileSize: number;
  description?: string;
}

const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'application/zip',
  'application/x-zip-compressed',
];

export class AcademicTaskFileService {
  /**
   * 1. Register Uploaded Task File
   */
  static async registerFile(uploaderId: string, dto: UploadAcademicFileDto) {
    if (!dto.fileName || !dto.storageReference) {
      throw new BadRequestException('File name and storage reference are required');
    }

    if (dto.mimeType && !ALLOWED_MIME_TYPES.includes(dto.mimeType)) {
      throw new BadRequestException(`File type ${dto.mimeType} is not permitted`);
    }

    const task = await (prisma as any).academicTask.findUnique({ where: { id: dto.taskId } });
    if (!task) throw new NotFoundException('Target academic task not found');

    // Determine version number if file with same name exists for this assignment/task
    const existingFile = await (prisma as any).academicTaskFile.findFirst({
      where: {
        taskId: dto.taskId,
        assignmentId: dto.assignmentId || null,
        originalFileName: dto.originalFileName,
        isActive: true,
      },
      orderBy: { versionNumber: 'desc' },
    });

    const newVersionNumber = existingFile ? existingFile.versionNumber + 1 : 1;

    const newFile = await (prisma as any).academicTaskFile.create({
      data: {
        taskId: dto.taskId,
        assignmentId: dto.assignmentId || null,
        fileScope: dto.fileScope || 'REFERENCE',
        fileName: dto.fileName,
        originalFileName: dto.originalFileName,
        storageReference: dto.storageReference,
        mimeType: dto.mimeType || 'application/octet-stream',
        fileSize: dto.fileSize || 0,
        versionNumber: newVersionNumber,
        uploadedById: uploaderId,
        scanStatus: 'CLEAN',
        description: dto.description || null,
        isActive: true,
      },
      include: { uploadedBy: { select: { firstName: true, lastName: true, role: true } } },
    });

    // Mark previous version as non-active (superseded)
    if (existingFile) {
      await (prisma as any).academicTaskFile.update({
        where: { id: existingFile.id },
        data: { isActive: false, supersededById: newFile.id },
      });
    }

    // Add timeline log
    await (txTimelineLog(dto.taskId, dto.assignmentId, uploaderId, `File uploaded: ${dto.originalFileName} (v${newVersionNumber})`));

    await AuditService.log({
      actorId: uploaderId,
      action: 'ACADEMIC_TASK_FILE_UPLOADED',
      entityType: 'ACADEMIC_TASK_FILE',
      entityId: newFile.id,
      description: `Uploaded file ${dto.originalFileName} for task ${task.taskCode}`,
    });

    return newFile;
  }

  /**
   * 2. Authorize & Stream File Download (No permanent public URLs)
   */
  static async authorizeDownload(fileId: string, userId: string) {
    const file = await (prisma as any).academicTaskFile.findUnique({
      where: { id: fileId },
      include: {
        task: true,
        assignment: true,
      },
    });

    if (!file) throw new NotFoundException('Requested file record not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, departmentId: true, role: { select: { name: true } } },
    });

    if (!user) throw new ForbiddenException('User record not found');

    const isDeanOrAdmin = ['Super Admin', 'College Admin', 'Academic Dean', 'Principal'].includes(user.role.name);

    if (!isDeanOrAdmin) {
      if (file.assignment) {
        if (file.assignment.assignedHodUserId !== userId && user.departmentId !== file.assignment.departmentId) {
          throw new ForbiddenException('Access denied: You cannot download files belonging to another department');
        }
      }
    }

    await AuditService.log({
      actorId: userId,
      action: 'ACADEMIC_TASK_FILE_DOWNLOADED',
      entityType: 'ACADEMIC_TASK_FILE',
      entityId: fileId,
      description: `Downloaded task file ${file.originalFileName}`,
    });

    return file;
  }

  /**
   * 3. List Task Files
   */
  static async getTaskFiles(taskId: string, assignmentId?: string, fileScope?: string) {
    const where: any = { taskId, isActive: true };
    if (assignmentId) where.assignmentId = assignmentId;
    if (fileScope) where.fileScope = fileScope;

    const files = await (prisma as any).academicTaskFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { firstName: true, lastName: true, role: true } } },
    });

    return files;
  }
}

async function txTimelineLog(taskId: string, assignmentId: string | undefined, actorUserId: string, remarks: string) {
  try {
    await (prisma as any).academicTaskTimeline.create({
      data: {
        taskId,
        assignmentId: assignmentId || null,
        eventType: 'FILE_UPLOADED',
        actorUserId,
        actorRole: 'USER',
        remarks,
      },
    });
  } catch (_) {}
}
