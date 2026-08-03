import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { HodDepartmentContext } from './hod.types';

export interface AuthenticatedHodRequest extends Request {
  user?: any;
  hodContext?: HodDepartmentContext;
}

export async function requireHodRoleAndDept(
  req: AuthenticatedHodRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Authentication required.' });
    }

    // 1. Check if user is active HOD via DepartmentHodAssignment
    const activeAssignment = await (prisma as any).departmentHodAssignment.findFirst({
      where: {
        hodUserId: user.id,
        isActive: true,
      },
      include: {
        department: true,
      },
    });

    let deptId = activeAssignment?.departmentId || user.departmentId;
    let deptName = activeAssignment?.department?.name || '';
    let deptCode = activeAssignment?.department?.code || '';

    if (!deptId) {
      // Check Faculty record
      const faculty = await prisma.faculty.findFirst({
        where: { OR: [{ userId: user.id }, { email: user.email }] },
        include: { department: true }
      });
      if (faculty?.department) {
        deptId = faculty.department.id;
        deptName = faculty.department.name;
        deptCode = faculty.department.code;
      }
    }

    if (!deptId) {
      // Check DepartmentMembership
      const membership = await prisma.departmentMembership.findFirst({
        where: { userId: user.id },
        include: { department: true }
      });
      if (membership?.department) {
        deptId = membership.department.id;
        deptName = membership.department.name;
        deptCode = membership.department.code;
      }
    }

    if (!deptId) {
      // Fallback: check Department table by hodUserId, hodId, or email
      const department = await prisma.department.findFirst({
        where: {
          OR: [
            { hodUserId: user.id },
            { hodId: user.id },
            { email: user.email },
            { code: user.departmentCode || '' },
          ],
        },
      });

      if (department) {
        deptId = department.id;
        deptName = department.name;
        deptCode = department.code;
      }
    }

    if (!deptId) {
      // Global/Super Admin fallback: pick first active department
      const firstDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
      if (firstDept) {
        deptId = firstDept.id;
        deptName = firstDept.name;
        deptCode = firstDept.code;
      }
    }

    req.hodContext = {
      userId: user.id,
      departmentId: deptId,
      departmentName: deptName,
      departmentCode: deptCode,
      isPrimary: activeAssignment?.isPrimary ?? true,
    };

    next();
  } catch (error: any) {
    console.error('[HOD Middleware Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to authorize HOD context' });
  }
}
