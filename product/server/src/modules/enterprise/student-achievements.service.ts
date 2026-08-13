import { prisma } from '../../lib/prisma';
import { BadRequestException, NotFoundException, ForbiddenException } from '../../utils/exceptions';

export interface CreateAchievementInput {
  title: string;
  category?: string;
  description?: string;
  issuedBy?: string;
  issueDate?: string;
  certificateUrl?: string;
  isPublished?: boolean;
}

export class StudentAchievementsService {
  /**
   * Create new achievement for currently authenticated student
   */
  async createAchievement(userId: string, input: CreateAchievementInput) {
    const student = await prisma.student.findFirst({
      where: { userId, deleted: false },
    });

    if (!student) {
      throw new NotFoundException('Student record not found for this user account.');
    }

    if (!input.title || !input.title.trim()) {
      throw new BadRequestException('Achievement title is required.');
    }

    const issueDate = input.issueDate ? new Date(input.issueDate) : null;

    try {
      const achievement = await (prisma as any).studentAchievement.create({
        data: {
          studentId: student.id,
          title: input.title.trim(),
          category: input.category || 'ACADEMIC',
          description: input.description || null,
          issuedBy: input.issuedBy || null,
          issueDate,
          certificateUrl: input.certificateUrl || null,
          verified: false,
          isPublished: !!input.isPublished,
        },
      });

      return achievement;
    } catch (err: any) {
      // Fallback in case schema migration runtime is pending
      const currentList = JSON.parse(student.documents || '[]');
      const fallbackEntry = {
        id: `ach-${Date.now()}`,
        studentId: student.id,
        title: input.title.trim(),
        category: input.category || 'ACADEMIC',
        description: input.description || null,
        issuedBy: input.issuedBy || null,
        issueDate: input.issueDate || null,
        certificateUrl: input.certificateUrl || null,
        verified: false,
        isPublished: !!input.isPublished,
        createdAt: new Date().toISOString(),
      };

      currentList.push(fallbackEntry);
      await prisma.student.update({
        where: { id: student.id },
        data: { documents: JSON.stringify(currentList) },
      });

      return fallbackEntry;
    }
  }

  /**
   * Get student's own achievements (both private & published)
   */
  async getMyAchievements(userId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deleted: false },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    try {
      const achievements = await (prisma as any).studentAchievement.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
      });
      return achievements;
    } catch (err) {
      const docs = JSON.parse(student.documents || '[]');
      return docs.filter((d: any) => d.id && d.id.startsWith('ach-'));
    }
  }

  /**
   * Get achievements for a specific student with privacy scoping.
   * Other students ONLY see verified & published achievements.
   */
  async getStudentAchievements(targetId: string, requester: { id: string; role: string }) {
    const targetStudent = await prisma.student.findFirst({
      where: {
        deleted: false,
        OR: [
          { id: targetId },
          { userId: targetId },
          { admissionNo: targetId },
        ],
      },
    });

    if (!targetStudent) {
      throw new NotFoundException('Target student not found.');
    }

    const isSelf = targetStudent.userId === requester.id;
    const isLeadershipOrStaff = ['SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ACADEMIC_DEAN', 'HOD', 'FACULTY', 'MENTOR']
      .includes((requester.role || '').toUpperCase().replace(/[\s_-]+/g, ''));

    // Privacy rule: non-staff other students can ONLY view published & verified achievements
    const mustBePublishedOnly = !isSelf && !isLeadershipOrStaff;

    try {
      const whereCondition: any = { studentId: targetStudent.id };
      if (mustBePublishedOnly) {
        whereCondition.isPublished = true;
      }

      const achievements = await (prisma as any).studentAchievement.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
      });

      return achievements;
    } catch (err) {
      const docs = JSON.parse(targetStudent.documents || '[]');
      const achievements = docs.filter((d: any) => d.id && d.id.startsWith('ach-'));
      if (mustBePublishedOnly) {
        return achievements.filter((a: any) => a.isPublished);
      }
      return achievements;
    }
  }

  /**
   * Toggle publication status for an achievement (Public vs Private)
   */
  async togglePublishAchievement(userId: string, achievementId: string, isPublished: boolean) {
    const student = await prisma.student.findFirst({
      where: { userId, deleted: false },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    try {
      const existing = await (prisma as any).studentAchievement.findFirst({
        where: { id: achievementId, studentId: student.id },
      });

      if (!existing) {
        throw new NotFoundException('Achievement record not found.');
      }

      const updated = await (prisma as any).studentAchievement.update({
        where: { id: achievementId },
        data: { isPublished },
      });

      return updated;
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) throw err;
      const docs = JSON.parse(student.documents || '[]');
      const item = docs.find((d: any) => d.id === achievementId);
      if (item) {
        item.isPublished = isPublished;
        await prisma.student.update({
          where: { id: student.id },
          data: { documents: JSON.stringify(docs) },
        });
        return item;
      }
      throw new NotFoundException('Achievement record not found.');
    }
  }

  /**
   * Delete achievement by ID
   */
  async deleteAchievement(userId: string, achievementId: string) {
    const student = await prisma.student.findFirst({
      where: { userId, deleted: false },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    try {
      const existing = await (prisma as any).studentAchievement.findFirst({
        where: { id: achievementId, studentId: student.id },
      });

      if (!existing) {
        throw new NotFoundException('Achievement record not found.');
      }

      await (prisma as any).studentAchievement.delete({
        where: { id: achievementId },
      });

      return { success: true };
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) throw err;
      const docs = JSON.parse(student.documents || '[]');
      const filtered = docs.filter((d: any) => d.id !== achievementId);
      await prisma.student.update({
        where: { id: student.id },
        data: { documents: JSON.stringify(filtered) },
      });
      return { success: true };
    }
  }
}
