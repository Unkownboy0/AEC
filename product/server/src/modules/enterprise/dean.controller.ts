import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException } from '../../utils/exceptions';

export class DeanController {
  /**
   * Get Dean Dashboard Summary with Department Comparison
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const isDeanOrAdmin = [
        'Super Admin', 'College Admin', 'Principal', 'Vice Principal',
        'Academic Dean', 'Admission Dean', 'IQAC Dean',
      ].includes(user.role);

      if (!isDeanOrAdmin) {
        throw new ForbiddenException('Dean level authority required');
      }

      const departments = await prisma.department.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true, color: true, hodName: true },
      });

      const departmentComparison = await Promise.all(
        departments.map(async (dept) => {
          const [facultyCount, studentCount, totalTasks, completedTasks, overdueTasks] = await Promise.all([
            prisma.faculty.count({ where: { departmentId: dept.id } }),
            prisma.student.count({ where: { departmentId: dept.id } }),
            prisma.task.count({ where: { departmentId: dept.id } }),
            prisma.task.count({ where: { departmentId: dept.id, status: 'COMPLETED' } }),
            prisma.task.count({ where: { departmentId: dept.id, status: 'OVERDUE' } }),
          ]);

          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

          return {
            ...dept,
            facultyCount,
            studentCount,
            totalTasks,
            completedTasks,
            overdueTasks,
            completionRate,
          };
        })
      );

      const [totalStudents, totalFaculty, totalTasks, overdueTasks] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.faculty.count({ where: { status: 'ACTIVE' } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'OVERDUE' } }),
      ]);

      const recentAssignedTasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          department: { select: { name: true, code: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          assignees: { include: { assignee: { select: { firstName: true, lastName: true, role: true } } } },
        },
      });

      res.status(200).json({
        status: 'success',
        data: {
          executiveRole: user.role,
          overviewStats: {
            totalDepartments: departments.length,
            totalStudents,
            totalFaculty,
            totalTasks,
            overdueTasks,
          },
          departmentComparison,
          recentTasks: recentAssignedTasks,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
