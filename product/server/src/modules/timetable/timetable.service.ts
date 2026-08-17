import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class TimetableService {
  /**
   * Get timetable slots based on section, faculty, department, or student.
   * Resolves authenticated student context automatically when studentId='me' or unset.
   * Always returns 200 with an array, never 404.
   */
  async listSlots(params: any, reqUser?: any) {
    const { sectionId, facultyId, studentId, departmentId, semesterId } = params;
    const filter: any = {};

    if (sectionId) {
      filter.sectionId = sectionId;
    } else if (studentId) {
      let student = null;
      if (studentId === 'me' || studentId === 'current') {
        if (reqUser?.id) {
          student = await prisma.student.findFirst({ where: { userId: reqUser.id } });
        }
      } else {
        student = await prisma.student.findFirst({
          where: {
            OR: [
              { id: studentId },
              { userId: studentId },
              { admissionNo: studentId },
            ],
          },
        });
      }

      if (student) {
        let slots: any[] = [];
        if (student.sectionId) {
          slots = await prisma.timetableSlot.findMany({
            where: { sectionId: student.sectionId },
            include: { subject: true, faculty: true, section: true, semester: true },
            orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
          });
        }
        if (slots.length === 0 && student.departmentId) {
          slots = await prisma.timetableSlot.findMany({
            where: { departmentId: student.departmentId },
            include: { subject: true, faculty: true, section: true, semester: true },
            orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
          });
        }
        return slots;
      } else {
        return [];
      }
    } else if (!facultyId && !departmentId && reqUser?.id) {
      // Auto-infer authenticated context
      const student = await prisma.student.findFirst({ where: { userId: reqUser.id } });
      if (student) {
        let slots: any[] = [];
        if (student.sectionId) {
          slots = await prisma.timetableSlot.findMany({
            where: { sectionId: student.sectionId },
            include: { subject: true, faculty: true, section: true, semester: true },
            orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
          });
        }
        if (slots.length === 0 && student.departmentId) {
          slots = await prisma.timetableSlot.findMany({
            where: { departmentId: student.departmentId },
            include: { subject: true, faculty: true, section: true, semester: true },
            orderBy: [{ dayOfWeek: 'asc' }, { slotIndex: 'asc' }],
          });
        }
        return slots;
      } else {
        const faculty = await prisma.faculty.findFirst({ where: { userId: reqUser.id } });
        if (faculty) {
          filter.facultyId = faculty.id;
        }
      }
    } else if (facultyId) {
      if (facultyId === 'me' && reqUser?.id) {
        const faculty = await prisma.faculty.findFirst({ where: { userId: reqUser.id } });
        if (faculty) filter.facultyId = faculty.id;
        else return [];
      } else {
        filter.facultyId = facultyId;
      }
    } else if (departmentId) {
      filter.departmentId = departmentId;
      if (semesterId) filter.semesterId = semesterId;
    }

    return prisma.timetableSlot.findMany({
      where: filter,
      include: {
        subject: true,
        faculty: true,
        section: true,
        semester: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { slotIndex: 'asc' },
      ],
    });
  }

  /**
   * Calculate affected timetable scheduled sessions across a date range for a Student or Faculty
   */
  async getAffectedSessions(params: any, reqUser?: any) {
    const dateFromStr = params.dateFrom || params.startDate || params.from;
    const dateToStr = params.dateTo || params.endDate || params.to || dateFromStr;

    if (!dateFromStr) {
      return [];
    }

    const slots = await this.listSlots(params, reqUser);
    if (!Array.isArray(slots) || slots.length === 0) {
      return [];
    }

    const dayNameMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const sessions: any[] = [];

    const startDate = new Date(dateFromStr);
    const endDate = new Date(dateToStr);

    // Limit iteration to maximum 90 days to prevent runaway loops
    const maxDays = 90;
    let iteration = 0;
    const curDate = new Date(startDate);

    while (curDate <= endDate && iteration < maxDays) {
      const dayOfWeekStr = dayNameMap[curDate.getDay()];
      const dateIso = curDate.toISOString().split('T')[0];

      const matchingSlots = slots.filter(
        (s) => s.dayOfWeek?.toUpperCase() === dayOfWeekStr
      );

      for (const slot of matchingSlots) {
        sessions.push({
          sessionId: `${slot.id}-${dateIso}`,
          slotId: slot.id,
          date: dateIso,
          day: dayOfWeekStr,
          periodNumber: slot.slotIndex,
          slotIndex: slot.slotIndex,
          startTime: slot.startTime,
          endTime: slot.endTime,
          subject: slot.subject?.name || 'Subject',
          subjectCode: slot.subject?.code || '',
          faculty: slot.faculty
            ? `${slot.faculty.firstName} ${slot.faculty.lastName}`
            : 'Faculty',
          facultyId: slot.facultyId,
          class: slot.section?.name || 'Class',
          sectionId: slot.sectionId,
          room: slot.roomNo || '',
          sessionType: slot.slotType || (slot.isLab ? 'LAB' : 'THEORY'),
          timetableRevisionId: slot.revisionId || null,
        });
      }

      curDate.setDate(curDate.getDate() + 1);
      iteration++;
    }

    return sessions.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.slotIndex - b.slotIndex;
    });
  }

  /**
   * Create a new timetable slot with strict conflict checks
   */
  async createSlot(input: any) {
    const {
      dayOfWeek,
      slotIndex,
      startTime,
      endTime,
      academicYearId,
      departmentId,
      semesterId,
      sectionId,
      subjectId,
      facultyId,
      roomNo,
      isLab,
    } = input;

    if (
      !dayOfWeek ||
      !slotIndex ||
      !startTime ||
      !endTime ||
      !academicYearId ||
      !departmentId ||
      !semesterId ||
      !sectionId ||
      !subjectId ||
      !facultyId ||
      !roomNo
    ) {
      throw new BadRequestException(
        'All timing parameters, mappings, teacher, and classroom are required'
      );
    }

    // 1. Check Faculty Conflict (same faculty, same day, same slot)
    const facultyConflict = await prisma.timetableSlot.findFirst({
      where: {
        academicYearId,
        dayOfWeek,
        slotIndex: Number(slotIndex),
        facultyId,
      },
      include: {
        faculty: true,
        section: true,
      },
    });

    if (facultyConflict) {
      const facName = facultyConflict.faculty
        ? `${facultyConflict.faculty.firstName} ${facultyConflict.faculty.lastName}`
        : 'Faculty';
      const secName = facultyConflict.section ? facultyConflict.section.name : 'another section';
      throw new BadRequestException(
        `Faculty Conflict: ${facName} is already scheduled in ${secName} during Period ${slotIndex} on ${dayOfWeek}`
      );
    }

    // 2. Check Room/Lab Conflict (same room, same day, same slot)
    const roomConflict = await prisma.timetableSlot.findFirst({
      where: {
        academicYearId,
        dayOfWeek,
        slotIndex: Number(slotIndex),
        roomNo,
      },
      include: {
        section: true,
      },
    });

    if (roomConflict) {
      const secName = roomConflict.section ? roomConflict.section.name : 'another section';
      throw new BadRequestException(
        `Room Conflict: Room ${roomNo} is already occupied by ${secName} during Period ${slotIndex} on ${dayOfWeek}`
      );
    }

    // 3. Check Section Conflict (same section, same day, same slot)
    const sectionConflict = await prisma.timetableSlot.findFirst({
      where: {
        academicYearId,
        dayOfWeek,
        slotIndex: Number(slotIndex),
        sectionId,
      },
    });

    if (sectionConflict) {
      throw new BadRequestException(
        `Section Conflict: This section already has a class scheduled during Period ${slotIndex} on ${dayOfWeek}`
      );
    }

    // Create the slot
    const slot = await prisma.timetableSlot.create({
      data: {
        dayOfWeek,
        slotIndex: Number(slotIndex),
        startTime,
        endTime,
        academicYearId,
        departmentId,
        semesterId,
        sectionId,
        subjectId,
        facultyId,
        roomNo,
        isLab: Boolean(isLab),
      },
      include: {
        subject: true,
        faculty: true,
        section: true,
        semester: true,
      },
    });

    const sectionName = slot.section?.name || 'Section';
    const subjectName = slot.subject?.name || 'Subject';

    // Emit TIMETABLE_CHANGED domain event to section students and department faculty
    try {
      const { NotificationService } = await import('../notifications/notification.service');
      NotificationService.dispatchDomainEvent({
        eventType: 'TIMETABLE_CHANGED',
        entityType: 'TIMETABLE_SLOT',
        entityId: slot.id,
        title: `Timetable Updated: ${sectionName}`,
        body: `Schedule updated for ${dayOfWeek} Period ${slotIndex}: ${subjectName} in Room ${roomNo}.`,
        priority: 'NORMAL',
        category: 'ACADEMIC',
        deepLinkRoute: '/student/timetable',
        sectionId: slot.sectionId,
        departmentId: slot.departmentId,
      }).catch((err) => console.error('[TimetableService] Notification dispatch error:', err));
    } catch (err) {}

    return slot;
  }

  /**
   * Delete a timetable slot
   */
  async deleteSlot(id: string) {
    const exists = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Timetable slot not found');

    await prisma.timetableSlot.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Scheduling preview.
   */
  async generateAIDraft(departmentId: string, semesterId: string, academicYearId: string) {
    const subjects = await prisma.subject.findMany({ where: { departmentId, semesterId } });
    const faculties = await prisma.faculty.findMany({ where: { departmentId } });
    const sections = await prisma.section.findMany({ where: { semesterId } });

    if (subjects.length === 0 || faculties.length === 0 || sections.length === 0) {
      throw new BadRequestException('No subjects, faculty, or sections configured for this department/semester');
    }

    const existingSlots = await prisma.timetableSlot.findMany({
      where: { departmentId, semesterId, academicYearId },
      select: { id: true, dayOfWeek: true, slotIndex: true, facultyId: true, sectionId: true, roomNo: true },
    });

    return {
      mode: 'PREVIEW_ONLY',
      applied: false,
      message: 'No live timetable was changed. Configure institution period and workload policies before generating an allocatable draft.',
      inputs: {
        subjectCount: subjects.length,
        facultyCount: faculties.length,
        sectionCount: sections.length,
        existingSlotCount: existingSlots.length,
      },
      existingSlots,
    };
  }
}
