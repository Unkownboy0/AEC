import { prisma } from '../../lib/prisma';
import { BadRequestException, ForbiddenException, NotFoundException } from '../../utils/exceptions';
import { AuditService } from '../security/audit.service';
import { NotificationService } from '../notifications/notification.service';

const db = prisma as any;
const clean = (value: unknown) => String(value ?? '').trim();

export class CoeService {
  async dashboard() {
    const now = new Date();
    const [activeExams, upcomingExams, draftSchedules, publishedSchedules, allocations, invigilators, conflicts, openIncidents] = await Promise.all([
      db.exam.count({ where: { deleted: false, startDate: { lte: now }, endDate: { gte: now } } }),
      db.exam.count({ where: { deleted: false, startDate: { gt: now } } }),
      db.examScheduleEntry.count({ where: { status: 'DRAFT' } }),
      db.examTimetablePublication.count({ where: { status: 'PUBLISHED' } }),
      db.examSeatAllocation.count({ where: { status: 'PUBLISHED' } }),
      db.invigilationAssignment.count({ where: { status: 'PUBLISHED' } }),
      db.examScheduleEntry.groupBy({ by: ['examDate', 'session', 'sectionId'], where: { sectionId: { not: null } }, _count: true, having: { id: { _count: { gt: 1 } } } }),
      db.examIncident.count({ where: { status: 'OPEN' } }),
    ]);
    return { activeExams, upcomingExams, draftSchedules, publishedSchedules, publishedSeatAllocations: allocations, publishedInvigilationAssignments: invigilators, conflictCount: conflicts.length, openIncidents };
  }

  async listSchedule(examId: string) {
    return db.examScheduleEntry.findMany({ where: { examId }, orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }] });
  }

  async createScheduleEntry(input: any, actorId: string, req?: any) {
    const examId = clean(input.examId), subjectId = clean(input.subjectId), session = clean(input.session);
    const startTime = clean(input.startTime), endTime = clean(input.endTime);
    const examDate = new Date(input.examDate);
    const durationMins = Number(input.durationMins);
    if (!examId || !subjectId || !session || !startTime || !endTime || Number.isNaN(examDate.getTime()) || !Number.isInteger(durationMins) || durationMins <= 0) {
      throw new BadRequestException('Exam, subject, date, session, start/end time and positive duration are required');
    }
    const [exam, subject] = await Promise.all([db.exam.findFirst({ where: { id: examId, deleted: false } }), db.subject.findFirst({ where: { id: subjectId, deleted: false } })]);
    if (!exam || !subject) throw new BadRequestException('Exam or subject is invalid');
    if (examDate < new Date(exam.startDate) || examDate > new Date(exam.endDate)) throw new BadRequestException('Exam date must be inside the examination date range');

    const entry = await db.examScheduleEntry.create({ data: {
      examId, subjectId, departmentId: clean(input.departmentId) || null, programId: clean(input.programId) || null,
      sectionId: clean(input.sectionId) || null, examDate, session, startTime, endTime, durationMins,
      instructions: clean(input.instructions) || null, status: 'DRAFT', version: 1, createdById: actorId,
    }});
    await AuditService.log({ actorId, action: 'CREATE', entityType: 'EXAM_SCHEDULE', entityId: entry.id, description: 'Created draft exam schedule entry', newValues: entry, req });
    return entry;
  }

  async validateSchedule(examId: string) {
    const entries = await this.listSchedule(examId);
    if (!entries.length) return { valid: false, conflicts: [{ code: 'EMPTY', message: 'Add at least one exam schedule entry before publication.' }] };
    const conflicts: any[] = [];
    const seen = new Map<string, any>();
    for (const entry of entries) {
      if (!entry.sectionId) continue;
      const key = `${new Date(entry.examDate).toISOString().slice(0, 10)}|${entry.session}|${entry.sectionId}`;
      const previous = seen.get(key);
      if (previous) conflicts.push({ code: 'SECTION_COLLISION', entryIds: [previous.id, entry.id], message: `Section ${entry.sectionId} has two exams in ${entry.session} on ${new Date(entry.examDate).toLocaleDateString()}.` });
      else seen.set(key, entry);
    }
    return { valid: conflicts.length === 0, conflicts, entryCount: entries.length };
  }

  async publishSchedule(examId: string, revisionReason: string, actorId: string, req?: any) {
    const validation = await this.validateSchedule(examId);
    if (!validation.valid) throw new BadRequestException(validation.conflicts.map((item: any) => item.message).join(' '));
    const entries = await this.listSchedule(examId);
    const previous = await db.examTimetablePublication.findFirst({ where: { examId }, orderBy: { version: 'desc' } });
    const version = (previous?.version || 0) + 1;
    if (version > 1 && !clean(revisionReason)) throw new BadRequestException('A revision reason is required when publishing a new timetable version');
    const publishedAt = new Date();
    const publication = await db.$transaction(async (tx: any) => {
      const record = await tx.examTimetablePublication.create({ data: {
        examId, version, revisionReason: clean(revisionReason) || null, previousVersionId: previous?.id || null,
        snapshotJson: JSON.stringify(entries), publishedById: actorId, publishedAt,
      }});
      await tx.examScheduleEntry.updateMany({ where: { examId }, data: { status: 'PUBLISHED', version, publishedById: actorId, publishedAt } });
      await tx.exam.update({ where: { id: examId }, data: { status: 'SCHEDULED' } });
      return record;
    });
    await AuditService.log({ actorId, action: version === 1 ? 'PUBLISH' : 'REVISE', entityType: 'EXAM_TIMETABLE', entityId: examId, description: `Published exam timetable version ${version}`, newValues: publication, req });

    // Emit canonical EXAM_TIMETABLE_PUBLISHED domain event
    const exam = await db.exam.findUnique({ where: { id: examId }, select: { name: true } });
    NotificationService.dispatchDomainEvent({
      eventType: 'EXAM_TIMETABLE_PUBLISHED',
      actorUserId: actorId,
      entityType: 'EXAM_TIMETABLE',
      entityId: examId,
      title: `Exam Timetable Published: ${exam?.name || 'Examination'} (v${version})`,
      body: `Official examination timetable version ${version} has been published by the Controller of Examinations.`,
      priority: 'HIGH',
      category: 'EXAMS',
      deepLinkRoute: '/student/examinations',
    }).catch((err) => console.error('[CoeService] Timetable publication notification error:', err));

    return publication;
  }

  async createRoom(input: any) {
    const code = clean(input.code), name = clean(input.name), building = clean(input.building), capacity = Number(input.capacity);
    const blockedSeats = Number(input.blockedSeats || 0), accessibleSeats = Number(input.accessibleSeats || 0);
    if (!code || !name || !building || !Number.isInteger(capacity) || capacity <= 0 || blockedSeats < 0 || blockedSeats >= capacity || accessibleSeats < 0) throw new BadRequestException('Valid room code, name, building and capacity are required');
    return db.examRoom.create({ data: { code, name, building, floor: clean(input.floor) || null, capacity, blockedSeats, accessibleSeats } });
  }

  async allocateSeats(input: any, actorId: string, req?: any) {
    const scheduleEntryId = clean(input.scheduleEntryId);
    const studentIds = Array.from(new Set((Array.isArray(input.studentIds) ? input.studentIds : []).map(clean).filter(Boolean))) as string[];
    const roomIds = Array.from(new Set((Array.isArray(input.roomIds) ? input.roomIds : []).map(clean).filter(Boolean))) as string[];
    if (!scheduleEntryId || !studentIds.length || !roomIds.length) throw new BadRequestException('Schedule entry, candidates and rooms are required');
    const [entry, rooms, students] = await Promise.all([
      db.examScheduleEntry.findUnique({ where: { id: scheduleEntryId } }),
      db.examRoom.findMany({ where: { id: { in: roomIds }, active: true }, orderBy: { code: 'asc' } }),
      db.student.findMany({ where: { id: { in: studentIds }, deleted: false }, select: { id: true } }),
    ]);
    if (!entry) throw new NotFoundException('Exam schedule entry not found');
    if (students.length !== studentIds.length) throw new BadRequestException('One or more candidates are invalid');
    const capacity = rooms.reduce((sum: number, room: any) => sum + room.capacity - room.blockedSeats, 0);
    if (capacity < studentIds.length) throw new BadRequestException(`Selected rooms provide ${capacity} usable seats for ${studentIds.length} candidates`);

    const sameSession = await db.examScheduleEntry.findMany({ where: { examDate: entry.examDate, session: entry.session }, select: { id: true } });
    const conflict = await db.examSeatAllocation.findFirst({ where: { scheduleEntryId: { in: sameSession.map((item: any) => item.id) }, studentId: { in: studentIds }, status: { in: ['DRAFT', 'PUBLISHED'] } } });
    if (conflict && conflict.scheduleEntryId !== scheduleEntryId) throw new BadRequestException(`Candidate ${conflict.studentId} already has a seat for another exam in this session`);

    const allocations = await db.$transaction(async (tx: any) => {
      await tx.examSeatAllocation.deleteMany({ where: { scheduleEntryId, status: 'DRAFT' } });
      const created: any[] = []; let candidateIndex = 0;
      for (const room of rooms) {
        const usable = room.capacity - room.blockedSeats;
        for (let seat = 1; seat <= usable && candidateIndex < studentIds.length; seat++, candidateIndex++) {
          created.push(await tx.examSeatAllocation.create({ data: { examId: entry.examId, scheduleEntryId, studentId: studentIds[candidateIndex], roomId: room.id, seatNumber: String(seat).padStart(3, '0'), allocatedById: actorId } }));
        }
      }
      return created;
    }, { isolationLevel: 'Serializable' });
    await AuditService.log({ actorId, action: 'ALLOCATE', entityType: 'EXAM_SEATS', entityId: scheduleEntryId, description: `Allocated ${allocations.length} candidates`, newValues: { studentIds, roomIds }, req });
    return allocations;
  }

  async publishSeats(scheduleEntryId: string, actorId: string, req?: any) {
    const publishedAt = new Date();
    const result = await db.examSeatAllocation.updateMany({ where: { scheduleEntryId, status: 'DRAFT' }, data: { status: 'PUBLISHED', publishedAt } });
    if (!result.count) throw new BadRequestException('No draft seat allocations are available to publish');
    const allocations = await db.examSeatAllocation.findMany({ where: { scheduleEntryId, status: 'PUBLISHED' }, select: { studentId: true } });
    const students = await db.student.findMany({ where: { id: { in: allocations.map((item: any) => item.studentId) } }, select: { userId: true } });
    const targetUserIds = students.map((item: any) => item.userId).filter(Boolean);

    if (targetUserIds.length > 0) {
      NotificationService.dispatchDomainEvent({
        eventType: 'HALL_ALLOCATION_PUBLISHED',
        actorUserId: actorId,
        entityType: 'EXAM_SCHEDULE',
        entityId: scheduleEntryId,
        title: 'Exam Hall Allotted',
        body: 'Your examination hall and seat allocation is ready. Tap to view your hall ticket.',
        priority: 'HIGH',
        category: 'EXAMS',
        deepLinkRoute: '/student/examinations',
        targetUserIds,
      }).catch((err) => console.error('[CoeService] Hall allocation notification error:', err));
    }

    await AuditService.log({ actorId, action: 'PUBLISH', entityType: 'EXAM_SEATS', entityId: scheduleEntryId, description: `Published ${result.count} seat allocations`, req });
    return { published: result.count, publishedAt };
  }

  async assignInvigilator(input: any, actorId: string, req?: any) {
    const scheduleEntryId = clean(input.scheduleEntryId), facultyId = clean(input.facultyId), roomId = clean(input.roomId), reportingTime = clean(input.reportingTime);
    if (!scheduleEntryId || !facultyId || !roomId || !reportingTime) throw new BadRequestException('Schedule, faculty, room and reporting time are required');
    const entry = await db.examScheduleEntry.findUnique({ where: { id: scheduleEntryId } });
    if (!entry) throw new NotFoundException('Exam schedule entry not found');
    const simultaneousEntries = await db.examScheduleEntry.findMany({ where: { examDate: entry.examDate, session: entry.session }, select: { id: true } });
    const existing = await db.invigilationAssignment.findFirst({ where: { facultyId, scheduleEntryId: { in: simultaneousEntries.map((item: any) => item.id) }, status: { not: 'CANCELLED' } } });
    if (existing) throw new BadRequestException('This faculty member already has an invigilation duty in the same exam session');
    const assignment = await db.invigilationAssignment.create({ data: { examId: entry.examId, scheduleEntryId, facultyId, roomId, reportingTime, instructions: clean(input.instructions) || null, assignedById: actorId } });

    // Notify assigned faculty
    const fac = await db.faculty.findUnique({ where: { id: facultyId }, select: { userId: true } });
    if (fac?.userId) {
      NotificationService.dispatchDomainEvent({
        eventType: 'TASK_ASSIGNED',
        actorUserId: actorId,
        entityType: 'INVIGILATION',
        entityId: assignment.id,
        title: 'Exam Invigilation Duty Assigned',
        body: `You have been assigned invigilation duty for session on reporting time ${reportingTime}.`,
        priority: 'HIGH',
        category: 'EXAMS',
        deepLinkRoute: '/faculty/examinations',
        targetUserIds: [fac.userId],
      }).catch((err) => console.error('[CoeService] Invigilation notification error:', err));
    }

    await AuditService.log({ actorId, action: 'ASSIGN', entityType: 'INVIGILATION', entityId: assignment.id, description: 'Assigned invigilation duty', newValues: assignment, req });
    return assignment;
  }

  async studentHallView(userId: string) {
    const student = await db.student.findFirst({ where: { userId, deleted: false }, select: { id: true } });
    if (!student) throw new ForbiddenException('Student profile not found');
    const allocations = await db.examSeatAllocation.findMany({ where: { studentId: student.id, status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' } });
    const scheduleIds = allocations.map((item: any) => item.scheduleEntryId), roomIds = allocations.map((item: any) => item.roomId);
    const [schedules, rooms] = await Promise.all([db.examScheduleEntry.findMany({ where: { id: { in: scheduleIds }, status: 'PUBLISHED' } }), db.examRoom.findMany({ where: { id: { in: roomIds } } })]);
    const subjectIds = schedules.map((item: any) => item.subjectId), examIds = schedules.map((item: any) => item.examId);
    const [subjects, exams] = await Promise.all([db.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true } }), db.exam.findMany({ where: { id: { in: examIds }, deleted: false }, select: { id: true, name: true, type: true } })]);
    return allocations.map((allocation: any) => {
      const schedule = schedules.find((item: any) => item.id === allocation.scheduleEntryId);
      return { ...allocation, schedule, room: rooms.find((item: any) => item.id === allocation.roomId), subject: subjects.find((item: any) => item.id === schedule?.subjectId), exam: exams.find((item: any) => item.id === schedule?.examId) };
    });
  }
}
