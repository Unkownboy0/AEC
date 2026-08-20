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

  async studentHallTicket(userId: string, examId?: string) {
    const student = await db.student.findFirst({ where: { userId, deleted: false, status: 'ACTIVE' }, select: { id: true } });
    if (!student) throw new ForbiddenException('Student profile not found');
    return this.hallTicketForStudent(student.id, examId);
  }

  async hallTicketForStudent(studentId: string, examId?: string) {
    const student = await db.student.findFirst({
      where: { id: studentId, deleted: false, status: 'ACTIVE' },
      include: {
        department: true, program: true, semester: true,
        user: { select: { id: true, profileImageFileId: true, profilePhoto: true } },
      },
    });
    if (!student) throw new NotFoundException('Active student record not found');
    const allocations = await db.examSeatAllocation.findMany({
      where: { studentId, status: 'PUBLISHED', ...(examId ? { examId } : {}) },
      orderBy: [{ createdAt: 'desc' }],
    });
    if (!allocations.length) throw new NotFoundException('No published hall ticket is available for this student');
    const scheduleIds = allocations.map((item: any) => item.scheduleEntryId);
    const schedules = await db.examScheduleEntry.findMany({
      where: { id: { in: scheduleIds }, status: 'PUBLISHED', publishedAt: { not: null } },
      orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }],
    });
    if (!schedules.length) throw new NotFoundException('No published examination schedule is available');
    const publishedScheduleIds = new Set(schedules.map((item: any) => item.id));
    const eligibleAllocations = allocations.filter((item: any) => publishedScheduleIds.has(item.scheduleEntryId));
    if (!eligibleAllocations.length) throw new NotFoundException('No eligible published hall ticket is available');
    const [subjects, exams, rooms, branding] = await Promise.all([
      db.subject.findMany({ where: { id: { in: schedules.map((item: any) => item.subjectId) }, deleted: false }, select: { id: true, name: true, code: true } }),
      db.exam.findMany({ where: { id: { in: eligibleAllocations.map((item: any) => item.examId) }, deleted: false }, select: { id: true, name: true, type: true } }),
      db.examRoom.findMany({ where: { id: { in: eligibleAllocations.map((item: any) => item.roomId) }, active: true } }),
      db.systemSetting.findMany({ where: { key: { in: ['COLLEGE_NAME'] } } }),
    ]);
    const selectedExam = examId ? exams.find((item: any) => item.id === examId) : exams[0];
    if (!selectedExam) throw new NotFoundException('Published examination record not found');
    const rows = eligibleAllocations.filter((item: any) => item.examId === selectedExam.id).map((allocation: any) => {
      const schedule = schedules.find((item: any) => item.id === allocation.scheduleEntryId);
      const room = rooms.find((item: any) => item.id === allocation.roomId);
      const subject = subjects.find((item: any) => item.id === schedule?.subjectId);
      return { allocation, schedule, room, subject };
    }).filter((item: any) => item.schedule && item.subject);
    if (!rows.length) throw new NotFoundException('Published hall ticket subjects are unavailable');
    const settings = Object.fromEntries(branding.map((item: any) => [item.key, item.value]));
    return {
      student: {
        id: student.id, userId: student.userId, name: `${student.firstName} ${student.lastName}`.trim(),
        registerNumber: student.admissionNo, programme: student.program?.name || 'Not available',
        department: student.department?.name || 'Not available', semester: student.semester?.name || 'Not available',
        profileImageFileId: student.user?.profileImageFileId || null, legacyProfilePhoto: student.user?.profilePhoto || null,
      },
      institutionName: settings.COLLEGE_NAME || 'CampusOS Institution',
      exam: selectedExam,
      subjects: rows.map(({ allocation, schedule, room, subject }: any) => ({
        code: subject.code, name: subject.name, examDate: schedule.examDate, session: schedule.session,
        startTime: schedule.startTime, endTime: schedule.endTime, instructions: schedule.instructions,
        room: [room?.building, room?.name || room?.code].filter(Boolean).join(' - ') || null, seatNumber: allocation.seatNumber,
      })),
    };
  }

  async searchHallTickets(input: any) {
    const page = Math.max(1, Number(input.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(input.pageSize) || 20));
    const query = clean(input.q);
    const students = await db.student.findMany({
      where: {
        deleted: false, status: 'ACTIVE',
        ...(query ? { OR: [
          { admissionNo: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ] } : {}),
        ...(clean(input.departmentId) ? { departmentId: clean(input.departmentId) } : {}),
        ...(clean(input.programId) ? { programId: clean(input.programId) } : {}),
        ...(clean(input.semesterId) ? { semesterId: clean(input.semesterId) } : {}),
        ...(clean(input.sectionId) ? { sectionId: clean(input.sectionId) } : {}),
      },
      include: { department: true, program: true, semester: true, section: true, user: { select: { id: true, profileImageFileId: true, profilePhoto: true } } },
      orderBy: [{ admissionNo: 'asc' }], take: 500,
    });
    if (!students.length) return { items: [], page, pageSize, total: 0, summary: { available: 0, unavailable: 0 } };
    const allocations = await db.examSeatAllocation.findMany({
      where: { studentId: { in: students.map((item: any) => item.id) }, status: 'PUBLISHED', ...(clean(input.examId) ? { examId: clean(input.examId) } : {}) },
      orderBy: { publishedAt: 'desc' },
    });
    const schedules = await db.examScheduleEntry.findMany({
      where: { id: { in: allocations.map((item: any) => item.scheduleEntryId) }, status: 'PUBLISHED', publishedAt: { not: null } },
      select: { id: true },
    });
    const publishedIds = new Set(schedules.map((item: any) => item.id));
    const eligible = allocations.filter((item: any) => publishedIds.has(item.scheduleEntryId));
    const exams = await db.exam.findMany({ where: { id: { in: Array.from(new Set(eligible.map((item: any) => item.examId))) }, deleted: false }, select: { id: true, name: true, type: true } });
    const byStudent = new Map<string, any[]>();
    eligible.forEach((allocation: any) => byStudent.set(allocation.studentId, [...(byStudent.get(allocation.studentId) || []), allocation]));
    const rows = students.map((student: any) => {
      const studentAllocations = byStudent.get(student.id) || [];
      return {
        student: { id: student.id, userId: student.userId, name: `${student.firstName} ${student.lastName}`.trim(), registerNumber: student.admissionNo, department: student.department?.name, programme: student.program?.name, semester: student.semester?.name, section: student.section?.name, profilePhoto: student.user?.profileImageFileId ? `/users/${student.userId}/avatar` : student.user?.profilePhoto || null },
        exam: exams.find((item: any) => item.id === studentAllocations[0]?.examId) || null,
        status: studentAllocations.length ? 'AVAILABLE' : 'NOT_AVAILABLE', subjectCount: studentAllocations.length,
      };
    });
    return { items: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length, summary: { available: rows.filter((item: any) => item.status === 'AVAILABLE').length, unavailable: rows.filter((item: any) => item.status !== 'AVAILABLE').length } };
  }

  async publishResults(examId: string, actorId: string, req?: any) {
    if (!examId || examId.trim() === '') {
      throw new BadRequestException('Exam ID is required for result publication');
    }
    const exam = await db.exam.findFirst({ where: { id: examId, deleted: false } });
    if (!exam) {
      throw new NotFoundException('Exam record not found');
    }
    const updated = await db.mark.updateMany({
      where: { examId, status: { in: ['DRAFT', 'SUBMITTED', 'ENTERED'] } },
      data: { status: 'PUBLISHED' },
    });

    NotificationService.dispatchDomainEvent({
      eventType: 'RESULT_PUBLISHED',
      actorUserId: actorId,
      entityType: 'EXAM_RESULT',
      entityId: examId,
      title: 'Exam Results Published',
      body: `Examination results for ${exam.name || 'term exams'} have been published.`,
      priority: 'HIGH',
      category: 'EXAMS',
      deepLinkRoute: '/student/results',
    }).catch((err) => console.error('[CoeService] Result publish notification error:', err));

    await AuditService.log({
      actorId,
      action: 'PUBLISH_RESULTS',
      entityType: 'EXAM_RESULT',
      entityId: examId,
      description: `Published exam results for ${exam.name}`,
      req,
    });

    return { examId, status: 'PUBLISHED', recordsPublished: updated.count };
  }
}
