import { z } from 'zod';

// ==========================================
// DEPARTMENTS
// ==========================================
export const createDepartmentSchema = z.object({
  name: z.string().min(3, 'Department name must be at least 3 characters'),
  code: z.string().min(2, 'Department code must be at least 2 characters').toUpperCase(),
  shortName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  type: z.enum(['Engineering', 'Arts', 'Science', 'Medical', 'Management', 'Commerce']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
  logo: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().nullable().or(z.literal('')),
  officeLocation: z.string().optional().nullable(),
  establishedYear: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  hodId: z.string().uuid().optional().nullable(),
  hodName: z.string().optional().nullable(),
  documents: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

// ==========================================
// PROGRAMS
// ==========================================
export const createProgramSchema = z.object({
  name: z.string().min(2, 'Program name is required'),
  code: z.string().min(2, 'Program code is required').toUpperCase(),
  duration: z.coerce.number().int().positive('Duration must be positive'),
  level: z.enum(['UG', 'PG', 'Diploma', 'PhD']),
  credits: z.coerce.number().int().positive('Credits must be positive'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  coordinator: z.string().optional().nullable(),
  departmentId: z.string().uuid('Valid department mapping is required'),
});

export const updateProgramSchema = createProgramSchema.partial();

// ==========================================
// COURSES
// ==========================================
export const createCourseSchema = z.object({
  name: z.string().min(2, 'Course name is required'),
  code: z.string().min(2, 'Course code is required').toUpperCase(),
  duration: z.coerce.number().int().positive(),
  credits: z.coerce.number().int().positive(),
  regulation: z.string().min(1, 'Regulation is required'),
  coordinator: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  courseOutcomes: z.string().optional(), // JSON array
  programId: z.string().uuid('Valid program mapping is required'),
  departmentId: z.string().uuid('Valid department mapping is required'),
});

export const updateCourseSchema = createCourseSchema.partial();

// ==========================================
// ACADEMIC YEARS
// ==========================================
export const createAcademicYearSchema = z.object({
  name: z.string().min(4, 'Academic year is required'), // e.g. "2026-2027"
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  isCurrent: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export const updateAcademicYearSchema = createAcademicYearSchema.partial();

// ==========================================
// SEMESTERS
// ==========================================
export const createSemesterSchema = z.object({
  number: z.coerce.number().int().positive(),
  name: z.string().min(2, 'Semester name is required'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  isCurrent: z.boolean().optional(),
  credits: z.coerce.number().int().positive(),
  courseId: z.string().uuid(),
  programId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

export const updateSemesterSchema = createSemesterSchema.partial();

// ==========================================
// SECTIONS
// ==========================================
export const createSectionSchema = z.object({
  name: z.string().min(1, 'Section name is required'),
  capacity: z.coerce.number().int().positive().default(60),
  classAdvisor: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  semesterId: z.string().uuid(),
  programId: z.string().uuid(),
  departmentId: z.string().uuid(),
});

export const updateSectionSchema = createSectionSchema.partial();

// ==========================================
// SUBJECTS
// ==========================================
export const createSubjectSchema = z.object({
  name: z.string().min(2, 'Subject name is required'),
  code: z.string().min(2, 'Subject code is required').toUpperCase(),
  credits: z.coerce.number().int().positive(),
  theoryHours: z.coerce.number().int().nonnegative().default(3),
  practicalHours: z.coerce.number().int().nonnegative().default(0),
  tutorialHours: z.coerce.number().int().nonnegative().default(0),
  internalMarks: z.coerce.number().int().nonnegative().default(40),
  externalMarks: z.coerce.number().int().nonnegative().default(60),
  passingMarks: z.coerce.number().int().nonnegative().default(40),
  isElective: z.boolean().default(false),
  isLab: z.boolean().default(false),
  isCore: z.boolean().default(true),
  isSkillBased: z.boolean().default(false),
  isOpenElective: z.boolean().default(false),
  isProfessionalElective: z.boolean().default(false),
  subjectCoordinator: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  semesterId: z.string().uuid(),
  departmentId: z.string().uuid(),
  programId: z.string().uuid(),
  sectionId: z.string().uuid().optional().nullable(),
});

export const updateSubjectSchema = createSubjectSchema.partial();
