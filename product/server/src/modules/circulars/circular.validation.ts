import { z } from 'zod';

export const CircularCategoryEnum = z.enum([
  'GENERAL', 'ACADEMIC', 'EXAMINATION', 'ADMISSION', 'IQAC',
  'PLACEMENT', 'INTERNSHIP', 'FEES', 'TRANSPORT', 'EMERGENCY',
  'EVENT', 'DEPARTMENT', 'STAFF', 'STUDENT', 'PARENT',
]);

export const CircularPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

export const BroadcastLevelEnum = z.enum([
  'ALL_CAMPUS', 'FACULTY_ONLY', 'STUDENT_ONLY', 'DEPARTMENT_SPECIFIC',
  'HOD_ONLY', 'MENTOR_ONLY', 'PARENT_ONLY', 'SELECTED_USERS',
]);

export const CreateCircularSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  circularNumber: z.string().optional(),
  category: CircularCategoryEnum.default('GENERAL'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  priority: CircularPriorityEnum.default('NORMAL'),
  broadcastLevel: BroadcastLevelEnum.default('ALL_CAMPUS'),
  // Targeting — for institution-level circulars
  targetDepartments: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
  targetYears: z.array(z.string()).default([]),
  targetSemesters: z.array(z.string()).default([]),
  targetSections: z.array(z.string()).default([]),
  selectedUserIds: z.array(z.string()).default([]),
  // Attachment & Links (handles empty string gracefully)
  attachmentUrl: z.string().optional().nullable().transform(val => val || undefined),
  attachmentName: z.string().optional().nullable().transform(val => val || undefined),
  referenceLink: z.string().optional().nullable().transform(val => val || undefined),
  // Scheduling
  publishDate: z.string().optional().nullable().transform(val => val || undefined),
  expiryDate: z.string().optional().nullable().transform(val => val || undefined),
  // Flags
  isPinned: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  acknowledgementRequired: z.boolean().default(false),
});

export type CreateCircularDto = z.infer<typeof CreateCircularSchema>;

export const PublishCircularSchema = z.object({
  publishDate: z.string().datetime().optional(),
});

export const AcknowledgeCircularSchema = z.object({
  circularId: z.string(),
});

export const RemindCircularSchema = z.object({
  message: z.string().optional(),
});
