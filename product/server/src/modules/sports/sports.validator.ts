import { z } from 'zod';

const requiredText = z.string().trim().min(1).max(200);

export const createTeamSchema = z.object({
  name: requiredText,
  sport: requiredText,
  category: z.enum(['MEN', 'WOMEN', 'MIXED']).optional(),
  coachId: z.string().uuid().nullable().optional(),
  captainId: z.string().uuid().nullable().optional(),
  members: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
}).strict();

export const createTournamentSchema = z.object({
  title: requiredText,
  sport: requiredText,
  type: z.enum(['INTRA_COLLEGE', 'INTER_COLLEGE', 'STATE', 'NATIONAL']).optional(),
  venue: requiredText,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  organizer: z.string().trim().max(200).optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  teamsCount: z.number().int().min(0).optional(),
}).strict().refine((value) => value.endDate >= value.startDate, {
  message: 'Tournament end date must not be before its start date',
  path: ['endDate'],
});

export const createBookingSchema = z.object({
  facilityName: requiredText,
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  purpose: z.string().trim().min(3).max(500),
}).strict().refine((value) => value.endTime > value.startTime, {
  message: 'Booking end time must be after its start time',
  path: ['endTime'],
});

export const createEquipmentSchema = z.object({
  name: requiredText,
  sport: requiredText,
  totalQuantity: z.number().int().min(0).optional(),
  available: z.number().int().min(0).optional(),
  condition: z.enum(['GOOD', 'NEEDS_REPAIR', 'REPLACED']).optional(),
  location: z.string().trim().min(1).max(200).optional(),
}).strict().refine((value) => value.available == null || value.totalQuantity == null || value.available <= value.totalQuantity, {
  message: 'Available quantity cannot exceed total quantity',
  path: ['available'],
});

export const createAchievementSchema = z.object({
  studentId: z.string().uuid(),
  studentName: requiredText,
  tournamentName: requiredText,
  sport: requiredText,
  medal: z.enum(['GOLD', 'SILVER', 'BRONZE', 'PARTICIPATION']),
  position: z.string().trim().max(100).optional(),
  certificateUrl: z.string().url().optional(),
  date: z.coerce.date().optional(),
}).strict();
