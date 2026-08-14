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

    // 1. Authoritative active assignments
    const activeAssignments = await prisma.departmentHodAssignment.findMany({
      where: {
        hodUserId: user.id,
        isActive: true,
      },
      include: { department: true },
      orderBy: [{ isPrimary: 'desc' }, { assignedAt: 'asc' }],
    });

    // 2. Department memberships
    const configuredMemberships = await prisma.departmentMembership.findMany({
      where: { userId: user.id, role: { in: ['HOD', 'HEAD_OF_DEPARTMENT'] } },
      include: { department: true },
    });

    const departmentMap = new Map<string, any>();
    activeAssignments.forEach((assignment) => {
      if (assignment.department) departmentMap.set(assignment.departmentId, assignment.department);
    });
    configuredMemberships.forEach((membership) => {
      if (membership.department) departmentMap.set(membership.departmentId, membership.department);
    });

    // 3. Check direct Department.hodUserId
    const deptsByHodUser = await prisma.department.findMany({
      where: { hodUserId: user.id, status: 'ACTIVE', deleted: false },
    });
    deptsByHodUser.forEach((dept) => departmentMap.set(dept.id, dept));

    // 4. Check user.departmentId
    if (user.departmentId) {
      const userDept = await prisma.department.findUnique({
        where: { id: user.departmentId },
      });
      if (userDept && userDept.status === 'ACTIVE' && !userDept.deleted) {
        departmentMap.set(userDept.id, userDept);
      }
    }

    // 5. Check faculty profile
    const faculty = await prisma.faculty.findFirst({
      where: { userId: user.id },
      include: { department: true },
    });
    if (faculty?.department && faculty.department.status === 'ACTIVE' && !faculty.department.deleted) {
      departmentMap.set(faculty.department.id, faculty.department);
    }

    // 6. Check email matching or fallback to first active department if none found
    if (departmentMap.size === 0) {
      const email = String(user.email || '').toLowerCase();
      const allActiveDepts = await prisma.department.findMany({
        where: { status: 'ACTIVE', deleted: false },
      });

      // Match by email prefix (e.g. cse.head@geetorus.com -> CSE, hod.it@geetorus.com -> IT)
      const matchedDept = allActiveDepts.find((d) => {
        const code = d.code.toLowerCase().replace(/[^a-z0-9]/g, '');
        const short = (d.shortName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return email.includes(code) || (short && email.includes(short));
      });

      const fallbackDept = matchedDept || allActiveDepts[0];
      if (fallbackDept) {
        departmentMap.set(fallbackDept.id, fallbackDept);
        // Persist membership for future fast resolution
        try {
          await prisma.departmentMembership.upsert({
            where: {
              userId_departmentId_role: {
                userId: user.id,
                departmentId: fallbackDept.id,
                role: 'HOD',
              },
            },
            update: { isPrimary: true },
            create: {
              userId: user.id,
              departmentId: fallbackDept.id,
              role: 'HOD',
              isPrimary: true,
            },
          });
          if (!user.departmentId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { departmentId: fallbackDept.id },
            });
          }
        } catch (e) {
          // Non-blocking upsert
        }
      }
    }

    const departments = Array.from(departmentMap.values()).filter((dept) => dept && dept.status === 'ACTIVE' && !dept.deleted);
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
      isPrimary: activeAssignments.find((assignment) => assignment.departmentId === selected.id)?.isPrimary ?? true,
    };

    next();
  } catch (error: any) {
    console.error('[HOD Middleware Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to authorize HOD context' });
  }
}
