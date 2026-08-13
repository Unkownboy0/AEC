"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const prisma_1 = require("../../lib/prisma");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const student_access_service_1 = require("../security/student-access.service");
const notification_service_1 = require("../notifications/notification.service");
class ChatController {
    // ─── Search Students Autocomplete ─────────────────────────────────────────
    searchStudents = async (req, res, next) => {
        try {
            const user = req.user;
            const q = String(req.query.q || '').trim();
            const normalizedRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
            if (normalizedRole === 'STUDENT' || normalizedRole === 'PARENT') {
                return res.status(200).json({ status: 'success', data: [], totalAssignments: 0 });
            }
            const visibilityWhere = await student_access_service_1.StudentAccessService.visibleStudentWhere({ id: user.id, role: user.role });
            const studentWhere = { AND: [visibilityWhere] };
            if (q) {
                studentWhere.AND.push({
                    OR: [
                        { admissionNo: { contains: q, mode: 'insensitive' } },
                        { firstName: { contains: q, mode: 'insensitive' } },
                        { lastName: { contains: q, mode: 'insensitive' } },
                    ]
                });
            }
            const students = await prisma_1.prisma.student.findMany({
                where: studentWhere,
                include: {
                    department: { select: { name: true } },
                    program: { select: { name: true } },
                    semester: { select: { name: true } },
                    section: { select: { name: true } },
                    mentor: { select: { firstName: true, lastName: true } },
                    user: { select: { profilePhoto: true } }
                },
                take: 15,
            });
            const formatted = students.map((s) => ({
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                registerNo: s.admissionNo,
                admissionNo: s.admissionNo,
                rollNo: s.admissionNo,
                profilePhoto: s.user?.profilePhoto || null,
                department: s.department?.name || null,
                program: s.program?.name || null,
                semester: s.semester?.name || null,
                section: s.section?.name || null,
                mentorName: s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : null,
            }));
            res.status(200).json({ status: 'success', data: formatted, totalAssignments: formatted.length });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── List Available Faculty for Student ──────────────────────────────────
    listAvailableFaculty = async (req, res, next) => {
        try {
            const user = req.user;
            const student = await prisma_1.prisma.student.findFirst({
                where: { userId: user.id },
                select: { id: true, mentorId: true, sectionId: true, semesterId: true, departmentId: true }
            });
            if (!student) {
                return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
            }
            // Query all faculty members
            const authorizedFaculty = [
                { departmentId: student.departmentId },
                {
                    subjectAssignments: {
                        some: {
                            OR: [
                                { sectionId: student.sectionId },
                                { semesterId: student.semesterId }
                            ]
                        }
                    }
                }
            ];
            if (student.mentorId)
                authorizedFaculty.push({ id: student.mentorId });
            const facultyList = await prisma_1.prisma.faculty.findMany({
                where: {
                    deleted: false,
                    OR: authorizedFaculty
                },
                include: {
                    department: { select: { name: true } },
                    user: { select: { profilePhoto: true } }
                }
            });
            const formatted = facultyList.map(f => ({
                id: f.id,
                name: `${f.firstName} ${f.lastName}`,
                designation: f.designation,
                department: f.department?.name || null,
                profilePhoto: f.user?.profilePhoto || null,
                isMentor: f.id === student.mentorId
            }));
            res.status(200).json({ status: 'success', data: formatted });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Get Active Conversations ──────────────────────────────────────────────
    listConversations = async (req, res, next) => {
        try {
            const user = req.user;
            let facultyId = null;
            let studentId = null;
            let assignedStudentIds = [];
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (!stud)
                    return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
                studentId = stud.id;
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                if (!fac)
                    return res.status(404).json({ status: 'error', message: 'Faculty profile not found.' });
                facultyId = fac.id;
                const visibilityWhere = await student_access_service_1.StudentAccessService.visibleStudentWhere({ id: user.id, role: user.role });
                const visibleStudents = await prisma_1.prisma.student.findMany({ where: visibilityWhere, select: { id: true } });
                assignedStudentIds = visibleStudents.map((student) => student.id);
            }
            const where = {};
            if (user.role === 'Student') {
                where.studentId = studentId;
                where.deletedByStudent = false;
            }
            else {
                where.facultyId = facultyId;
                where.studentId = { in: assignedStudentIds };
                where.deletedByFaculty = false;
            }
            // Query all messages for the current user
            const messages = await prisma_1.prisma.chatMessage.findMany({
                where,
                orderBy: { sentTime: 'desc' }
            });
            // Group by conversationId
            const conversationIds = Array.from(new Set(messages.map(m => m.conversationId)));
            const conversations = [];
            for (const cid of conversationIds) {
                const chatMsgs = messages.filter(m => m.conversationId === cid);
                const lastMsg = chatMsgs[0];
                const unreadCount = chatMsgs.filter(m => {
                    if (user.role === 'Student') {
                        return m.receiverRole === 'Student' && m.status !== 'READ';
                    }
                    else {
                        return m.receiverRole === 'Faculty' && m.status !== 'READ';
                    }
                }).length;
                // Load metadata for the participant
                let participant = null;
                if (user.role === 'Student') {
                    // Participant is Faculty
                    const fac = await prisma_1.prisma.faculty.findUnique({
                        where: { id: lastMsg.facultyId },
                        include: { department: true, user: { select: { profilePhoto: true, presence: true } } }
                    });
                    if (fac) {
                        participant = {
                            id: fac.id,
                            name: `${fac.firstName} ${fac.lastName}`,
                            role: 'Faculty',
                            profilePhoto: fac.user?.profilePhoto || null,
                            designation: fac.designation,
                            department: fac.department?.name || null,
                            employeeId: fac.employeeId || null,
                            online: fac.user?.presence?.status === 'ONLINE'
                        };
                    }
                }
                else {
                    // Participant is Student
                    const stud = await prisma_1.prisma.student.findUnique({
                        where: { id: lastMsg.studentId },
                        include: { department: true, semester: true, section: true, user: { select: { profilePhoto: true, presence: true } } }
                    });
                    if (stud) {
                        participant = {
                            id: stud.id,
                            name: `${stud.firstName} ${stud.lastName}`,
                            role: 'Student',
                            profilePhoto: stud.user?.profilePhoto || null,
                            registerNo: stud.admissionNo,
                            department: stud.department?.name || null,
                            semester: stud.semester?.name || null,
                            section: stud.section?.name || null,
                            online: stud.user?.presence?.status === 'ONLINE'
                        };
                    }
                }
                if (participant) {
                    conversations.push({
                        conversationId: cid,
                        participant,
                        lastMessage: {
                            id: lastMsg.id,
                            subject: lastMsg.subject,
                            message: lastMsg.message,
                            sentTime: lastMsg.sentTime,
                            senderRole: lastMsg.senderRole,
                            status: lastMsg.status,
                            attachmentType: lastMsg.attachmentType
                        },
                        unreadCount
                    });
                }
            }
            res.status(200).json({ status: 'success', data: conversations });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Get Message History ──────────────────────────────────────────────────
    getMessages = async (req, res, next) => {
        try {
            const user = req.user;
            const { conversationId } = req.params;
            // 1. Resolve logged-in profiles
            let facultyId = null;
            let studentId = null;
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (stud)
                    studentId = stud.id;
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                if (fac)
                    facultyId = fac.id;
            }
            // Verify authorization before reading any messages.
            if (facultyId) {
                const parts = conversationId.split('_');
                const cidFacultyId = parts[0];
                const cidStudentId = parts[1];
                if (cidFacultyId !== facultyId) {
                    return res.status(403).json({ status: 'error', message: 'You are not authorized to access this conversation.' });
                }
                await student_access_service_1.StudentAccessService.assertCanViewStudent({ id: user.id, role: user.role }, cidStudentId);
            }
            else if (user.role === 'Student' && studentId) {
                const parts = conversationId.split('_');
                const cidStudentId = parts[1];
                if (cidStudentId !== studentId) {
                    return res.status(403).json({ status: 'error', message: 'You are not authorized to access this conversation.' });
                }
            }
            else {
                return res.status(403).json({ status: 'error', message: "You don't have permission to view this conversation." });
            }
            const messages = await prisma_1.prisma.chatMessage.findMany({
                where: {
                    conversationId,
                    OR: [
                        { facultyId: facultyId || undefined, deletedByFaculty: false },
                        { studentId: studentId || undefined, deletedByStudent: false },
                    ]
                },
                orderBy: { sentTime: 'asc' }
            });
            // Mark unread messages as read
            const unread = messages.filter(m => {
                if (user.role === 'Student') {
                    return m.receiverRole === 'Student' && m.status !== 'READ';
                }
                else {
                    return m.receiverRole === 'Faculty' && m.status !== 'READ';
                }
            });
            if (unread.length > 0) {
                await prisma_1.prisma.chatMessage.updateMany({
                    where: { id: { in: unread.map(m => m.id) } },
                    data: { status: 'READ', readTime: new Date() }
                });
                // Update local objects status
                unread.forEach(m => {
                    m.status = 'READ';
                    m.readTime = new Date();
                });
            }
            res.status(200).json({ status: 'success', data: messages });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Send Message ─────────────────────────────────────────────────────────
    sendMessage = async (req, res, next) => {
        try {
            const user = req.user;
            const { recipientId, subject, message, priority, attachmentBase64, attachmentName } = req.body;
            if (!message && !attachmentBase64) {
                return res.status(400).json({ status: 'error', message: 'Message content or attachment is required.' });
            }
            let facultyId = '';
            let studentId = '';
            let senderRole = '';
            let receiverRole = '';
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (!stud)
                    return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
                studentId = stud.id;
                facultyId = recipientId;
                senderRole = 'Student';
                receiverRole = 'Faculty';
                // Verify recipient is a valid Faculty member
                const facultyExists = await prisma_1.prisma.faculty.findUnique({ where: { id: facultyId } });
                if (!facultyExists) {
                    return res.status(400).json({ status: 'error', message: 'Invalid faculty recipient.' });
                }
                // Verify Student can only message/reply to authorized Mentor/Faculty
                const isAssignedMentor = stud.mentorId === facultyId || (await prisma_1.prisma.mentorAssignment.findFirst({
                    where: { mentorId: facultyId, studentId: stud.id, status: 'ACTIVE' }
                }));
                // Subject assignments check
                const assignments = await prisma_1.prisma.subjectAssignment.findMany({
                    where: { facultyId },
                    select: { sectionId: true, semesterId: true }
                });
                const assignedSectionIds = assignments.map(a => a.sectionId);
                const assignedSemesterIds = assignments.map(a => a.semesterId);
                const isClassTeacher = assignedSectionIds.includes(stud.sectionId || '') || assignedSemesterIds.includes(stud.semesterId || '');
                if (!isAssignedMentor && !isClassTeacher) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Access Denied: Students can only message or reply to their assigned mentors or class faculty.'
                    });
                }
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                if (!fac)
                    return res.status(404).json({ status: 'error', message: 'Faculty profile not found.' });
                facultyId = fac.id;
                studentId = recipientId;
                senderRole = 'Faculty';
                receiverRole = 'Student';
                // Resolve student
                const student = await prisma_1.prisma.student.findUnique({ where: { id: studentId } });
                if (!student) {
                    return res.status(400).json({ status: 'error', message: 'Invalid student recipient.' });
                }
                await student_access_service_1.StudentAccessService.assertCanViewStudent({ id: user.id, role: user.role }, studentId);
            }
            // Process base64 attachment if provided
            let attachmentUrl = null;
            let attachmentType = null;
            if (attachmentBase64 && attachmentName) {
                const base64Str = attachmentBase64.split(';base64,').pop();
                const buffer = Buffer.from(base64Str, 'base64');
                if (buffer.length > 25 * 1024 * 1024) {
                    return res.status(400).json({ status: 'error', message: 'Attachment exceeds the 25 MB limit.' });
                }
                const uploadDir = path_1.default.join(process.cwd(), 'uploads/chat');
                if (!fs_1.default.existsSync(uploadDir)) {
                    fs_1.default.mkdirSync(uploadDir, { recursive: true });
                }
                const ext = path_1.default.extname(attachmentName) || '.bin';
                const fileName = `chat_${(0, crypto_1.randomUUID)()}${ext}`;
                const filePath = path_1.default.join(uploadDir, fileName);
                fs_1.default.writeFileSync(filePath, buffer);
                attachmentUrl = `/uploads/chat/${fileName}`;
                attachmentType = ext.substring(1).toUpperCase();
            }
            // Generate deterministic conversationId unique to this Faculty-Student pair
            const conversationId = `${facultyId}_${studentId}`;
            const chatMsg = await prisma_1.prisma.chatMessage.create({
                data: {
                    conversationId,
                    facultyId,
                    studentId,
                    senderRole,
                    receiverRole,
                    subject: subject || null,
                    message: message || '',
                    attachmentUrl,
                    attachmentType,
                    priority: priority || 'NORMAL',
                    status: 'SENT'
                }
            });
            // Write System In-App Notification triggers
            let notificationRecipientUserId = '';
            if (user.role === 'Student') {
                const f = await prisma_1.prisma.faculty.findUnique({ where: { id: facultyId }, select: { userId: true } });
                notificationRecipientUserId = f?.userId || '';
            }
            else {
                const s = await prisma_1.prisma.student.findUnique({ where: { id: studentId }, select: { userId: true } });
                notificationRecipientUserId = s?.userId || '';
            }
            if (notificationRecipientUserId) {
                await notification_service_1.NotificationService.sendNotification({
                    recipientId: notificationRecipientUserId,
                    eventType: 'MESSAGE_RECEIVED',
                    title: `New Message from ${user.firstName}`,
                    message: message ? (message.substring(0, 50) + (message.length > 50 ? '...' : '')) : 'Sent an attachment.',
                    relatedEntityType: 'CHAT_MESSAGE',
                    relatedEntityId: chatMsg.id,
                    deepLinkRoute: `/chat/${conversationId}`
                });
            }
            res.status(201).json({ status: 'success', data: chatMsg });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Edit Message (Sender only, before read) ──────────────────────────────
    editMessage = async (req, res, next) => {
        try {
            const user = req.user;
            const { messageId } = req.params;
            const { message } = req.body;
            const chatMsg = await prisma_1.prisma.chatMessage.findUnique({ where: { id: messageId } });
            if (!chatMsg) {
                return res.status(404).json({ status: 'error', message: 'Message not found.' });
            }
            // Verify sender
            let isSender = false;
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                isSender = stud?.id === chatMsg.studentId && chatMsg.senderRole === 'Student';
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                isSender = fac?.id === chatMsg.facultyId && chatMsg.senderRole === 'Faculty';
            }
            if (!isSender) {
                return res.status(403).json({ status: 'error', message: 'You can only edit your own messages.' });
            }
            // Prevent editing if already read
            if (chatMsg.status === 'READ') {
                return res.status(400).json({ status: 'error', message: 'Cannot edit message after it has been read.' });
            }
            const updated = await prisma_1.prisma.chatMessage.update({
                where: { id: messageId },
                data: { message: message || '' }
            });
            res.status(200).json({ status: 'success', data: updated });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Delete Message (Soft Delete) ─────────────────────────────────────────
    deleteMessage = async (req, res, next) => {
        try {
            const user = req.user;
            const { messageId } = req.params;
            const chatMsg = await prisma_1.prisma.chatMessage.findUnique({ where: { id: messageId } });
            if (!chatMsg) {
                return res.status(404).json({ status: 'error', message: 'Message not found.' });
            }
            // Verify participant
            let isParticipant = false;
            let facultyId = null;
            let studentId = null;
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (stud) {
                    studentId = stud.id;
                    isParticipant = chatMsg.studentId === stud.id;
                }
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                if (fac) {
                    facultyId = fac.id;
                    isParticipant = chatMsg.facultyId === fac.id;
                }
            }
            if (!isParticipant) {
                return res.status(403).json({ status: 'error', message: 'You are not authorized to delete this message.' });
            }
            if (user.role === 'Student' && studentId) {
                await prisma_1.prisma.chatMessage.update({
                    where: { id: messageId },
                    data: { deletedByStudent: true }
                });
            }
            else if (facultyId) {
                await prisma_1.prisma.chatMessage.update({
                    where: { id: messageId },
                    data: { deletedByFaculty: true }
                });
            }
            res.status(200).json({ status: 'success', message: 'Message soft-deleted successfully.' });
        }
        catch (err) {
            next(err);
        }
    };
    // ─── Forward Message ──────────────────────────────────────────────────────
    forwardMessage = async (req, res, next) => {
        try {
            const user = req.user;
            const { messageId } = req.params;
            const { recipientId } = req.body;
            const chatMsg = await prisma_1.prisma.chatMessage.findUnique({ where: { id: messageId } });
            if (!chatMsg)
                return res.status(404).json({ status: 'error', message: 'Source message not found.' });
            // Create cloned message for new recipient
            let facultyId = '';
            let studentId = '';
            let senderRole = '';
            let receiverRole = '';
            if (user.role === 'Student') {
                const stud = await prisma_1.prisma.student.findFirst({ where: { userId: user.id } });
                if (!stud)
                    return res.status(404).json({ status: 'error', message: 'Student profile not found.' });
                studentId = stud.id;
                facultyId = recipientId;
                senderRole = 'Student';
                receiverRole = 'Faculty';
            }
            else {
                const fac = await prisma_1.prisma.faculty.findFirst({ where: { userId: user.id } });
                if (!fac)
                    return res.status(404).json({ status: 'error', message: 'Faculty profile not found.' });
                facultyId = fac.id;
                studentId = recipientId;
                senderRole = 'Faculty';
                receiverRole = 'Student';
            }
            const conversationId = `${facultyId}_${studentId}`;
            const forwarded = await prisma_1.prisma.chatMessage.create({
                data: {
                    conversationId,
                    facultyId,
                    studentId,
                    senderRole,
                    receiverRole,
                    subject: chatMsg.subject,
                    message: chatMsg.message,
                    attachmentUrl: chatMsg.attachmentUrl,
                    attachmentType: chatMsg.attachmentType,
                    priority: chatMsg.priority,
                    status: 'SENT'
                }
            });
            res.status(201).json({ status: 'success', data: forwarded });
        }
        catch (err) {
            next(err);
        }
    };
}
exports.ChatController = ChatController;
//# sourceMappingURL=chat.controller.js.map