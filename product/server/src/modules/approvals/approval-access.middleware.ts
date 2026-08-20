import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '../../utils/exceptions';

declare global {
  namespace Express {
    interface Request {
      approvalAccess?: { canonicalRequestId: string; allowedRequestIds: string[] };
    }
  }
}

const normalizedRole = (role: unknown) => String(role || '').toUpperCase().replace(/[\s_]+/g, '');

export async function requireApprovalRequestAccess(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedException('Authentication required');
    const requestedId = req.params.requestId;
    const assignment: any = await (prisma as any).approvalAssignment.findFirst({
      where: { OR: [{ id: requestedId }, { requestId: requestedId }] },
    });
    const canonicalRequestId = assignment?.requestId || requestedId;

    const [workflow, facultyLeave, studentLeave, memberships, faculty] = await Promise.all([
      prisma.workflowRequest.findFirst({
        where: { id: canonicalRequestId },
        include: { student: true, facultyRequester: true },
      }),
      (prisma as any).facultyLeaveRequest.findFirst({
        where: { OR: [{ id: canonicalRequestId }, { requestNumber: canonicalRequestId }] },
        include: { faculty: true },
      }),
      prisma.studentLeaveRequest.findFirst({
        where: { OR: [{ id: canonicalRequestId }, { requestNumber: canonicalRequestId }] },
        include: { student: true, mentor: true },
      }),
      prisma.departmentMembership.findMany({ where: { userId: req.user.id, role: 'HOD' }, select: { departmentId: true } }),
      prisma.faculty.findFirst({ where: { userId: req.user.id }, select: { departmentId: true } }),
    ]);

    if (!assignment && !workflow && !facultyLeave && !studentLeave) {
      throw new NotFoundException('Approval request not found');
    }

    const role = normalizedRole(req.user.role);
    const institutionAuthority = new Set(['SUPERADMIN', 'COLLEGEADMIN', 'PRINCIPAL']);
    const directParticipant = [
      assignment?.assignedUserId,
      assignment?.originalAssigneeId,
      assignment?.actionByUserId,
      workflow?.student?.userId,
      workflow?.facultyRequester?.userId,
      facultyLeave?.faculty?.userId,
      studentLeave?.student?.userId,
      studentLeave?.mentor?.userId,
    ].filter(Boolean).includes(req.user.id);

    const requestDepartmentId = assignment?.departmentId
      || workflow?.student?.departmentId
      || workflow?.facultyRequester?.departmentId
      || facultyLeave?.departmentId
      || studentLeave?.departmentId
      || studentLeave?.student?.departmentId;
    const actorDepartmentIds = new Set([faculty?.departmentId, ...memberships.map((m) => m.departmentId)].filter(Boolean));
    const departmentAuthority = role === 'HOD' && Boolean(requestDepartmentId && actorDepartmentIds.has(requestDepartmentId));

    if (!institutionAuthority.has(role) && !directParticipant && !departmentAuthority) {
      throw new ForbiddenException('You are not authorized to access this approval request');
    }

    req.approvalAccess = {
      canonicalRequestId,
      allowedRequestIds: Array.from(new Set([requestedId, canonicalRequestId, assignment?.id].filter(Boolean))),
    };
    next();
  } catch (error) {
    next(error);
  }
}
