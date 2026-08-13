import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { HodDepartmentContext } from './hod.types';

export interface AuthenticatedHodRequest extends Request {
  user?: any;
  hodContext?: HodDepartmentContext;
}

export function selectAssignedHodDepartment<T extends { id: string }>(departments: T[], requestedId?: string): T {
  if (!departments.length) throw new Error('NO_ASSIGNED_DEPARTMENT');
  if (requestedId) {
    const selected = departments.find((department) => department.id === requestedId);
    if (!selected) throw new Error('CROSS_DEPARTMENT_ACCESS_DENIED');
    return selected;
  }
  return departments[0];
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

    const normalizedRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
    if (!['HOD', 'HEADOFDEPARTMENT'].includes(normalizedRole)) {
      return res.status(403).json({ success: false, error: 'The active workspace is not an HOD workspace.' });
    }

    // Active assignments are authoritative and may cover multiple departments.
    const activeAssignments = await prisma.departmentHodAssignment.findMany({
      where: {
        hodUserId: user.id,
        isActive: true,
      },
      include: { department: true },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
    });
    const configuredMemberships = await prisma.departmentMembership.findMany({ where: { userId: user.id, role: { in: ['HOD', 'HEAD_OF_DEPARTMENT'] } }, include: { department: true } });
    const departmentMap = new Map<string, any>();
    activeAssignments.forEach((assignment) => departmentMap.set(assignment.departmentId, assignment.department));
    configuredMemberships.forEach((membership) => departmentMap.set(membership.departmentId, membership.department));
    const departments = Array.from(departmentMap.values()).filter((department) => department.status === 'ACTIVE' && !department.deleted);
    if (!departments.length) return res.status(403).json({ success: false, error: 'No active department is assigned to this HOD workspace.' });
    const requestedId = typeof req.headers['x-department-id'] === 'string' ? req.headers['x-department-id'] : undefined;
    let selected;
    try { selected = selectAssignedHodDepartment(departments, requestedId); }
    catch { return res.status(403).json({ success: false, error: 'Cross-department access denied.' }); }

    req.hodContext = {
      userId: user.id,
      departmentId: selected.id,
      departmentIds: departments.map((department) => department.id),
      departments: departments.map((department) => ({ id: department.id, name: department.name, code: department.code })),
      departmentName: selected.name,
      departmentCode: selected.code,
      isPrimary: activeAssignments.find((assignment) => assignment.departmentId === selected.id)?.isPrimary ?? false,
    };

    next();
  } catch (error: any) {
    console.error('[HOD Middleware Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to authorize HOD context' });
  }
}
