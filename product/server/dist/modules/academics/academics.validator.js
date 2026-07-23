"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubjectSchema = exports.createSubjectSchema = exports.updateSectionSchema = exports.createSectionSchema = exports.updateSemesterSchema = exports.createSemesterSchema = exports.updateAcademicYearSchema = exports.createAcademicYearSchema = exports.updateCourseSchema = exports.createCourseSchema = exports.updateProgramSchema = exports.createProgramSchema = exports.updateDepartmentSchema = exports.createDepartmentSchema = void 0;
const zod_1 = require("zod");
// ==========================================
// DEPARTMENTS
// ==========================================
exports.createDepartmentSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Department name must be at least 3 characters'),
    code: zod_1.z.string().min(2, 'Department code must be at least 2 characters').toUpperCase(),
    shortName: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    type: zod_1.z.enum(['Engineering', 'Arts', 'Science', 'Medical', 'Management', 'Commerce']),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
    logo: zod_1.z.string().optional().nullable(),
    banner: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email('Please enter a valid email').optional().nullable().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
    website: zod_1.z.string().url('Please enter a valid URL').optional().nullable().or(zod_1.z.literal('')),
    officeLocation: zod_1.z.string().optional().nullable(),
    establishedYear: zod_1.z.coerce.number().int().min(1800).max(2100).optional().nullable(),
    hodId: zod_1.z.string().uuid().optional().nullable(),
    hodName: zod_1.z.string().optional().nullable(),
    documents: zod_1.z.string().optional(),
});
exports.updateDepartmentSchema = exports.createDepartmentSchema.partial();
// ==========================================
// PROGRAMS
// ==========================================
exports.createProgramSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Program name is required'),
    code: zod_1.z.string().min(2, 'Program code is required').toUpperCase(),
    duration: zod_1.z.coerce.number().int().positive('Duration must be positive'),
    level: zod_1.z.enum(['UG', 'PG', 'Diploma', 'PhD']),
    credits: zod_1.z.coerce.number().int().positive('Credits must be positive'),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    coordinator: zod_1.z.string().optional().nullable(),
    departmentId: zod_1.z.string().uuid('Valid department mapping is required'),
});
exports.updateProgramSchema = exports.createProgramSchema.partial();
// ==========================================
// COURSES
// ==========================================
exports.createCourseSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Course name is required'),
    code: zod_1.z.string().min(2, 'Course code is required').toUpperCase(),
    duration: zod_1.z.coerce.number().int().positive(),
    credits: zod_1.z.coerce.number().int().positive(),
    regulation: zod_1.z.string().min(1, 'Regulation is required'),
    coordinator: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    courseOutcomes: zod_1.z.string().optional(), // JSON array
    programId: zod_1.z.string().uuid('Valid program mapping is required'),
    departmentId: zod_1.z.string().uuid('Valid department mapping is required'),
});
exports.updateCourseSchema = exports.createCourseSchema.partial();
// ==========================================
// ACADEMIC YEARS
// ==========================================
exports.createAcademicYearSchema = zod_1.z.object({
    name: zod_1.z.string().min(4, 'Academic year is required'), // e.g. "2026-2027"
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)),
    isCurrent: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});
exports.updateAcademicYearSchema = exports.createAcademicYearSchema.partial();
// ==========================================
// SEMESTERS
// ==========================================
exports.createSemesterSchema = zod_1.z.object({
    number: zod_1.z.coerce.number().int().positive(),
    name: zod_1.z.string().min(2, 'Semester name is required'),
    startDate: zod_1.z.string().transform((val) => new Date(val)),
    endDate: zod_1.z.string().transform((val) => new Date(val)),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    isCurrent: zod_1.z.boolean().optional(),
    credits: zod_1.z.coerce.number().int().positive(),
    courseId: zod_1.z.string().uuid(),
    programId: zod_1.z.string().uuid(),
    academicYearId: zod_1.z.string().uuid(),
});
exports.updateSemesterSchema = exports.createSemesterSchema.partial();
// ==========================================
// SECTIONS
// ==========================================
exports.createSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Section name is required'),
    capacity: zod_1.z.coerce.number().int().positive().default(60),
    classAdvisor: zod_1.z.string().optional().nullable(),
    room: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    semesterId: zod_1.z.string().uuid(),
    programId: zod_1.z.string().uuid(),
    departmentId: zod_1.z.string().uuid(),
});
exports.updateSectionSchema = exports.createSectionSchema.partial();
// ==========================================
// SUBJECTS
// ==========================================
exports.createSubjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Subject name is required'),
    code: zod_1.z.string().min(2, 'Subject code is required').toUpperCase(),
    credits: zod_1.z.coerce.number().int().positive(),
    theoryHours: zod_1.z.coerce.number().int().nonnegative().default(3),
    practicalHours: zod_1.z.coerce.number().int().nonnegative().default(0),
    tutorialHours: zod_1.z.coerce.number().int().nonnegative().default(0),
    internalMarks: zod_1.z.coerce.number().int().nonnegative().default(40),
    externalMarks: zod_1.z.coerce.number().int().nonnegative().default(60),
    passingMarks: zod_1.z.coerce.number().int().nonnegative().default(40),
    isElective: zod_1.z.boolean().default(false),
    isLab: zod_1.z.boolean().default(false),
    isCore: zod_1.z.boolean().default(true),
    isSkillBased: zod_1.z.boolean().default(false),
    isOpenElective: zod_1.z.boolean().default(false),
    isProfessionalElective: zod_1.z.boolean().default(false),
    subjectCoordinator: zod_1.z.string().optional().nullable(),
    description: zod_1.z.string().optional().nullable(),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    semesterId: zod_1.z.string().uuid(),
    departmentId: zod_1.z.string().uuid(),
    programId: zod_1.z.string().uuid(),
    sectionId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateSubjectSchema = exports.createSubjectSchema.partial();
//# sourceMappingURL=academics.validator.js.map