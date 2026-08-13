import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException, UnauthorizedException } from '../../utils/exceptions';

export interface DepartmentScopedRequest extends Request {
  user?: any;
  departmentId?: string;
  isCollegeWide?: boolean;
}

const COLLEGE_WIDE_ROLES = [
  'Super Admin',
  'College Admin',
  'Principal',
  'Vice Principal',
  'Academic Dean',
  'Admission Dean',
  'IQAC Dean',
];

export async function enforceDepartmentScope(
  req: DepartmentScopedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const role = req.user.role;
    const isCollegeWide = COLLEGE_WIDE_ROLES.includes(role);
    req.isCollegeWide = isCollegeWide;

    const requestedDeptId = (req.query.departmentId as string) || (req.body && req.body.departmentId);

    if (isCollegeWide) {
      req.departmentId = requestedDeptId || undefined;
      return next();
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        departmentId: true,
        departmentMemberships: {
          select: { departmentId: true, role: true },
        },
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User record not found');
    }

    const assignedDepartmentIds = Array.from(new Set([
      dbUser.departmentId,
      ...dbUser.departmentMemberships.map((membership) => membership.departmentId),
    ].filter((departmentId): departmentId is string => Boolean(departmentId))));

    if (assignedDepartmentIds.length === 0) {
      throw new ForbiddenException('User is not assigned to any valid department');
    }

    if (requestedDeptId && !assignedDepartmentIds.includes(requestedDeptId)) {
      throw new ForbiddenException('Access denied: You cannot access data belonging to another department');
    }

    req.departmentId = requestedDeptId || dbUser.departmentId || dbUser.departmentMemberships[0]?.departmentId;
    next();
  } catch (error) {
    next(error);
  }
}
