import { prisma } from '../lib/prisma';
import { BadRequestException, NotFoundException } from './exceptions';

export const OD_MIN_ADVANCE_DAYS_KEY = 'od_min_advance_days';
export const DEFAULT_OD_MIN_ADVANCE_DAYS = 2;

function atMidnight(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getOdMinAdvanceDays(): Promise<number> {
  const setting = await prisma.systemSetting.findFirst({
    where: { key: { in: [OD_MIN_ADVANCE_DAYS_KEY, 'OD_MIN_ADVANCE_DAYS'] } },
    orderBy: { key: 'asc' },
  });
  const parsed = setting ? parseInt(setting.value, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_OD_MIN_ADVANCE_DAYS;
}

/**
 * Institution-wide server-side date policy for Leave/OD submissions.
 * isOnDuty=true applies the configurable OD minimum-advance-days rule (default 2 calendar days).
 * Plain Leave only rejects past dates. Never trust the client date picker alone.
 */
export async function validateRequestDate(startDate: Date, isOnDuty: boolean): Promise<void> {
  const today = atMidnight(new Date());
  const requestedStart = atMidnight(startDate);

  if (requestedStart < today) {
    throw new BadRequestException('Requests cannot be submitted for a past date');
  }

  if (isOnDuty) {
    const minAdvanceDays = await getOdMinAdvanceDays();
    const earliestAllowed = new Date(today);
    earliestAllowed.setDate(earliestAllowed.getDate() + minAdvanceDays);

    if (requestedStart < earliestAllowed) {
      throw new BadRequestException(
        `OD requests must be submitted at least ${minAdvanceDays} ${minAdvanceDays === 1 ? 'day' : 'days'} in advance.`
      );
    }
  }
}

/**
 * Fetch timetable slots for a student on a specific date.
 */
export async function getTimetableForStudentDate(studentId: string, date: Date) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, departmentId: true, semesterId: true, sectionId: true },
  });

  if (!student) {
    throw new NotFoundException('Student profile not found');
  }

  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const dayOfWeek = days[date.getDay()];

  if (dayOfWeek === 'SUNDAY') {
    return { dayOfWeek, slots: [] };
  }

  const slots = await prisma.timetableSlot.findMany({
    where: {
      departmentId: student.departmentId,
      semesterId: student.semesterId,
      sectionId: student.sectionId,
      dayOfWeek,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      faculty: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { slotIndex: 'asc' },
  });

  return { dayOfWeek, slots };
}

/**
 * Period OD Validation using Student Timetable.
 * Verifies that the requested slot indexes correspond to valid timetable slots.
 */
export async function validatePeriodOdWithTimetable(
  studentId: string,
  date: Date,
  periodIndexes: number[]
) {
  if (!periodIndexes || periodIndexes.length === 0) {
    throw new BadRequestException('At least one period slot must be selected for Period OD');
  }

  await validateRequestDate(date, true);

  const { dayOfWeek, slots } = await getTimetableForStudentDate(studentId, date);

  if (dayOfWeek === 'SUNDAY') {
    throw new BadRequestException('Period OD cannot be requested on Sundays (no scheduled classes)');
  }

  if (slots.length > 0) {
    const validIndexes = new Set(slots.map((s) => s.slotIndex));
    const invalidRequested = periodIndexes.filter((p) => !validIndexes.has(p));

    if (invalidRequested.length > 0) {
      throw new BadRequestException(
        `Period OD includes invalid slot(s) [${invalidRequested.join(', ')}] not scheduled in your section timetable for ${dayOfWeek}`
      );
    }
  }

  const matchedSlots = slots.filter((s) => periodIndexes.includes(s.slotIndex));

  return {
    valid: true,
    dayOfWeek,
    matchedSlots,
    requestedPeriods: periodIndexes,
  };
}
