import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException, BadRequestException } from '../../utils/exceptions';

export class SearchController {
  /**
   * Executive Global Search (Students, Faculty, HODs, Parents, Departments, Programs, Subjects)
   */
  static async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const query = (req.query.q as string || '').trim();

      if (!query || query.length < 2) {
        throw new BadRequestException('Search query must be at least 2 characters');
      }

      const isExecutive = [
        'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
        'Academic Dean', 'Admission Dean', 'IQAC Dean',
      ].includes(user.role);

      if (!isExecutive) {
        throw new ForbiddenException('Global search authority required');
      }

      const [students, faculty, departments, programs, subjects] = await Promise.all([
        prisma.student.findMany({
          where: {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { admissionNo: { contains: query } },
              { email: { contains: query } },
              { phone: { contains: query } },
            ],
            deleted: false,
          },
          take: 10,
          select: { id: true, firstName: true, lastName: true, admissionNo: true, email: true, departmentId: true },
        }),
        prisma.faculty.findMany({
          where: {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { employeeId: { contains: query } },
              { email: { contains: query } },
              { designation: { contains: query } },
            ],
            deleted: false,
          },
          take: 10,
          select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, designation: true, departmentId: true },
        }),
        prisma.department.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { code: { contains: query } },
              { hodName: { contains: query } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true, hodName: true },
        }),
        prisma.program.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { code: { contains: query } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true },
        }),
        prisma.subject.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { code: { contains: query } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true },
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          students,
          faculty,
          departments,
          programs,
          subjects,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
