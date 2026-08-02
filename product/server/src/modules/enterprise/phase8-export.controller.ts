import { Request, Response, NextFunction } from 'express';
import { DigitalIdService } from './digital-id.service';
import { LiveExportService } from './live-export.service';
import { prisma } from '../../lib/prisma';

export class Phase8ExportController {
  /**
   * GET /api/enterprise/id-cards/student/:id?
   */
  async getStudentDigitalId(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const targetId = req.params.id;
      const { buffer, filename } = await DigitalIdService.getStudentDigitalId(userId, targetId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/id-cards/faculty/:id?
   */
  async getFacultyDigitalId(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const targetId = req.params.id;
      const { buffer, filename } = await DigitalIdService.getFacultyDigitalId(userId, targetId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/id-cards/verify/:token
   */
  async verifyDigitalIdToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await DigitalIdService.verifyIdCardToken(token);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/exports/students-excel
   */
  async exportStudentsExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const departmentId = req.query.departmentId as string;
      const { buffer, filename } = await LiveExportService.exportStudentProfilesExcel(user.id, user.role?.name || 'Admin', departmentId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/exports/faculty-excel
   */
  async exportFacultyExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { buffer, filename } = await LiveExportService.exportFacultyProfilesExcel(user.id, user.role?.name || 'Admin');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/exports/students-csv
   */
  async exportStudentsCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { buffer, filename } = await LiveExportService.exportStudentCsv(user.id, user.role?.name || 'Admin');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/enterprise/exports/history
   */
  async getExportHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const history = await prisma.documentDownloadAudit.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.status(200).json({ status: 'success', data: history });
    } catch (err) {
      next(err);
    }
  }
}
