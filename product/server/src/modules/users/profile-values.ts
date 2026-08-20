import { BadRequestException } from '../../utils/exceptions';

export const PROFILE_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY', 'UNSPECIFIED'] as const;
export type ProfileGender = typeof PROFILE_GENDERS[number];

export function normalizeProfileGender(value: unknown): ProfileGender {
  if (value === null || value === undefined || String(value).trim() === '') return 'UNSPECIFIED';
  const normalized = String(value).trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, ProfileGender> = {
    M: 'MALE', MAN: 'MALE', BOY: 'MALE',
    F: 'FEMALE', WOMAN: 'FEMALE', GIRL: 'FEMALE',
    NON_BINARY: 'OTHER', NONBINARY: 'OTHER',
    PREFER_NOT_TO_DISCLOSE: 'PREFER_NOT_TO_SAY', DECLINE_TO_STATE: 'PREFER_NOT_TO_SAY',
    NOT_SPECIFIED: 'UNSPECIFIED', UNKNOWN: 'UNSPECIFIED',
  };
  const canonical = aliases[normalized] || normalized;
  if (!PROFILE_GENDERS.includes(canonical as ProfileGender)) {
    throw new BadRequestException(`Gender must be one of: ${PROFILE_GENDERS.join(', ')}`);
  }
  return canonical as ProfileGender;
}
