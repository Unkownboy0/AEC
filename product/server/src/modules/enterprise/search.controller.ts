import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { BadRequestException } from '../../utils/exceptions';

export class SearchController {
  /**
   * Executive & Universal Global Search
   * Searches Students, Faculty, Users, Circulars, Departments, Programs, Subjects
   */
  static async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const query = (req.query.q as string || '').trim();

      if (!query || query.length < 2) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const searchPattern = query;

      const [users, students, faculty, circulars, departments, programs, subjects] = await Promise.all([
        // 1. Direct User Accounts (matches username, email, names)
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: searchPattern } },
              { email: { contains: searchPattern } },
              { firstName: { contains: searchPattern } },
              { lastName: { contains: searchPattern } },
            ],
          },
          take: 8,
          select: { id: true, firstName: true, lastName: true, email: true, username: true, role: true },
        }),

        // 2. Students (matches admissionNo, names, email, phone)
        prisma.student.findMany({
          where: {
            OR: [
              { firstName: { contains: searchPattern } },
              { lastName: { contains: searchPattern } },
              { admissionNo: { contains: searchPattern } },
              { email: { contains: searchPattern } },
              { phone: { contains: searchPattern } },
            ],
            deleted: false,
          },
          take: 8,
          select: { id: true, firstName: true, lastName: true, admissionNo: true, email: true, departmentId: true, userId: true },
        }),

        // 3. Faculty (matches employeeId, names, designation)
        prisma.faculty.findMany({
          where: {
            OR: [
              { firstName: { contains: searchPattern } },
              { lastName: { contains: searchPattern } },
              { employeeId: { contains: searchPattern } },
              { email: { contains: searchPattern } },
              { designation: { contains: searchPattern } },
            ],
            deleted: false,
          },
          take: 8,
          select: { id: true, firstName: true, lastName: true, employeeId: true, email: true, designation: true, departmentId: true, userId: true },
        }),

        // 4. Circulars (matches title, description, circularNumber)
        (prisma as any).circular?.findMany?.({
          where: {
            OR: [
              { title: { contains: searchPattern } },
              { circularNumber: { contains: searchPattern } },
              { description: { contains: searchPattern } },
            ],
            status: 'PUBLISHED',
          },
          take: 5,
          select: { id: true, title: true, circularNumber: true, category: true },
        }).catch(() => []) ?? [],

        // 5. Departments
        prisma.department.findMany({
          where: {
            OR: [
              { name: { contains: searchPattern } },
              { code: { contains: searchPattern } },
              { hodName: { contains: searchPattern } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true, hodName: true },
        }),

        // 6. Programs
        prisma.program.findMany({
          where: {
            OR: [
              { name: { contains: searchPattern } },
              { code: { contains: searchPattern } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true },
        }),

        // 7. Subjects
        prisma.subject.findMany({
          where: {
            OR: [
              { name: { contains: searchPattern } },
              { code: { contains: searchPattern } },
            ],
            status: 'ACTIVE',
          },
          take: 5,
          select: { id: true, name: true, code: true },
        }),
      ]);

      const formattedResults: any[] = [];

      // Add user accounts
      users.forEach(u => {
        const roleLabel = typeof u.role === 'object' ? (u.role as any)?.name : String(u.role || 'User');
        formattedResults.push({
          id: u.id,
          title: `${u.firstName} ${u.lastName}`,
          subtitle: `@${u.username || u.email.split('@')[0]} • ${roleLabel}`,
          type: 'USER',
          link: `/profile/${u.id}`,
        });
      });

      // Add students (deduplicate if already in users)
      const existingUserIds = new Set(users.map(u => u.id));
      students.forEach(s => {
        if (!s.userId || !existingUserIds.has(s.userId)) {
          formattedResults.push({
            id: s.id,
            title: `${s.firstName} ${s.lastName}`,
            subtitle: `Student • Reg: ${s.admissionNo || 'N/A'} • ${s.email || ''}`,
            type: 'STUDENT',
            link: `/profile/${s.userId || s.id}`,
          });
        }
      });

      // Add faculty
      faculty.forEach(f => {
        if (!f.userId || !existingUserIds.has(f.userId)) {
          formattedResults.push({
            id: f.id,
            title: `${f.firstName} ${f.lastName}`,
            subtitle: `${f.designation || 'Faculty'} • Emp ID: ${f.employeeId || 'N/A'}`,
            type: 'FACULTY',
            link: `/profile/${f.userId || f.id}`,
          });
        }
      });

      // Add circulars
      circulars.forEach((c: any) => {
        formattedResults.push({
          id: c.id,
          title: c.title,
          subtitle: `Circular • ${c.circularNumber || c.category}`,
          type: 'CIRCULAR',
          link: `/circulars/${c.id}`,
        });
      });

      // Add departments
      departments.forEach(d => {
        formattedResults.push({
          id: d.id,
          title: `${d.name} (${d.code})`,
          subtitle: `Department • HOD: ${d.hodName || 'N/A'}`,
          type: 'DEPARTMENT',
          link: `/hod/dashboard?departmentId=${d.id}`,
        });
      });

      // Add programs
      programs.forEach(p => {
        formattedResults.push({
          id: p.id,
          title: `${p.name} (${p.code})`,
          subtitle: 'Academic Program',
          type: 'PROGRAM',
          link: '/academics',
        });
      });

      // Add subjects
      subjects.forEach(s => {
        formattedResults.push({
          id: s.id,
          title: `${s.name} (${s.code})`,
          subtitle: 'Course Subject',
          type: 'SUBJECT',
          link: '/academics',
        });
      });

      return res.status(200).json({
        status: 'success',
        data: formattedResults,
      });
    } catch (error) {
      next(error);
    }
  }
}
