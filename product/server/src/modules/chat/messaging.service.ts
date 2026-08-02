import { prisma } from '../../lib/prisma';
import { NotFoundException, ForbiddenException, BadRequestException } from '../../utils/exceptions';
import { NotificationService } from '../notifications/notification.service';

export interface SendMessageDto {
  conversationId?: string;
  recipientId?: string;
  departmentId?: string;
  taskId?: string;
  type?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'SYSTEM';
  content: string;
  replyToId?: string;
}

export class MessagingService {
  /**
   * Get or create a conversation for 1-to-1, Department, or Task
   */
  async getOrCreateConversation(userId: string, dto: { recipientId?: string; departmentId?: string; taskId?: string }) {
    if (dto.departmentId) {
      let conv = await prisma.conversation.findFirst({
        where: { type: 'DEPARTMENT', departmentId: dto.departmentId },
        include: {
          participants: {
            include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          },
        },
      });

      if (!conv) {
        const dept = await prisma.department.findUnique({ where: { id: dto.departmentId } });
        conv = await prisma.conversation.create({
          data: {
            type: 'DEPARTMENT',
            title: `${dept?.code || 'Department'} Chat Channel`,
            departmentId: dto.departmentId,
            participants: {
              create: { userId, role: 'MEMBER' },
            },
          },
          include: {
            participants: {
              include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
            },
          },
        });
      } else {
        const isParticipant = conv.participants.some((p) => p.userId === userId);
        if (!isParticipant) {
          await prisma.conversationParticipant.create({
            data: { conversationId: conv.id, userId, role: 'MEMBER' },
          });
        }
      }

      return conv;
    }

    if (dto.recipientId) {
      let conv = await prisma.conversation.findFirst({
        where: {
          type: 'ONE_TO_ONE',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: dto.recipientId } } },
          ],
        },
        include: {
          participants: {
            include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
          },
        },
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            type: 'ONE_TO_ONE',
            participants: {
              createMany: {
                data: [
                  { userId, role: 'MEMBER' },
                  { userId: dto.recipientId, role: 'MEMBER' },
                ],
              },
            },
          },
          include: {
            participants: {
              include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
            },
          },
        });
      }

      return conv;
    }

    throw new BadRequestException('Recipient ID or Department ID required');
  }

  /**
   * Send message in conversation
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    let conversationId = dto.conversationId;

    if (!conversationId) {
      const conv = await this.getOrCreateConversation(senderId, {
        recipientId: dto.recipientId,
        departmentId: dto.departmentId,
        taskId: dto.taskId,
      });
      conversationId = conv.id;
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        type: dto.type || 'TEXT',
        content: dto.content.trim(),
        replyToId: dto.replyToId || null,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, role: true, email: true },
        },
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    // Send notifications to other participants
    for (const p of message.conversation.participants) {
      if (p.userId !== senderId) {
        await NotificationService.sendNotification({
          recipientId: p.userId,
          eventType: 'MESSAGE_RECEIVED',
          title: `New Message from ${message.sender.firstName}`,
          message: dto.content.substring(0, 100),
          relatedEntityType: 'CONVERSATION',
          relatedEntityId: conversationId,
          deepLinkRoute: `/chat/${conversationId}`,
        });
      }
    }

    return message;
  }

  /**
   * Get messages for conversation
   */
  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          readReceipts: true,
        },
      }),
      prisma.message.count({ where: { conversationId, deletedAt: null } }),
    ]);

    return { data: messages, meta: { total, page, limit } };
  }
}
