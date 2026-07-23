import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportsService } from './reports.service';

const prisma = new PrismaClient();
const reportsService = new ReportsService();

export class ReportsController {
  getAdmissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: [
          { year: '2022', cse: 120, ece: 100, mech: 80, civil: 20 },
          { year: '2023', cse: 140, ece: 110, mech: 75, civil: 25 },
          { year: '2024', cse: 165, ece: 95, mech: 85, civil: 30 },
          { year: '2025', cse: 190, ece: 105, mech: 90, civil: 40 },
          { year: '2026', cse: 220, ece: 120, mech: 95, civil: 45 },
        ],
      });
    } catch (error) {
      next(error);
    }
  };

  getRevenue = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: [
          { term: 'Fall 2024', collected: 245000, pending: 15000, discount: 5000 },
          { term: 'Spring 2025', collected: 285000, pending: 22000, discount: 6000 },
          { term: 'Fall 2025', collected: 310000, pending: 35000, discount: 8000 },
          { term: 'Spring 2026', collected: 345000, pending: 45000, discount: 9000 },
        ],
      });
    } catch (error) {
      next(error);
    }
  };

  getSystem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version,
          platform: process.platform,
          health: 'Excellent',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  exportReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, format } = req.query;
      const user = req.user; // populated by requireAuth middleware
      
      if (!type || !format) {
        res.status(400).json({ status: 'error', message: 'Missing type or format parameters' });
        return;
      }
      
      if (format !== 'PDF' && format !== 'EXCEL') {
        res.status(400).json({ status: 'error', message: 'Invalid format requested' });
        return;
      }

      // Fetch basic data for the institution report
      const [totalStudents, totalFaculties, totalDepartments, departments] = await Promise.all([
        prisma.student.count({ where: { deleted: false, status: 'ACTIVE' } }),
        prisma.faculty.count({ where: { deleted: false, status: 'ACTIVE' } }),
        prisma.department.count({ where: { deleted: false, status: 'ACTIVE' } }),
        prisma.department.findMany({
          where: { deleted: false, status: 'ACTIVE' },
          include: {
            _count: {
              select: { students: true, faculties: true }
            }
          }
        })
      ]);

      const data = {
        totalStudents,
        totalFaculties,
        totalDepartments,
        departments
      };

      // Add Audit log
      if (user) {
        await prisma.userActivityLog.create({
          data: {
            userId: user.id,
            action: 'DOWNLOAD',
            module: 'REPORT',
            description: `Downloaded ${type} report as ${format}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      }

      if (format === 'PDF') {
        await reportsService.generatePDFReport(type as string, user, data, res);
      } else if (format === 'EXCEL') {
        await reportsService.generateExcelReport(type as string, user, data, res);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      // Ensure we haven't already sent headers
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', message: 'Unable to generate report. Please try again.' });
      }
    }
  };
}
