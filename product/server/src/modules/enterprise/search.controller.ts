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
        'Academic Dean', 'Admission Dean', 'IQAC Dean', 'HOD', 'Faculty', 'Mentor'
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
          select: { id: true, firstName: true, lastName: true, admissionNo: true, email: true, departmentId: true, userId: true },
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
          select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, designation: true, departmentId: true, userId: true },
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

      const formattedResults = [
        ...students.map(s => ({
          id: s.id,
          title: `${s.firstName} ${s.lastName}`,
          subtitle: `Student • Reg: ${s.admissionNo}`,
          type: 'STUDENT',
          link: `/profile/${s.userId || s.id}`
        })),
        ...faculty.map(f => ({
          id: f.id,
          title: `${f.firstName} ${f.lastName}`,
          subtitle: `${f.designation || 'Faculty'} • Emp ID: ${f.employeeId}`,
          type: 'FACULTY',
          link: `/profile/${f.userId || f.id}`
        })),
        ...departments.map(d => ({
          id: d.id,
          title: `${d.name} (${d.code})`,
          subtitle: `Department • HOD: ${d.hodName || 'N/A'}`,
          type: 'DEPARTMENT',
          link: `/hod/dashboard?departmentId=${d.id}`
        })),
        ...programs.map(p => ({
          id: p.id,
          title: `${p.name} (${p.code})`,
          subtitle: 'Academic Program',
          type: 'PROGRAM',
          link: `/academics`
        })),
        ...subjects.map(sub => ({
          id: sub.id,
          title: `${sub.name} (${sub.code})`,
          subtitle: 'Course Subject',
          type: 'SUBJECT',
          link: `/academics`
        }))
      ];

      res.status(200).json({
        status: 'success',
        data: formattedResults,
      });
    } catch (error) {
      next(error);
    }
  }
}
