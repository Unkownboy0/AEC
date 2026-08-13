import { z } from 'zod';

const optionalText = z.string().trim().min(1).optional();

export const provisioningRowSchema = z.object({
  profileType: z.enum(['STUDENT', 'EMPLOYEE', 'ACCOUNT_ONLY']),
  email: z.string().trim().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  roleName: z.string().trim().min(1).max(100),
  username: optionalText,
  phone: optionalText,
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']).default('PENDING'),
  departmentCode: optionalText,
  programCode: optionalText,
  courseCode: optionalText,
  academicYear: optionalText,
  semesterNumber: z.coerce.number().int().min(1).max(20).optional(),
  sectionName: optionalText,
  registerNumber: optionalText,
  employeeId: optionalText,
  dob: z.coerce.date().optional(),
  dateOfAdmission: z.coerce.date().optional(),
  dateOfJoining: z.coerce.date().optional(),
  gender: optionalText,
  parentName: optionalText,
  parentPhone: optionalText,
  currentAddress: optionalText,
  permanentAddress: optionalText,
  designation: optionalText,
  qualification: optionalText,
  experience: z.coerce.number().int().min(0).max(80).optional(),
  workspaceRoles: z.array(z.string().trim().min(1)).default([]),
}).strict();

export const provisioningRequestSchema = z.object({
  rows: z.array(z.unknown()).min(1).max(1000),
});

export const provisioningFileRequestSchema = z.object({
  fileName: z.string().trim().regex(/\.(csv|xlsx)$/i, 'Only CSV and XLSX files are supported'),
  base64: z.string().min(1),
});

export type ProvisioningRow = z.infer<typeof provisioningRowSchema>;
