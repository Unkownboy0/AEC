"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableController = void 0;
const timetable_service_1 = require("./timetable.service");
const prisma_1 = require("../../lib/prisma");
class TimetableController {
    service = new timetable_service_1.TimetableService();
    listSlots = async (req, res, next) => {
        try {
            const data = await this.service.listSlots(req.query);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    createSlot = async (req, res, next) => {
        try {
            const data = await this.service.createSlot(req.body);
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    deleteSlot = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.service.deleteSlot(id);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    generateAIDraft = async (req, res, next) => {
        try {
            const { departmentId, semesterId, academicYearId } = req.body;
            const data = await this.service.generateAIDraft(departmentId, semesterId, academicYearId);
            res.status(200).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    facultyCreateSlot = async (req, res, next) => {
        try {
            const user = req.user;
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (!faculty) {
                return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
            }
            req.body.facultyId = faculty.id;
            const data = await this.service.createSlot(req.body);
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: user.id,
                    action: 'CREATE',
                    module: 'TIMETABLE',
                    description: `Faculty manually added timetable slot for Day ${req.body.dayOfWeek} Period ${req.body.slotIndex}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            res.status(201).json({ status: 'success', data });
        }
        catch (error) {
            next(error);
        }
    };
    facultyUpdateSlot = async (req, res, next) => {
        try {
            const user = req.user;
            const { id } = req.params;
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (!faculty) {
                return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
            }
            const slot = await prisma_1.prisma.timetableSlot.findUnique({ where: { id } });
            if (!slot) {
                return res.status(404).json({ status: 'error', message: 'Timetable slot not found.' });
            }
            if (slot.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
                return res.status(403).json({ status: 'error', message: 'You can only update your own timetable slots.' });
            }
            const { dayOfWeek, slotIndex, startTime, endTime, roomNo, subjectId, sectionId, semesterId, academicYearId, departmentId } = req.body;
            if (slotIndex || dayOfWeek || roomNo) {
                const checkIndex = slotIndex || slot.slotIndex;
                const checkDay = dayOfWeek || slot.dayOfWeek;
                const checkRoom = roomNo || slot.roomNo;
                const checkYear = academicYearId || slot.academicYearId;
                if (roomNo && roomNo !== slot.roomNo) {
                    const roomConflict = await prisma_1.prisma.timetableSlot.findFirst({
                        where: { id: { not: id }, academicYearId: checkYear, dayOfWeek: checkDay, slotIndex: checkIndex, roomNo: checkRoom }
                    });
                    if (roomConflict) {
                        return res.status(400).json({ status: 'error', message: `Conflict: Room ${checkRoom} is occupied during Period ${checkIndex}.` });
                    }
                }
            }
            const updated = await prisma_1.prisma.timetableSlot.update({
                where: { id },
                data: {
                    dayOfWeek,
                    slotIndex,
                    startTime,
                    endTime,
                    roomNo,
                    subjectId,
                    sectionId,
                    semesterId,
                    academicYearId,
                    departmentId
                },
                include: {
                    subject: true,
                    section: true,
                    semester: true
                }
            });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: user.id,
                    action: 'UPDATE',
                    module: 'TIMETABLE',
                    description: `Updated timetable slot ${id}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            res.status(200).json({ status: 'success', data: updated });
        }
        catch (error) {
            next(error);
        }
    };
    facultyDeleteSlot = async (req, res, next) => {
        try {
            const user = req.user;
            const { id } = req.params;
            const faculty = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
            if (!faculty) {
                return res.status(403).json({ status: 'error', message: 'Faculty profile not found.' });
            }
            const slot = await prisma_1.prisma.timetableSlot.findUnique({ where: { id } });
            if (!slot) {
                return res.status(404).json({ status: 'error', message: 'Timetable slot not found.' });
            }
            if (slot.facultyId !== faculty.id && user.role !== 'Super Admin' && user.role !== 'HOD') {
                return res.status(403).json({ status: 'error', message: 'You can only delete your own timetable slots.' });
            }
            await prisma_1.prisma.timetableSlot.delete({ where: { id } });
            await prisma_1.prisma.userActivityLog.create({
                data: {
                    userId: user.id,
                    action: 'DELETE',
                    module: 'TIMETABLE',
                    description: `Deleted timetable slot ${id}`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent']
                }
            });
            res.status(200).json({ status: 'success', message: 'Timetable slot deleted successfully.' });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Submit timetable for Academic Dean review
     */
    submitForReview = async (req, res, next) => {
        try {
            const { departmentId, semesterId, academicYearId } = req.body;
            const record = await prisma_1.prisma.timetablePublish.upsert({
                where: { id: `${departmentId}_${semesterId}_${academicYearId}` },
                update: { status: 'HOD_REVIEW' },
                create: {
                    id: `${departmentId}_${semesterId}_${academicYearId}`,
                    departmentId,
                    semesterId,
                    academicYearId,
                    status: 'HOD_REVIEW'
                }
            });
            res.status(200).json({ status: 'success', data: record });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Review timetable (Dean approval/rejection)
     */
    reviewTimetable = async (req, res, next) => {
        try {
            const { id } = req.params; // compound id e.g. `${departmentId}_${semesterId}_${academicYearId}`
            const { status } = req.body; // 'DEAN_APPROVED' or 'DRAFT'
            const record = await prisma_1.prisma.timetablePublish.update({
                where: { id },
                data: { status }
            });
            res.status(200).json({ status: 'success', data: record });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Publish approved timetable
     */
    publishTimetable = async (req, res, next) => {
        try {
            const { id } = req.params;
            const record = await prisma_1.prisma.timetablePublish.update({
                where: { id },
                data: {
                    status: 'PUBLISHED',
                    publishedAt: new Date()
                }
            });
            res.status(200).json({ status: 'success', data: record });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get current publish status of department timetable
     */
    getPublishStatus = async (req, res, next) => {
        try {
            const { departmentId, semesterId, academicYearId } = req.query;
            const record = await prisma_1.prisma.timetablePublish.findUnique({
                where: { id: `${departmentId}_${semesterId}_${academicYearId}` }
            });
            res.status(200).json({ status: 'success', data: record || { status: 'DRAFT' } });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.TimetableController = TimetableController;
//# sourceMappingURL=timetable.controller.js.map