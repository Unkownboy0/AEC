import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';
import { ScopeContext } from './report-scope.service';

export interface ReportConfigDto {
  datasetCode: string;
  columns?: string[];
  filters?: Record<string, any>;
  groupBy?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG';
}

export class ReportBuilderService {
  private static WHITELISTED_DATASETS = [
    'STUDENTS',
    'FACULTY',
    'ATTENDANCE',
    'MARKS',
    'LEAVES',
    'TASKS',
    'COMPLAINTS',
    'PLACEMENTS',
  ];

  /**
   * Execute Custom Report Builder Query
   */
  async runCustomReport(dto: ReportConfigDto, scope: ScopeContext) {
    if (!ReportBuilderService.WHITELISTED_DATASETS.includes(dto.datasetCode.toUpperCase())) {
      throw new BadRequestException(`Dataset '${dto.datasetCode}' is not whitelisted for report generation`);
    }

    const dataset = dto.datasetCode.toUpperCase();
    let records: any[] = [];

    switch (dataset) {
      case 'STUDENTS': {
        const where: any = { deleted: false };
        if (scope.departmentId) where.departmentId = scope.departmentId;
        records = await prisma.student.findMany({
          where,
          take: 200,
          select: { admissionNo: true, firstName: true, lastName: true, email: true, status: true, gender: true },
        });
        break;
      }
      case 'FACULTY': {
        const where: any = { deleted: false };
        if (scope.departmentId) where.departmentId = scope.departmentId;
        records = await prisma.faculty.findMany({
          where,
          take: 200,
          select: { employeeId: true, firstName: true, lastName: true, email: true, designation: true, status: true },
        });
        break;
      }
      case 'LEAVES': {
        records = await prisma.studentLeaveRequest.findMany({
          take: 200,
          select: { requestNumber: true, type: true, reason: true, totalDays: true, status: true, createdAt: true },
        });
        break;
      }
      case 'TASKS': {
        const where: any = {};
        if (scope.departmentId) where.departmentId = scope.departmentId;
        records = await prisma.task.findMany({
          where,
          take: 200,
          select: { taskNumber: true, title: true, category: true, priority: true, status: true, createdAt: true },
        });
        break;
      }
      default:
        records = [];
    }

    return {
      datasetCode: dataset,
      totalCount: records.length,
      columns: dto.columns || Object.keys(records[0] || {}),
      records,
    };
  }

  /**
   * Save User Report Configuration
   */
  async saveReport(userId: string, name: string, datasetCode: string, configuration: any) {
    return prisma.savedReport.create({
      data: {
        name,
        ownerUserId: userId,
        datasetCode: datasetCode.toUpperCase(),
        configuration: JSON.stringify(configuration),
        visibility: 'PRIVATE',
      },
    });
  }

  /**
   * Get User Saved Reports
   */
  async getSavedReports(userId: string) {
    return prisma.savedReport.findMany({
      where: { ownerUserId: userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
