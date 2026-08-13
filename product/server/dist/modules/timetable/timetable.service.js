"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableService = void 0;
const prisma_1 = require("../../lib/prisma");
const exceptions_1 = require("../../utils/exceptions");
class TimetableService {
    /**
     * Get timetable slots based on section, faculty, department, or student
     */
    async listSlots(params) {
        const { sectionId, facultyId, studentId, departmentId, semesterId } = params;
        const filter = {};
        if (sectionId) {
            filter.sectionId = sectionId;
        }
        else if (studentId) {
            const student = await prisma_1.prisma.student.findUnique({ where: { id: studentId } });
            if (!student)
                throw new exceptions_1.NotFoundException('Student not found');
            filter.sectionId = student.sectionId;
        }
        else if (facultyId) {
            filter.facultyId = facultyId;
        }
        else if (departmentId) {
            filter.departmentId = departmentId;
            if (semesterId)
                filter.semesterId = semesterId;
        }
        return prisma_1.prisma.timetableSlot.findMany({
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
    async createSlot(input) {
        const { dayOfWeek, slotIndex, startTime, endTime, academicYearId, departmentId, semesterId, sectionId, subjectId, facultyId, roomNo, isLab, } = input;
        if (!dayOfWeek || !slotIndex || !startTime || !endTime || !academicYearId || !departmentId || !semesterId || !sectionId || !subjectId || !facultyId || !roomNo) {
            throw new exceptions_1.BadRequestException('All timing parameters, mappings, teacher, and classroom are required');
        }
        // Resolve helper names for meaningful error logs
        const faculty = await prisma_1.prisma.faculty.findUnique({ where: { id: facultyId } });
        const subject = await prisma_1.prisma.subject.findUnique({ where: { id: subjectId } });
        const section = await prisma_1.prisma.section.findUnique({ where: { id: sectionId } });
        const facultyName = faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Faculty member';
        const subjectName = subject ? subject.name : 'Subject';
        const sectionName = section ? section.name : 'Section';
        // 1. Check Faculty Conflict
        const facultyConflict = await prisma_1.prisma.timetableSlot.findFirst({
            where: { academicYearId, dayOfWeek, slotIndex, facultyId }
        });
        if (facultyConflict) {
            throw new exceptions_1.BadRequestException(`Conflict detected: Faculty ${facultyName} is already scheduled for another class during ${dayOfWeek} Period ${slotIndex}.`);
        }
        // 2. Check Classroom / Lab Conflict
        const roomConflict = await prisma_1.prisma.timetableSlot.findFirst({
            where: { academicYearId, dayOfWeek, slotIndex, roomNo }
        });
        if (roomConflict) {
            throw new exceptions_1.BadRequestException(`Conflict detected: Classroom/Lab ${roomNo} is already occupied by another class during ${dayOfWeek} Period ${slotIndex}.`);
        }
        // 3. Check Section Conflict
        const sectionConflict = await prisma_1.prisma.timetableSlot.findFirst({
            where: { academicYearId, dayOfWeek, slotIndex, sectionId }
        });
        if (sectionConflict) {
            throw new exceptions_1.BadRequestException(`Conflict detected: Student ${sectionName} already has ${subjectName} or another class scheduled during ${dayOfWeek} Period ${slotIndex}.`);
        }
        // Create slot
        const slot = await prisma_1.prisma.timetableSlot.create({
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
    async deleteSlot(id) {
        const exists = await prisma_1.prisma.timetableSlot.findUnique({ where: { id } });
        if (!exists)
            throw new exceptions_1.NotFoundException('Timetable slot not found');
        await prisma_1.prisma.timetableSlot.delete({ where: { id } });
        return { success: true };
    }
    /**
     * Scheduling preview. This endpoint must never delete or mutate the live
     * timetable. A real optimizer can consume configured period/workload policy
     * later; until then we return the authoritative inputs and conflicts only.
     */
    async generateAIDraft(departmentId, semesterId, academicYearId) {
        const subjects = await prisma_1.prisma.subject.findMany({ where: { departmentId, semesterId } });
        const faculties = await prisma_1.prisma.faculty.findMany({ where: { departmentId } });
        const sections = await prisma_1.prisma.section.findMany({ where: { semesterId } });
        if (subjects.length === 0 || faculties.length === 0 || sections.length === 0) {
            throw new exceptions_1.BadRequestException('No subjects, faculty, or sections configured for this department/semester');
        }
        const existingSlots = await prisma_1.prisma.timetableSlot.findMany({
            where: { departmentId, semesterId, academicYearId },
            select: { id: true, dayOfWeek: true, slotIndex: true, facultyId: true, sectionId: true, roomNo: true },
        });
        return {
            mode: 'PREVIEW_ONLY',
            applied: false,
            message: 'No live timetable was changed. Configure institution period and workload policies before generating an allocatable draft.',
            inputs: {
                subjectCount: subjects.length,
                facultyCount: faculties.length,
                sectionCount: sections.length,
                existingSlotCount: existingSlots.length,
            },
            existingSlots,
        };
    }
}
exports.TimetableService = TimetableService;
//# sourceMappingURL=timetable.service.js.map