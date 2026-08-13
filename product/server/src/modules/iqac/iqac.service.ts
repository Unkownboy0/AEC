import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

const normalizeRole = (role: string) => String(role || '').toUpperCase().replace(/[\s_-]+/g, '');
const IQAC_ROLES = new Set(['IQACDEAN', 'IQACEXECUTIVE', 'IQACDOCUMENTATION']);
const LEADERSHIP_ROLES = new Set(['SUPERADMIN', 'COLLEGEADMIN', 'PRINCIPAL']);
const IQAC_TYPES = new Set(['NAAC', 'NBA', 'AQAR', 'SSR', 'ACADEMIC_AND_ADMINISTRATIVE', 'ANNUAL_REPORT', 'BEST_PRACTICES', 'INSTITUTIONAL_VALUES']);
const parseJsonArray = (value?: string | null) => { try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } };

interface Actor {
  id: string;
  role: string;
}

export class IqacService {
  private static canManage(actor: Actor) {
    return IQAC_ROLES.has(normalizeRole(actor.role)) || LEADERSHIP_ROLES.has(normalizeRole(actor.role));
  }

  private static async departmentIdsForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { departmentId: true, departmentMemberships: { select: { departmentId: true } } },
    });
    return Array.from(new Set([
      ...(user?.departmentId ? [user.departmentId] : []),
      ...(user?.departmentMemberships.map((item) => item.departmentId) || []),
    ]));
  }

  private static async assertAuditAccess(actor: Actor, auditId: string) {
    const audit = await prisma.iqacAudit.findUnique({
      where: { id: auditId },
      select: { id: true, departments: { select: { departmentId: true } } },
    });
    if (!audit) throw new NotFoundException('IQAC audit not found');
    if (this.canManage(actor)) return audit;
    const departments = await this.departmentIdsForUser(actor.id);
    if (!audit.departments.some((item) => departments.includes(item.departmentId))) {
      throw new ForbiddenException("You don't have permission to view this IQAC audit");
    }
    return audit;
  }

  static async dashboard(actor: Actor) {
    const scopedDepartmentIds = this.canManage(actor) ? null : await this.departmentIdsForUser(actor.id);
    const where = this.canManage(actor)
      ? {}
      : { departments: { some: { departmentId: { in: scopedDepartmentIds || [] } } } };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeAudits, pendingVerification, correctionRequired, verifiedToday, recentEvidence, upcomingDeadlines, audits, departments, faculty, students, placements, drives, iqacTasks] = await Promise.all([
      prisma.iqacAudit.count({ where: { ...where, status: { in: ['REQUESTED', 'IN_PROGRESS', 'CORRECTION_REQUIRED', 'VERIFIED'] } } }),
      prisma.iqacEvidence.count({ where: { audit: where, isCurrent: true, status: { in: ['UPLOADED', 'RESUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.iqacEvidence.count({ where: { audit: where, isCurrent: true, status: 'CORRECTION_REQUIRED' } }),
      prisma.iqacEvidence.count({ where: { audit: where, isCurrent: true, status: 'VERIFIED', reviewedAt: { gte: today } } }),
      prisma.iqacEvidence.findMany({
        where: { audit: where, isCurrent: true },
        orderBy: { submittedAt: 'desc' },
        take: 8,
        include: { department: { select: { id: true, name: true, code: true } }, requirement: { select: { title: true } } },
      }),
      prisma.iqacAudit.findMany({
        where: { ...where, dueAt: { gte: new Date() }, status: { notIn: ['CLOSED', 'CANCELLED'] } },
        orderBy: { dueAt: 'asc' },
        take: 8,
        select: { id: true, auditCode: true, title: true, dueAt: true, status: true },
      }),
      prisma.iqacAudit.findMany({ where, select: { auditType: true, status: true, dueAt: true, requirements: { select: { id: true } }, departments: { select: { departmentId: true } }, evidence: { where: { isCurrent: true }, select: { departmentId: true, requirementId: true, status: true } } } }),
      prisma.department.findMany({ where: { status: 'ACTIVE', deleted: false, ...(scopedDepartmentIds ? { id: { in: scopedDepartmentIds } } : {}) }, select: { id: true, code: true, name: true } }),
      prisma.faculty.findMany({ where: { deleted: false, status: 'ACTIVE', ...(scopedDepartmentIds ? { departmentId: { in: scopedDepartmentIds } } : {}) }, select: { id: true, departmentId: true, publications: true, patents: true, researchInterests: true } }),
      prisma.student.count({ where: { deleted: false, status: 'ACTIVE', ...(scopedDepartmentIds ? { departmentId: { in: scopedDepartmentIds } } : {}) } }),
      this.canManage(actor) ? prisma.placementRecord.count({ where: { status: 'SELECTED' } }) : Promise.resolve(0),
      this.canManage(actor) ? prisma.placementDrive.count() : Promise.resolve(0),
      prisma.task.findMany({ where: { category: { in: ['IQAC', 'NAAC', 'NBA', 'AQAR', 'SSR', 'RESEARCH', 'PLACEMENT'] }, status: { notIn: ['COMPLETED', 'REJECTED'] }, ...(scopedDepartmentIds ? { OR: [{ departmentId: { in: scopedDepartmentIds } }, { assignees: { some: { assigneeId: actor.id } } }] } : {}) }, select: { id: true, taskNumber: true, title: true, category: true, status: true, priority: true, dueDate: true, department: { select: { code: true, name: true } }, assignees: { include: { assignee: { select: { firstName: true, lastName: true } } } } }, orderBy: { dueDate: 'asc' }, take: 10 }),
    ]);
    const departmentsPending = new Set(recentEvidence.filter((item) => item.status !== 'VERIFIED').map((item) => item.departmentId)).size;
    const contribution = departments.map((department) => {
      const scoped = audits.flatMap((audit) => audit.evidence.filter((item) => item.departmentId === department.id));
      const expected = audits.reduce((total, audit) => total + (audit.departments.some((item) => item.departmentId === department.id) ? audit.requirements.length : 0), 0);
      const verified = scoped.filter((item) => item.status === 'VERIFIED').length;
      return { ...department, expected, submitted: scoped.length, verified, progress: expected ? Math.round((verified / expected) * 100) : 0 };
    }).filter((item) => item.expected > 0).sort((a, b) => a.progress - b.progress);
    const accreditation = Array.from(IQAC_TYPES).map((type) => { const rows = audits.filter((audit) => audit.auditType === type); return { type, total: rows.length, active: rows.filter((row) => !['CLOSED', 'CANCELLED'].includes(row.status)).length, overdue: rows.filter((row) => row.dueAt && row.dueAt < new Date() && !['CLOSED', 'VERIFIED'].includes(row.status)).length }; });
    const facultyMetrics = faculty.reduce((metrics, item) => ({ publications: metrics.publications + parseJsonArray(item.publications).length, patents: metrics.patents + parseJsonArray(item.patents).length, researchContributors: metrics.researchContributors + (parseJsonArray(item.publications).length || parseJsonArray(item.patents).length || item.researchInterests ? 1 : 0) }), { publications: 0, patents: 0, researchContributors: 0 });
    return { activeAudits, pendingVerification, documentsAwaitingReview: pendingVerification, correctionRequired, verifiedToday, departmentsPending, upcomingDeadlines, recentEvidence, accreditation, departmentProgress: contribution, evidenceTasks: iqacTasks, sourceMetrics: { faculty: faculty.length, students, placements, placementDrives: drives, ...facultyMetrics } };
  }

  static async listAudits(actor: Actor) {
    const where = this.canManage(actor)
      ? {}
      : { departments: { some: { departmentId: { in: await this.departmentIdsForUser(actor.id) } } } };
    return prisma.iqacAudit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        departments: { include: { department: { select: { id: true, name: true, code: true } } } },
        requirements: true,
        _count: { select: { evidence: true, observations: true } },
      },
    });
  }

  static async getAudit(actor: Actor, auditId: string) {
    await this.assertAuditAccess(actor, auditId);
    return prisma.iqacAudit.findUnique({
      where: { id: auditId },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        departments: { include: { department: true } },
        requirements: true,
        evidence: {
          orderBy: [{ requirementId: 'asc' }, { departmentId: 'asc' }, { version: 'desc' }],
          include: {
            department: { select: { id: true, name: true, code: true } },
            requirement: true,
            uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            reviewedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        observations: { orderBy: { createdAt: 'desc' }, include: { author: { select: { firstName: true, lastName: true } } } },
        timeline: { orderBy: { createdAt: 'desc' }, include: { actor: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  static async createAudit(actor: Actor, input: any) {
    if (!this.canManage(actor)) throw new ForbiddenException('Only the IQAC workspace can create audits');
    const title = String(input.title || '').trim();
    const auditType = String(input.auditType || '').trim().toUpperCase();
    const departmentIds = Array.from(new Set((input.departmentIds || []).map(String))) as string[];
    const requirements = (input.requirements || []).map((item: any) => ({
      title: String(typeof item === 'string' ? item : item.title || '').trim(),
      description: typeof item === 'string' ? null : String(item.description || '').trim() || null,
      criterion: typeof item === 'string' ? null : String(item.criterion || '').trim() || null,
      keyIndicator: typeof item === 'string' ? null : String(item.keyIndicator || '').trim() || null,
      metricCode: typeof item === 'string' ? null : String(item.metricCode || '').trim() || null,
      sourceType: typeof item === 'string' ? null : String(item.sourceType || '').trim().toUpperCase() || null,
      isRequired: typeof item === 'string' ? true : item.isRequired !== false,
    })).filter((item: any) => item.title);
    if (!title || !auditType) throw new BadRequestException('Audit title and type are required');
    if (!IQAC_TYPES.has(auditType)) throw new BadRequestException('Unsupported IQAC framework');
    if (departmentIds.length === 0) throw new BadRequestException('Select at least one department');
    if (requirements.length === 0) throw new BadRequestException('Add at least one evidence requirement');

    const departments = await prisma.department.findMany({ where: { id: { in: departmentIds }, status: 'ACTIVE', deleted: false }, select: { id: true } });
    if (departments.length !== departmentIds.length) throw new BadRequestException('One or more departments are invalid or inactive');
    const auditCode = `IQAC-${new Date().getFullYear()}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const publish = input.publish !== false;
    const audit = await prisma.iqacAudit.create({
      data: {
        auditCode,
        title,
        auditType,
        description: String(input.description || '').trim() || null,
        status: publish ? 'REQUESTED' : 'DRAFT',
        startAt: input.startAt ? new Date(input.startAt) : null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        createdById: actor.id,
        departments: { create: departmentIds.map((departmentId) => ({ departmentId, status: publish ? 'REQUESTED' : 'DRAFT' })) },
        requirements: { create: requirements },
        timeline: { create: { actorId: actor.id, eventType: publish ? 'AUDIT_REQUESTED' : 'AUDIT_CREATED', description: publish ? 'Evidence requested from selected departments' : 'IQAC audit draft created' } },
      },
      include: { departments: true, requirements: true },
    });

    if (publish) {
      const recipients = await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { departmentId: { in: departmentIds }, role: { name: { in: ['HOD', 'Head of Department'] } } },
            { departmentMemberships: { some: { departmentId: { in: departmentIds }, role: { in: ['HOD', 'HEAD_OF_DEPARTMENT'] } } } },
          ],
        },
        select: { id: true },
      });
      await Promise.all(recipients.map((recipient) => NotificationService.sendNotification({
        recipientId: recipient.id,
        eventType: 'IQAC_EVIDENCE_REQUESTED',
        title: `IQAC evidence requested: ${title}`,
        message: `${requirements.length} evidence requirement${requirements.length === 1 ? '' : 's'} must be submitted.`,
        relatedEntityType: 'IQAC_AUDIT',
        relatedEntityId: audit.id,
        deepLinkRoute: `/iqac/audits/${audit.id}`,
      })));
    }
    await AuditService.log({ actorId: actor.id, action: 'IQAC_AUDIT_CREATED', entityType: 'IQAC_AUDIT', entityId: audit.id, description: `Created ${audit.auditCode}` });
    return audit;
  }

  static async uploadEvidence(actor: Actor, auditId: string, input: any) {
    await this.assertAuditAccess(actor, auditId);
    const departmentId = String(input.departmentId || '');
    const requirementId = String(input.requirementId || '');
    const fileReference = String(input.fileReference || '');
    const sourceType = String(input.sourceType || 'UPLOAD').toUpperCase();
    if (!departmentId || !requirementId || !fileReference || !input.originalFileName || !input.mimeType || !Number.isFinite(Number(input.fileSize))) {
      throw new BadRequestException('Department, requirement, and uploaded file metadata are required');
    }
    if (!['UPLOAD', 'REPOSITORY', 'FACULTY_APPRAISAL', 'RESEARCH', 'PATENT', 'EVENT', 'PLACEMENT', 'STUDENT_METRIC', 'FEEDBACK', 'ATR'].includes(sourceType)) throw new BadRequestException('Unsupported evidence source');
    if (!fileReference.startsWith('/uploads/') || fileReference.includes('..')) throw new BadRequestException('Invalid file reference');
    const [assignment, requirement] = await Promise.all([
      prisma.iqacAuditDepartment.findUnique({ where: { auditId_departmentId: { auditId, departmentId } } }),
      prisma.iqacRequirement.findFirst({ where: { id: requirementId, auditId } }),
    ]);
    if (!assignment || !requirement) throw new BadRequestException('Evidence does not match this audit request');
    if (!this.canManage(actor)) {
      const departments = await this.departmentIdsForUser(actor.id);
      if (!departments.includes(departmentId)) throw new ForbiddenException("You can't upload evidence for this department");
    }

    const evidence = await prisma.$transaction(async (tx) => {
      const latest = await tx.iqacEvidence.findFirst({ where: { auditId, departmentId, requirementId }, orderBy: { version: 'desc' } });
      if (latest) await tx.iqacEvidence.updateMany({ where: { auditId, departmentId, requirementId, isCurrent: true }, data: { isCurrent: false } });
      const created = await tx.iqacEvidence.create({
        data: {
          auditId, departmentId, requirementId, uploadedById: actor.id,
          fileReference, originalFileName: String(input.originalFileName), mimeType: String(input.mimeType), fileSize: Number(input.fileSize), sourceType, sourceEntityId: input.sourceEntityId ? String(input.sourceEntityId) : null, repositoryKey: input.repositoryKey ? String(input.repositoryKey) : fileReference,
          version: (latest?.version || 0) + 1, status: latest ? 'RESUBMITTED' : 'UPLOADED', isCurrent: true,
        },
      });
      await tx.iqacAuditDepartment.update({ where: { id: assignment.id }, data: { status: 'IN_PROGRESS' } });
      await tx.iqacAudit.update({ where: { id: auditId }, data: { status: 'IN_PROGRESS' } });
      await tx.iqacAuditTimeline.create({ data: { auditId, actorId: actor.id, eventType: latest ? 'EVIDENCE_RESUBMITTED' : 'EVIDENCE_UPLOADED', description: `${input.originalFileName} uploaded as version ${created.version}`, metadata: JSON.stringify({ evidenceId: created.id, departmentId, requirementId }) } });
      return created;
    });
    await NotificationService.sendNotification({ recipientId: (await prisma.iqacAudit.findUnique({ where: { id: auditId }, select: { createdById: true } }))!.createdById, eventType: 'IQAC_EVIDENCE_UPLOADED', title: 'IQAC evidence uploaded', message: `${input.originalFileName} is ready for review.`, relatedEntityType: 'IQAC_EVIDENCE', relatedEntityId: evidence.id, deepLinkRoute: `/iqac/audits/${auditId}` });
    await AuditService.log({ actorId: actor.id, action: 'IQAC_EVIDENCE_UPLOADED', entityType: 'IQAC_EVIDENCE', entityId: evidence.id, description: `Uploaded evidence version ${evidence.version}` });
    return evidence;
  }

  static async reviewEvidence(actor: Actor, evidenceId: string, input: any) {
    if (!this.canManage(actor)) throw new ForbiddenException('Only the IQAC workspace can review evidence');
    const action = String(input.action || '').toUpperCase();
    const allowed = new Set(['UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'CORRECTION_REQUIRED', 'CLOSED']);
    if (!allowed.has(action)) throw new BadRequestException('Invalid evidence review action');
    const remarks = String(input.remarks || '').trim();
    if (['REJECTED', 'CORRECTION_REQUIRED'].includes(action) && !remarks) throw new BadRequestException('Review remarks are required for rejection or correction');
    const existing = await prisma.iqacEvidence.findUnique({ where: { id: evidenceId }, include: { uploadedBy: { select: { id: true } } } });
    if (!existing || !existing.isCurrent) throw new NotFoundException('Current IQAC evidence version not found');
    const updated = await prisma.$transaction(async (tx) => {
      const evidence = await tx.iqacEvidence.update({ where: { id: evidenceId }, data: { status: action, remarks: remarks || null, reviewedById: actor.id, reviewedAt: new Date() } });
      if (action === 'CORRECTION_REQUIRED') await tx.iqacAudit.update({ where: { id: existing.auditId }, data: { status: 'CORRECTION_REQUIRED' } });
      await tx.iqacAuditTimeline.create({ data: { auditId: existing.auditId, actorId: actor.id, eventType: `EVIDENCE_${action}`, description: remarks || `Evidence marked ${action.toLowerCase().replace(/_/g, ' ')}`, metadata: JSON.stringify({ evidenceId }) } });
      return evidence;
    });
    await NotificationService.sendNotification({ recipientId: existing.uploadedBy.id, eventType: `IQAC_EVIDENCE_${action}`, title: `IQAC evidence ${action.toLowerCase().replace(/_/g, ' ')}`, message: remarks || 'Your evidence review status changed.', relatedEntityType: 'IQAC_EVIDENCE', relatedEntityId: evidenceId, deepLinkRoute: `/iqac/audits/${existing.auditId}` });
    await AuditService.log({ actorId: actor.id, action: `IQAC_EVIDENCE_${action}`, entityType: 'IQAC_EVIDENCE', entityId: evidenceId, description: remarks || action });
    return updated;
  }

  static async addObservation(actor: Actor, auditId: string, input: any) {
    await this.assertAuditAccess(actor, auditId);
    const message = String(input.message || '').trim();
    if (!message) throw new BadRequestException('Observation text is required');
    if (input.evidenceId) {
      const evidence = await prisma.iqacEvidence.findFirst({ where: { id: String(input.evidenceId), auditId } });
      if (!evidence) throw new BadRequestException('Evidence does not belong to this audit');
    }
    const observation = await prisma.iqacObservation.create({ data: { auditId, evidenceId: input.evidenceId ? String(input.evidenceId) : null, authorId: actor.id, category: String(input.category || 'COMMENT'), message } });
    await prisma.iqacAuditTimeline.create({ data: { auditId, actorId: actor.id, eventType: 'COMMENT_ADDED', description: message, metadata: JSON.stringify({ evidenceId: input.evidenceId || null, observationId: observation.id }) } });
    await AuditService.log({ actorId: actor.id, action: 'IQAC_COMMENT_ADDED', entityType: 'IQAC_AUDIT', entityId: auditId, description: message });
    return observation;
  }

  static async repository(actor: Actor, query: any = {}) {
    const where: any = { isCurrent: true, ...(this.canManage(actor) ? {} : { departmentId: { in: await this.departmentIdsForUser(actor.id) } }) };
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.sourceType) where.sourceType = String(query.sourceType).toUpperCase();
    return prisma.iqacEvidence.findMany({ where, orderBy: { submittedAt: 'desc' }, include: { audit: { select: { auditCode: true, title: true, auditType: true } }, department: { select: { code: true, name: true } }, requirement: true, uploadedBy: { select: { firstName: true, lastName: true } }, reviewedBy: { select: { firstName: true, lastName: true } }, observations: { orderBy: { createdAt: 'desc' }, include: { author: { select: { firstName: true, lastName: true } } } } } });
  }

  static async createEvidenceTask(actor: Actor, auditId: string, input: any) {
    if (!this.canManage(actor)) throw new ForbiddenException('Only the IQAC workspace can assign evidence tasks');
    const audit = await prisma.iqacAudit.findUnique({ where: { id: auditId }, select: { id: true, auditCode: true, title: true } });
    if (!audit) throw new NotFoundException('IQAC audit not found');
    const assigneeIds = Array.from(new Set((input.assigneeIds || []).map(String))) as string[];
    if (!String(input.title || '').trim() || !assigneeIds.length) throw new BadRequestException('Task title and assignees are required');
    const task = await prisma.task.create({ data: { taskNumber: `IQAC-${Date.now().toString(36).toUpperCase()}`, title: String(input.title).trim(), description: String(input.description || '').trim() || `Evidence contribution for ${audit.auditCode}`, category: String(input.category || 'IQAC').toUpperCase(), priority: String(input.priority || 'HIGH').toUpperCase(), dueDate: input.dueDate ? new Date(input.dueDate) : null, departmentId: input.departmentId ? String(input.departmentId) : null, createdById: actor.id, relatedEntityType: 'IQAC_AUDIT', relatedEntityId: auditId, slaHours: Number(input.slaHours || 72), assignees: { create: assigneeIds.map((assigneeId) => ({ assigneeId })) } }, include: { assignees: true } });
    await Promise.all(assigneeIds.map((recipientId) => NotificationService.sendNotification({ recipientId, eventType: 'IQAC_EVIDENCE_TASK_ASSIGNED', title: 'IQAC evidence task assigned', message: task.title, relatedEntityType: 'TASK', relatedEntityId: task.id, deepLinkRoute: '/tasks' })));
    await prisma.iqacAuditTimeline.create({ data: { auditId, actorId: actor.id, eventType: 'EVIDENCE_TASK_ASSIGNED', description: task.title, metadata: JSON.stringify({ taskId: task.id, assigneeIds }) } });
    await AuditService.log({ actorId: actor.id, action: 'IQAC_EVIDENCE_TASK_ASSIGNED', entityType: 'TASK', entityId: task.id, description: task.title });
    return task;
  }
}
