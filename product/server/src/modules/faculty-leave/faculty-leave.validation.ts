import { z } from 'zod';

export const LeaveCategoryEnum = z.enum([
  'Casual Leave',
  'Medical Leave',
  'Earned Leave',
  'Emergency Leave',
  'Compensatory Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Half-Day Leave',
  'Permission',
  'Other Leave',
]);

export const OdCategoryEnum = z.enum([
  'Examination Duty',
  'Academic Duty',
  'Conference',
  'Workshop',
  'Seminar',
  'Faculty Development Programme',
  'Industrial Visit',
  'Placement Duty',
  'Admission Duty',
  'IQAC Duty',
  'Research Presentation',
  'University Duty',
  'Official Meeting',
  'Other On Duty',
]);

export const CreateFacultyLeaveOdSchema = z.object({
  requestType: z.enum(['LEAVE', 'OD']),
  category: z.string().min(1, 'Category is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isHalfDay: z.boolean().default(false),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  totalDays: z.number().min(0.5, 'Total days must be at least 0.5'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  description: z.string().optional().nullable(),
  isEmergency: z.boolean().default(false),
  contactNumber: z.string().optional().nullable(),
  supportingDocumentUrl: z.string().optional().nullable(),
  supportingDocumentName: z.string().optional().nullable(),
  affectedPeriods: z.array(z.string()).default([]),
  workHandoverDetails: z.string().optional().nullable(),
  preferredSubstituteId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  
  // OD specific
  eventName: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  eventDate: z.string().optional().nullable(),
  invitationLetterUrl: z.string().optional().nullable(),
  expectedOutcome: z.string().optional().nullable(),


  // Medical specific
  medicalCertificateUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  hospitalDetails: z.string().optional().nullable(),
});

export type CreateFacultyLeaveOdDto = z.infer<typeof CreateFacultyLeaveOdSchema>;

export const HodActionSchema = z.object({
  remarks: z.string().optional().nullable(),
  confirmedSubstituteId: z.string().optional().nullable(),
  handoverInstructions: z.string().optional().nullable(),
});

export const HodRejectReturnSchema = z.object({
  reason: z.string().min(3, 'Reason is required for this action'),
  remarks: z.string().optional().nullable(),
});
