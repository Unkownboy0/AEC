import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { StudentAccessService } from '../security/student-access.service';
import { NotificationService } from '../notifications/notification.service';
import { profileImageDescriptor } from '../users/profile-media.service';
import { logger } from '../../utils/logger';

export class ChatController {
  // ─── Search Students Autocomplete (Legacy Support) ─────────────────────────
  searchStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const q = String(req.query.q || '').trim();

      const normalizedRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (normalizedRole === 'STUDENT' || normalizedRole === 'PARENT') {
        return res.status(200).json({ status: 'success', data: [], totalAssignments: 0 });
      }

      const visibilityWhere = await StudentAccessService.visibleStudentWhere({ id: user.id, role: user.role });
      const studentWhere: any = { AND: [visibilityWhere] };
      if (q) {
        studentWhere.AND.push({
          OR: [
            { admissionNo: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ]
        });
      }

      const students = await prisma.student.findMany({
        where: studentWhere,
        include: {
          department: { select: { name: true } },
          program: { select: { name: true } },
          semester: { select: { name: true } },
          section: { select: { name: true } },
          mentor: { select: { firstName: true, lastName: true } },
          user: { select: { id: true, profilePhoto: true, profileImageFileId: true, profileImageFile: true } }
        },
        take: 15,
      });

      const formatted = (students as any[]).map((s: any) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        registerNo: s.admissionNo,
        admissionNo: s.admissionNo,
        rollNo: s.admissionNo,
        profilePhoto: s.user ? profileImageDescriptor(s.user).url : null,
        profileImage: s.user ? profileImageDescriptor(s.user) : null,
        gender: s.gender,
        department: s.department?.name || null,
        program: s.program?.name || null,
        semester: s.semester?.name || null,
        section: s.section?.name || null,
        mentorName: s.mentor ? `${s.mentor.firstName} ${s.mentor.lastName}` : null,
      }));

      res.status(200).json({ status: 'success', data: formatted, totalAssignments: formatted.length });
    } catch (err) {
      next(err);
    }
  };

  // ─── List Available Faculty (Legacy Support) ──────────────────────────────
  listAvailableFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      const student = await prisma.student.findFirst({
        where: { userId: user.id },
        select: { id: true, mentorId: true, sectionId: true, semesterId: true, departmentId: true }
      });
      if (!student) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const authorizedFaculty: any[] = [
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
      if (student.mentorId) authorizedFaculty.push({ id: student.mentorId });

      const facultyList = await prisma.faculty.findMany({
        where: {
          deleted: false,
          OR: authorizedFaculty
        },
        include: {
          department: { select: { name: true } },
          user: { select: { id: true, profilePhoto: true, profileImageFileId: true, profileImageFile: true } }
        }
      });

      const formatted = facultyList.map(f => ({
        id: f.id,
        name: `${f.firstName} ${f.lastName}`,
        designation: f.designation,
        department: f.department?.name || null,
        profilePhoto: f.user ? profileImageDescriptor(f.user).url : null,
        profileImage: f.user ? profileImageDescriptor(f.user) : null,
        gender: f.gender,
        isMentor: f.id === student.mentorId
      }));

      res.status(200).json({ status: 'success', data: formatted });
    } catch (err) {
      next(err);
    }
  };

  // ─── Search Scoped Recipients (New autocomplete) ──────────────────────────
  searchRecipients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const q = String(req.query.q || '').trim();

      const normalizedRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');

      // Apply ABAC search filtering:
      if (normalizedRole === 'STUDENT') {
        const student = await prisma.student.findFirst({
          where: { userId: user.id },
          select: { id: true, mentorId: true, sectionId: true, semesterId: true, departmentId: true }
        });
        if (!student) return res.status(200).json({ status: 'success', data: [] });

        // Allowed recipients: mentor, faculty assigned to section/semester, classmates (same section)
        const mentorFilter = student.mentorId ? [{ id: student.mentorId }] : [];
        const classmates = await prisma.student.findMany({
          where: {
            sectionId: student.sectionId,
            id: { not: student.id },
            deleted: false,
            ...(q ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } }
              ]
            } : {})
          },
          include: { user: true },
          take: 10
        });

        const facultyList = await prisma.faculty.findMany({
          where: {
            deleted: false,
            OR: [
              { departmentId: student.departmentId },
              { subjectAssignments: { some: { OR: [{ sectionId: student.sectionId }, { semesterId: student.semesterId }] } } },
              ...mentorFilter
            ],
            ...(q ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } }
              ]
            } : {})
          },
          include: { user: true },
          take: 10
        });

        const formatted = [
          ...classmates.map(c => ({
            id: c.userId,
            name: `${c.firstName} ${c.lastName}`,
            role: 'Student',
            profilePhoto: c.user ? profileImageDescriptor(c.user).url : null,
            context: 'Classmate'
          })),
          ...facultyList.map(f => ({
            id: f.userId,
            name: `${f.firstName} ${f.lastName}`,
            role: 'Faculty',
            profilePhoto: f.user ? profileImageDescriptor(f.user).url : null,
            context: f.id === student.mentorId ? 'Mentor' : (f.designation || 'Faculty')
          }))
        ];

        return res.status(200).json({ status: 'success', data: formatted });
      }

      if (normalizedRole === 'PARENT') {
        const parent = await prisma.parentProfile.findFirst({
          where: { userId: user.id },
          include: { students: { include: { student: true } } }
        });
        if (!parent || !parent.students.length) return res.status(200).json({ status: 'success', data: [] });

        const child = parent.students[0].student;
        const mentorFilter = child.mentorId ? [{ id: child.mentorId }] : [];

        const staff = await prisma.faculty.findMany({
          where: {
            deleted: false,
            OR: [
              { departmentId: child.departmentId },
              { subjectAssignments: { some: { OR: [{ sectionId: child.sectionId }, { semesterId: child.semesterId }] } } },
              ...mentorFilter
            ],
            ...(q ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } }
              ]
            } : {})
          },
          include: { user: true },
          take: 10
        });

        const formatted = staff.map(f => ({
          id: f.userId,
          name: `${f.firstName} ${f.lastName}`,
          role: 'Faculty',
          profilePhoto: f.user ? profileImageDescriptor(f.user).url : null,
          context: `Child's Faculty`
        }));

        return res.status(200).json({ status: 'success', data: formatted });
      }

      // Faculty, Mentor, HOD, and Leadership search scopes
      const searchConditions: any[] = [];
      if (q) {
        searchConditions.push({
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } }
          ]
        });
      }

      const facultyWhere: any = { deleted: false, AND: searchConditions };
      const studentWhere: any = { deleted: false, AND: searchConditions };

      if (normalizedRole === 'FACULTY' || normalizedRole === 'MENTOR') {
        const fac = await prisma.faculty.findFirst({ where: { userId: user.id } });
        if (fac) {
          // Limit to department or subject assignment scopes
          facultyWhere.departmentId = fac.departmentId;
        }
      }

      const [faculties, students] = await Promise.all([
        prisma.faculty.findMany({
          where: facultyWhere,
          include: { user: true, department: true },
          take: 15
        }),
        prisma.student.findMany({
          where: studentWhere,
          include: { user: true, department: true, section: true },
          take: 15
        })
      ]);

      const formatted = [
        ...faculties.map(f => ({
          id: f.userId,
          name: `${f.firstName} ${f.lastName}`,
          role: 'Faculty',
          profilePhoto: f.user ? profileImageDescriptor(f.user).url : null,
          context: f.department?.name || 'Academic staff'
        })),
        ...students.map(s => ({
          id: s.userId,
          name: `${s.firstName} ${s.lastName}`,
          role: 'Student',
          profilePhoto: s.user ? profileImageDescriptor(s.user).url : null,
          context: s.section ? `${s.department?.name || ''} - ${s.section.name}` : (s.department?.name || 'Student')
        }))
      ];

      res.status(200).json({ status: 'success', data: formatted });
    } catch (err) {
      next(err);
    }
  };

  // ─── Get Active Conversations ──────────────────────────────────────────────
  listConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Find all conversations where the logged-in user is a participant
      const participants = await prisma.conversationParticipant.findMany({
        where: { userId: user.id },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: true
                }
              },
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  attachments: true,
                  sender: true
                }
              }
            }
          }
        }
      });

      const conversations = await Promise.all(
        participants.map(async (part) => {
          const conv = part.conversation;
          const lastMsg = conv.messages[0];

          let title = conv.title;
          let avatar = conv.avatar;
          let participantDetails: any = null;

          if (conv.type === 'ONE_TO_ONE') {
            const other = conv.participants.find((p) => p.userId !== user.id);
            if (other) {
              const details = other.user;
              title = [details.firstName, details.lastName].filter(Boolean).join(' ') || 'User';
              avatar = profileImageDescriptor(details).url;
              participantDetails = {
                id: details.id,
                name: title,
                role: details.roleId ? 'Faculty' : 'Student', // General representation
                profilePhoto: avatar,
                profileImage: profileImageDescriptor(details)
              };
            }
          }

          // Count unread messages (created after user's lastReadAt and not sent by user)
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: user.id },
              createdAt: { gt: part.lastReadAt || new Date(0) }
            }
          });

          return {
            conversationId: conv.id,
            type: conv.type,
            title: title || 'Group Chat',
            avatar: avatar || null,
            participant: participantDetails,
            unreadCount,
            lastMessage: lastMsg ? {
              id: lastMsg.id,
              message: lastMsg.content,
              sentTime: lastMsg.createdAt,
              senderRole: lastMsg.senderId === user.id ? 'Outgoing' : 'Incoming',
              senderName: [lastMsg.sender.firstName, lastMsg.sender.lastName].filter(Boolean).join(' ') || 'User',
              attachmentType: lastMsg.attachments[0]?.mimeType || null
            } : null
          };
        })
      );

      res.status(200).json({ status: 'success', data: conversations });
    } catch (err) {
      next(err);
    }
  };

  // ─── Get Conversation Details ──────────────────────────────────────────────
  getConversationDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId } = req.params;

      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id }
      });
      if (!participant) {
        return res.status(403).json({ status: 'error', message: 'You are not a member of this conversation.' });
      }

      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: true
            }
          }
        }
      });
      if (!conv) {
        return res.status(404).json({ status: 'error', message: 'Conversation not found.' });
      }

      let title = conv.title;
      let avatar = conv.avatar;

      if (conv.type === 'ONE_TO_ONE') {
        const other = conv.participants.find((p) => p.userId !== user.id);
        if (other) {
          title = [other.user.firstName, other.user.lastName].filter(Boolean).join(' ') || 'User';
          avatar = profileImageDescriptor(other.user).url;
        }
      }

      const members = conv.participants.map((p) => ({
        id: p.userId,
        name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'User',
        role: p.role, // 'ADMIN' or 'MEMBER'
        roleName: p.user.roleId ? 'Faculty' : 'Student',
        profilePhoto: profileImageDescriptor(p.user).url
      }));

      res.status(200).json({
        status: 'success',
        data: {
          id: conv.id,
          type: conv.type,
          title,
          description: conv.description,
          avatar,
          createdBy: conv.createdBy,
          members
        }
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── Get Message History ──────────────────────────────────────────────────
  getMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId } = req.params;

      // Verify that the logged-in user is a participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id }
      });
      if (!participant) {
        return res.status(403).json({ status: 'error', message: 'You are not authorized to view this conversation.' });
      }

      const messages = await prisma.message.findMany({
        where: {
          conversationId,
          deletedAt: null
        },
        include: {
          sender: true,
          attachments: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Update participant lastReadAt
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date() }
      });

      // Map back to the client expected schema shape
      const mapped = messages.map((m) => {
        const isStudentSender = m.sender.roleId === null; // Derived heuristic or lookup
        return {
          id: m.id,
          conversationId: m.conversationId,
          message: m.content,
          sentTime: m.createdAt,
          senderId: m.senderId,
          senderName: [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') || 'User',
          senderPhoto: profileImageDescriptor(m.sender).url,
          senderRole: isStudentSender ? 'Student' : 'Faculty',
          attachmentUrl: m.attachments[0]?.fileUrl || null,
          attachmentType: m.attachments[0]?.mimeType || null,
          status: 'READ' // Default read representation
        };
      });

      res.status(200).json({ status: 'success', data: mapped });
    } catch (err) {
      next(err);
    }
  };

  // ─── Send Message (Supports direct & groups) ──────────────────────────────
  sendMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { recipientId, conversationId: reqConvId, message, attachmentBase64, attachmentName } = req.body;

      if (!message && !attachmentBase64) {
        return res.status(400).json({ status: 'error', message: 'Message content or attachment is required.' });
      }

      let conversationId = reqConvId;

      // 1. Resolve or create direct 1:1 conversation
      if (!conversationId && recipientId) {
        const existing = await prisma.conversation.findFirst({
          where: {
            type: 'ONE_TO_ONE',
            participants: { every: { userId: { in: [user.id, recipientId] } } }
          }
        });
        if (existing) {
          conversationId = existing.id;
        } else {
          // Perform Student scopes check before starting direct 1:1 chat:
          if (user.role === 'Student') {
            const student = await prisma.student.findFirst({ where: { userId: user.id } });
            const recipientUser = await prisma.user.findUnique({ where: { id: recipientId } });
            if (!student || !recipientUser) {
              return res.status(400).json({ status: 'error', message: 'Invalid profiles.' });
            }

            // Students can only start 1:1 chats with assigned mentor, class advisor, or subject faculty
            const faculty = await prisma.faculty.findFirst({ where: { userId: recipientId } });
            if (faculty) {
              const isMentor = student.mentorId === faculty.id;
              const assignments = await prisma.subjectAssignment.findMany({ where: { facultyId: faculty.id } });
              const isClassFaculty = assignments.some(a => a.sectionId === student.sectionId || a.semesterId === student.semesterId);
              if (!isMentor && !isClassFaculty) {
                return res.status(403).json({ status: 'error', message: 'Direct communication restricted to assigned faculty.' });
              }
            } else {
              // Check classmates
              const classmate = await prisma.student.findFirst({ where: { userId: recipientId } });
              if (!classmate || classmate.sectionId !== student.sectionId) {
                return res.status(403).json({ status: 'error', message: 'Direct communication restricted to section classmates.' });
              }
            }
          }

          const conv = await prisma.conversation.create({
            data: { type: 'ONE_TO_ONE' }
          });
          await prisma.conversationParticipant.createMany({
            data: [
              { conversationId: conv.id, userId: user.id, role: 'MEMBER' },
              { conversationId: conv.id, userId: recipientId, role: 'MEMBER' }
            ]
          });
          conversationId = conv.id;
        }
      }

      if (!conversationId) {
        return res.status(400).json({ status: 'error', message: 'Conversation identifier is required.' });
      }

      // 2. Verify participation
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id }
      });
      if (!participant) {
        return res.status(403).json({ status: 'error', message: 'You are not authorized to post to this conversation.' });
      }

      // 3. Process attachment if provided
      let attachmentUrl = null;
      let attachmentType = null;
      if (attachmentBase64 && attachmentName) {
        const base64Str = attachmentBase64.split(';base64,').pop();
        const buffer = Buffer.from(base64Str, 'base64');
        if (buffer.length > 25 * 1024 * 1024) {
          return res.status(400).json({ status: 'error', message: 'Attachment exceeds the 25 MB limit.' });
        }

        const uploadDir = path.join(process.cwd(), 'uploads/chat');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const ext = path.extname(attachmentName) || '.bin';
        const fileName = `chat_${randomUUID()}${ext}`;
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);

        attachmentUrl = `/uploads/chat/${fileName}`;
        attachmentType = ext.substring(1).toUpperCase();
      }

      // 4. Create Message
      const msg = await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: message || '',
          type: attachmentUrl ? 'IMAGE' : 'TEXT'
        },
        include: { sender: true }
      });

      if (attachmentUrl) {
        await prisma.messageAttachment.create({
          data: {
            messageId: msg.id,
            fileName: attachmentName || 'file',
            fileUrl: attachmentUrl,
            fileSize: 0, // Inferred as zero or computed buffer length
            mimeType: attachmentType || 'BIN'
          }
        });
      }

      // Mark sender read status
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date() }
      });

      // Get all other participants to notify and broadcast
      const allParticipants = await prisma.conversationParticipant.findMany({
        where: { conversationId, userId: { not: user.id } },
        include: { user: true }
      });

      const conversationDetails = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      const senderName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';

      // 5. Send notifications & Real-time SSE to other members
      for (const p of allParticipants) {
        const isGroup = conversationDetails?.type !== 'ONE_TO_ONE';
        const groupTitle = conversationDetails?.title || 'Group Chat';

        await NotificationService.sendNotification({
          recipientId: p.userId,
          eventType: 'MESSAGE_RECEIVED',
          title: isGroup ? `${groupTitle}` : `Message from ${senderName}`,
          message: isGroup ? `${senderName}: ${message}` : (message ? message.substring(0, 50) : 'Sent an attachment.'),
          relatedEntityType: 'CONVERSATION',
          relatedEntityId: conversationId,
          deepLinkRoute: `/student/messages`
        }).catch(() => {});

        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: p.userId,
            payload: {
              conversationId,
              message: {
                id: msg.id,
                message: msg.content,
                sentTime: msg.createdAt,
                senderId: msg.senderId,
                senderName,
                senderPhoto: profileImageDescriptor(msg.sender).url,
                senderRole: user.roleId === null ? 'Student' : 'Faculty',
                attachmentUrl,
                attachmentType
              }
            }
          });
        } catch (sseErr) {
          logger.warn('SSE broadcast message failed:', sseErr);
        }
      }

      res.status(201).json({
        status: 'success',
        data: {
          id: msg.id,
          conversationId: msg.conversationId,
          message: msg.content,
          sentTime: msg.createdAt,
          senderId: msg.senderId,
          senderName,
          senderPhoto: profileImageDescriptor(msg.sender).url,
          senderRole: user.role === 'Student' ? 'Student' : 'Faculty',
          attachmentUrl,
          attachmentType
        }
      });
    } catch (err) {
      next(err);
    }
  };

  // ─── Create Group (Wizard endpoint) ───────────────────────────────────────
  createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { title, description, avatar, memberUserIds } = req.body;

      if (!title || !memberUserIds || !memberUserIds.length) {
        return res.status(400).json({ status: 'error', message: 'Group title and members are required.' });
      }

      // Creator role-based group checks
      const normalizedRole = String(user.role || '').toUpperCase().replace(/[\s_-]+/g, '');
      if (normalizedRole === 'STUDENT') {
        const creatorStud = await prisma.student.findFirst({ where: { userId: user.id } });
        if (!creatorStud) return res.status(400).json({ status: 'error', message: 'Creator student profile not found.' });

        // Validate that members are within creator's allowed discovery scope
        // Students can only add students from their own section
        for (const uid of memberUserIds) {
          const s = await prisma.student.findFirst({ where: { userId: uid } });
          if (s && s.sectionId !== creatorStud.sectionId) {
            return res.status(403).json({ status: 'error', message: 'Students can only add classmates from their section to groups.' });
          }
        }
      }

      // Create Conversation
      const conv = await prisma.conversation.create({
        data: {
          type: 'GROUP',
          title,
          description: description || null,
          avatar: avatar || null,
          createdBy: user.id
        }
      });

      // Add participants: creator as ADMIN, others as MEMBER
      const participantsData = [
        { conversationId: conv.id, userId: user.id, role: 'ADMIN' },
        ...memberUserIds.map((uid: string) => ({
          conversationId: conv.id,
          userId: uid,
          role: 'MEMBER'
        }))
      ];

      await prisma.conversationParticipant.createMany({ data: participantsData });

      // Create System Message
      const creatorName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          senderId: user.id,
          content: `${creatorName} created group "${title}"`,
          type: 'SYSTEM'
        }
      });

      // Notify and broadcast to everyone added
      for (const uid of memberUserIds) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: uid,
            payload: { conversationId: conv.id }
          });
        } catch (_) {}
      }

      res.status(201).json({ status: 'success', data: conv });
    } catch (err) {
      next(err);
    }
  };

  // ─── Update Group Details ─────────────────────────────────────────────────
  updateGroupDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId } = req.params;
      const { title, description, avatar } = req.body;

      // Verify admin status
      const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id, role: 'ADMIN' }
      });
      if (!adminParticipant) {
        return res.status(403).json({ status: 'error', message: 'Only group administrators can modify group details.' });
      }

      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          avatar: avatar !== undefined ? avatar : undefined
        }
      });

      const updaterName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${updaterName} updated group details`,
          type: 'SYSTEM'
        }
      });

      // Notify members
      const members = await prisma.conversationParticipant.findMany({ where: { conversationId } });
      for (const m of members) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: m.userId,
            payload: { conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  };

  // ─── Add Group Members ────────────────────────────────────────────────────
  addGroupMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId } = req.params;
      const { memberUserIds } = req.body;

      if (!memberUserIds || !memberUserIds.length) {
        return res.status(400).json({ status: 'error', message: 'Member user IDs are required.' });
      }

      const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id, role: 'ADMIN' }
      });
      if (!adminParticipant) {
        return res.status(403).json({ status: 'error', message: 'Only group administrators can add members.' });
      }

      const creatorStud = await prisma.student.findFirst({ where: { userId: user.id } });
      if (creatorStud) {
        // Enforce student scopes check on adding members
        for (const uid of memberUserIds) {
          const s = await prisma.student.findFirst({ where: { userId: uid } });
          if (s && s.sectionId !== creatorStud.sectionId) {
            return res.status(403).json({ status: 'error', message: 'Students can only add section classmates to groups.' });
          }
        }
      }

      // Add participants
      const addedData = memberUserIds.map((uid: string) => ({
        conversationId,
        userId: uid,
        role: 'MEMBER'
      }));

      await prisma.conversationParticipant.createMany({
        data: addedData,
        skipDuplicates: true
      });

      // Log system message
      const adminName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
      const newUsers = await prisma.user.findMany({ where: { id: { in: memberUserIds } } });
      const newNames = newUsers.map(u => [u.firstName, u.lastName].filter(Boolean).join(' ') || 'User').join(', ');

      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${adminName} added ${newNames || 'new members'} to the group`,
          type: 'SYSTEM'
        }
      });

      // Broadcast changes to all members
      const members = await prisma.conversationParticipant.findMany({ where: { conversationId } });
      for (const m of members) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: m.userId,
            payload: { conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', message: 'Members added successfully.' });
    } catch (err) {
      next(err);
    }
  };

  // ─── Remove Group Member ─────────────────────────────────────────────────
  removeGroupMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId, userId } = req.params;

      const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id, role: 'ADMIN' }
      });
      if (!adminParticipant) {
        return res.status(403).json({ status: 'error', message: 'Only group administrators can remove members.' });
      }

      // Delete participant record
      await prisma.conversationParticipant.delete({
        where: { conversationId_userId: { conversationId, userId } }
      });

      // Log system message
      const adminName = user.fullName || `${user.firstName} ${user.lastName}`;
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      const targetName = targetUser ? ([targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') || 'User') : 'Member';

      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${adminName} removed ${targetName}`,
          type: 'SYSTEM'
        }
      });

      // Broadcast to all members (including removed user so they reload)
      const members = await prisma.conversationParticipant.findMany({ where: { conversationId } });
      const broadcastTargets = [...members.map(m => m.userId), userId];

      for (const uid of broadcastTargets) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: uid,
            payload: { conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', message: 'Member removed successfully.' });
    } catch (err) {
      next(err);
    }
  };

  // ─── Promote/Demote Group Admin ───────────────────────────────────────────
  changeGroupMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId, userId } = req.params;
      const { role } = req.body;

      if (role !== 'ADMIN' && role !== 'MEMBER') {
        return res.status(400).json({ status: 'error', message: 'Invalid role assignment.' });
      }

      const adminParticipant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id, role: 'ADMIN' }
      });
      if (!adminParticipant) {
        return res.status(403).json({ status: 'error', message: 'Only group administrators can change member roles.' });
      }

      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { role }
      });

      // Log system message
      const adminName = user.fullName || `${user.firstName} ${user.lastName}`;
      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      const targetName = targetUser ? ([targetUser.firstName, targetUser.lastName].filter(Boolean).join(' ') || 'User') : 'Member';

      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${adminName} updated role of ${targetName} to ${role}`,
          type: 'SYSTEM'
        }
      });

      const members = await prisma.conversationParticipant.findMany({ where: { conversationId } });
      for (const m of members) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: m.userId,
            payload: { conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', message: 'Role updated successfully.' });
    } catch (err) {
      next(err);
    }
  };

  // ─── Leave Group ──────────────────────────────────────────────────────────
  leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { conversationId } = req.params;

      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId: user.id }
      });
      if (!participant) {
        return res.status(400).json({ status: 'error', message: 'You are not a member of this conversation.' });
      }

      // Check if they are admin, and if they are the last admin
      if (participant.role === 'ADMIN') {
        const adminCount = await prisma.conversationParticipant.count({
          where: { conversationId, role: 'ADMIN' }
        });
        if (adminCount === 1) {
          // Promote another member to ADMIN automatically before leaving
          const anotherMember = await prisma.conversationParticipant.findFirst({
            where: { conversationId, userId: { not: user.id } }
          });
          if (anotherMember) {
            await prisma.conversationParticipant.update({
              where: { id: anotherMember.id },
              data: { role: 'ADMIN' }
            });

            const anotherUser = await prisma.user.findUnique({ where: { id: anotherMember.userId } });
            const anotherName = anotherUser ? ([anotherUser.firstName, anotherUser.lastName].filter(Boolean).join(' ') || 'User') : 'Member';

            await prisma.message.create({
              data: {
                conversationId,
                senderId: user.id,
                content: `System promoted ${anotherName} to Administrator`,
                type: 'SYSTEM'
              }
            });
          }
        }
      }

      // Delete participant
      await prisma.conversationParticipant.delete({
        where: { id: participant.id }
      });

      // Log system message
      const leaverName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: `${leaverName} left the group`,
          type: 'SYSTEM'
        }
      });

      // Notify and broadcast to everyone (including the leaver so they reload)
      const members = await prisma.conversationParticipant.findMany({ where: { conversationId } });
      const broadcastTargets = [...members.map(m => m.userId), user.id];

      for (const uid of broadcastTargets) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: uid,
            payload: { conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', message: 'Successfully left the group.' });
    } catch (err) {
      next(err);
    }
  };

  // ─── Edit Message (Legacy compatibility stub) ──────────────────────────────
  editMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { messageId } = req.params;
      const { message } = req.body;

      const chatMsg = await prisma.message.findUnique({ where: { id: messageId } });
      if (!chatMsg) {
        return res.status(404).json({ status: 'error', message: 'Message not found.' });
      }

      if (chatMsg.senderId !== user.id) {
        return res.status(403).json({ status: 'error', message: 'You can only edit your own messages.' });
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content: message || '' }
      });

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  };

  // ─── Delete Message (Soft Delete stub) ────────────────────────────────────
  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { messageId } = req.params;

      const chatMsg = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: { include: { participants: true } } }
      });
      if (!chatMsg) {
        return res.status(404).json({ status: 'error', message: 'Message not found.' });
      }

      const isParticipant = chatMsg.conversation.participants.some(p => p.userId === user.id);
      if (!isParticipant) {
        return res.status(403).json({ status: 'error', message: 'You are not authorized to delete this message.' });
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { deletedAt: new Date() }
      });

      // Notify members
      for (const p of chatMsg.conversation.participants) {
        try {
          const { broadcastRBACUpdate } = require('../../lib/socket');
          broadcastRBACUpdate({
            type: 'message:sent',
            userId: p.userId,
            payload: { conversationId: chatMsg.conversationId }
          });
        } catch (_) {}
      }

      res.status(200).json({ status: 'success', message: 'Message deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  // ─── Forward Message ──────────────────────────────────────────────────────
  forwardMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { messageId } = req.params;
      const { recipientId } = req.body;

      const chatMsg = await prisma.message.findUnique({
        where: { id: messageId },
        include: { attachments: true }
      });
      if (!chatMsg) return res.status(404).json({ status: 'error', message: 'Source message not found.' });

      // Resolve or create target conversation
      let targetConvId = '';
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'ONE_TO_ONE',
          participants: { every: { userId: { in: [user.id, recipientId] } } }
        }
      });
      if (existing) {
        targetConvId = existing.id;
      } else {
        const conv = await prisma.conversation.create({ data: { type: 'ONE_TO_ONE' } });
        await prisma.conversationParticipant.createMany({
          data: [
            { conversationId: conv.id, userId: user.id, role: 'MEMBER' },
            { conversationId: conv.id, userId: recipientId, role: 'MEMBER' }
          ]
        });
        targetConvId = conv.id;
      }

      const clonedMsg = await prisma.message.create({
        data: {
          conversationId: targetConvId,
          senderId: user.id,
          content: chatMsg.content,
          type: chatMsg.type
        }
      });

      if (chatMsg.attachments.length) {
        await prisma.messageAttachment.create({
          data: {
            messageId: clonedMsg.id,
            fileName: chatMsg.attachments[0].fileName,
            fileUrl: chatMsg.attachments[0].fileUrl,
            fileSize: chatMsg.attachments[0].fileSize,
            mimeType: chatMsg.attachments[0].mimeType
          }
        });
      }

      // Notify target recipient
      try {
        const { broadcastRBACUpdate } = require('../../lib/socket');
        broadcastRBACUpdate({
          type: 'message:sent',
          userId: recipientId,
          payload: { conversationId: targetConvId }
        });
      } catch (_) {}

      res.status(201).json({ status: 'success', data: clonedMsg });
    } catch (err) {
      next(err);
    }
  };
}
