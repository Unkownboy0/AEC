import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException } from '../../utils/exceptions';

export class TimetableService {
  /**
   * Get timetable slots based on section, faculty, department, or student
   */
  async listSlots(params: any) {
    const { sectionId, facultyId, studentId, departmentId, semesterId } = params;
    const filter: any = {};

    if (sectionId) {
      filter.sectionId = sectionId;
    } else if (studentId) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) throw new NotFoundException('Student not found');
      filter.sectionId = student.sectionId;
    } else if (facultyId) {
      filter.facultyId = facultyId;
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
        { slotIndex: 'asc' }
      ]
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

    if (!dayOfWeek || !slotIndex || !startTime || !endTime || !academicYearId || !departmentId || !semesterId || !sectionId || !subjectId || !facultyId || !roomNo) {
      throw new BadRequestException('All timing parameters, mappings, teacher, and classroom are required');
    }

    // Resolve helper names for meaningful error logs
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    const section = await prisma.section.findUnique({ where: { id: sectionId } });

    const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Faculty member';
    const subjectName = subject ? subject.name : 'Subject';
    const sectionName = section ? section.name : 'Section';

    // 1. Check Faculty Conflict
    const facultyConflict = await prisma.timetableSlot.findFirst({
      where: { academicYearId, dayOfWeek, slotIndex, facultyId }
    });
    if (facultyConflict) {
      throw new BadRequestException(
        `Conflict detected: Faculty ${facultyName} is already scheduled for another class during ${dayOfWeek} Period ${slotIndex}.`
      );
    }

    // 2. Check Classroom / Lab Conflict
    const roomConflict = await prisma.timetableSlot.findFirst({
      where: { academicYearId, dayOfWeek, slotIndex, roomNo }
    });
    if (roomConflict) {
      throw new BadRequestException(
        `Conflict detected: Classroom/Lab ${roomNo} is already occupied by another class during ${dayOfWeek} Period ${slotIndex}.`
      );
    }

    // 3. Check Section Conflict
    const sectionConflict = await prisma.timetableSlot.findFirst({
      where: { academicYearId, dayOfWeek, slotIndex, sectionId }
    });
    if (sectionConflict) {
      throw new BadRequestException(
        `Conflict detected: Student ${sectionName} already has ${subjectName} or another class scheduled during ${dayOfWeek} Period ${slotIndex}.`
      );
    }

    // Create slot
    const slot = await prisma.timetableSlot.create({
      data: {
        dayOfWeek,
        slotIndex: parseInt(slotIndex),
        startTime,
        endTime,
        academicYearId,
        departmentId,
        semesterId,
        sectionId,
        subjectId,
        facultyId,
        roomNo,
        isLab: !!isLab,
      },
    });

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
   * AI Timetable Optimization Draft Generation (Mock)
   */
  async generateAIDraft(departmentId: string, semesterId: string, academicYearId: string) {
    const subjects = await prisma.subject.findMany({ where: { departmentId, semesterId } });
    const faculties = await prisma.faculty.findMany({ where: { departmentId } });
    const sections = await prisma.section.findMany({ where: { semesterId } });

    if (subjects.length === 0 || faculties.length === 0 || sections.length === 0) {
      throw new BadRequestException('No subjects, faculty, or sections configured for this department/semester');
    }

    // Wipe existing slots first to perform clean optimization
    await prisma.timetableSlot.deleteMany({ where: { departmentId, semesterId } });

    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const timeSlots = [
      { start: '09:00', end: '09:50' },
      { start: '10:00', end: '10:50' },
      { start: '11:10', end: '12:00' },
      { start: '12:10', end: '01:00' }
    ];

    let createdCount = 0;

    for (const section of sections) {
      let subjIdx = 0;
      for (const d of days) {
        for (let sIdx = 1; sIdx <= timeSlots.length; sIdx++) {
          const subject = subjects[subjIdx % subjects.length];
          const faculty = faculties[subjIdx % faculties.length];
          const timing = timeSlots[sIdx - 1];

          // Auto alloc room
          const roomNo = `Room ${100 + (subjIdx % 5) * 10 + sIdx}`;

          await prisma.timetableSlot.create({
            data: {
              dayOfWeek: d,
              slotIndex: sIdx,
              startTime: timing.start,
              endTime: timing.end,
              academicYearId,
              departmentId,
              semesterId,
              sectionId: section.id,
              subjectId: subject.id,
              facultyId: faculty.id,
              roomNo,
              isLab: subject.isLab,
            }
          });

          subjIdx++;
          createdCount++;
        }
      }
    }

    return { success: true, createdCount };
  }
}
