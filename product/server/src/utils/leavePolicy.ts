import { prisma } from '../lib/prisma';
import { BadRequestException } from './exceptions';

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
