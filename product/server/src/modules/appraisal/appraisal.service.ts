import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';

export class AppraisalService {
  async listConfigs(academicYear?: string) {
    const where: any = {};
    if (academicYear) where.academicYear = academicYear;
    return prisma.appraisalConfig.findMany({ where, include: { categories: { include: { subcategories: true }, orderBy: { sortOrder: 'asc' } } }, orderBy: { createdAt: 'desc' } });
  }

  async getConfig(id: string) {
    const config = await prisma.appraisalConfig.findUnique({ where: { id }, include: { categories: { include: { subcategories: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } } });
    if (!config) throw new NotFoundException('Appraisal config not found');
    return config;
  }

  async createConfig(data: { academicYear: string; title: string; description?: string; startDate: string; endDate: string; configuredById: string }) {
    return prisma.appraisalConfig.create({ data: { ...data, startDate: new Date(data.startDate), endDate: new Date(data.endDate) } });
  }

  async activateConfig(id: string) {
    return prisma.appraisalConfig.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async addCategory(data: { configId: string; name: string; code: string; description?: string; maxPoints?: number; weightage?: number; sortOrder?: number }) {
    return prisma.appraisalCategory.create({ data: { ...data, maxPoints: data.maxPoints || 100, weightage: data.weightage || 1.0, sortOrder: data.sortOrder || 0 } });
  }

  async addSubcategory(data: { categoryId: string; name: string; code: string; description?: string; maxPoints?: number; pointsPerItem?: number; maxItems?: number; evidenceRequired?: boolean; verificationAuthority?: string; sortOrder?: number }) {
    return prisma.appraisalSubcategory.create({ data: { ...data, maxPoints: data.maxPoints || 10, pointsPerItem: data.pointsPerItem || 1, sortOrder: data.sortOrder || 0 } });
  }

  // Faculty Self-Appraisal Submission
  async getMySubmission(configId: string, facultyId: string, academicYear: string) {
    let submission = await prisma.appraisalSubmission.findUnique({ where: { configId_facultyId_academicYear: { configId, facultyId, academicYear } }, include: { entries: { include: { subcategory: true } } } });
    if (!submission) {
      submission = await prisma.appraisalSubmission.create({ data: { configId, facultyId, academicYear }, include: { entries: { include: { subcategory: true } } } });
    }
    return submission;
  }

  async addEntry(data: { submissionId: string; subcategoryId: string; title: string; description?: string; claimedPoints: number; evidenceId?: string; evidenceUrl?: string; evidenceType?: string }) {
    const submission = await prisma.appraisalSubmission.findUnique({ where: { id: data.submissionId } });
    if (!submission || submission.status !== 'DRAFT') throw new BadRequestException('Submission is not in draft status');
    return prisma.appraisalEntry.create({ data });
  }

  async submitAppraisal(submissionId: string) {
    const submission = await prisma.appraisalSubmission.findUnique({ where: { id: submissionId }, include: { entries: true } });
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'DRAFT') throw new BadRequestException('Already submitted');

    const totalScore = submission.entries.reduce((sum: number, e: any) => sum + e.claimedPoints, 0);
    return prisma.appraisalSubmission.update({ where: { id: submissionId }, data: { status: 'SUBMITTED', totalScore, submittedAt: new Date() } });
  }

  // HOD/Dean Verification
  async verifyEntry(entryId: string, verifiedPoints: number, status: 'VERIFIED' | 'REJECTED', verifiedById: string, remarks?: string) {
    return prisma.appraisalEntry.update({ where: { id: entryId }, data: { verifiedPoints, status, verifiedById, verifiedAt: new Date(), remarks } });
  }

  async finalizeSubmission(submissionId: string, verifiedById: string) {
    const submission = await prisma.appraisalSubmission.findUnique({ where: { id: submissionId }, include: { entries: true } });
    if (!submission) throw new NotFoundException('Submission not found');

    const weightedScore = submission.entries.reduce((sum: number, e: any) => sum + (e.verifiedPoints || 0), 0);
    return prisma.$transaction([
      prisma.appraisalSubmission.update({ where: { id: submissionId }, data: { status: 'FINALIZED', weightedScore, verifiedById, verifiedAt: new Date(), finalizedAt: new Date() } }),
      prisma.appraisalVerification.create({ data: { submissionId, verifierId: verifiedById, verifierRole: 'HOD', action: 'FINALIZE', previousStatus: submission.status, newStatus: 'FINALIZED' } }),
    ]);
  }
}
