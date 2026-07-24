import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { NotFoundException, BadRequestException } from '../../utils/exceptions';

const DEFAULT_REWARDS = [
  { id: '1', title: 'Express Library Book Extension', description: '+7 Days extra return limit on any borrowed book', xpCost: 150, category: 'ACADEMIC', icon: 'BookMarked' },
  { id: '2', title: 'Priority Placement Mock Review', description: 'Exclusive 1-on-1 resume & mock interview session with Placement Dean', xpCost: 300, category: 'PERKS', icon: 'Award' },
  { id: '3', title: 'Campus Cafeteria Pass (₹100 Voucher)', description: 'Redeemable at Central Campus Dining Hall', xpCost: 200, category: 'DISCOUNTS', icon: 'Coffee' },
  { id: '4', title: 'GEETORUS Tech Club Hoodie', description: 'Official College Engineering Chapter Merchandise', xpCost: 500, category: 'MERCH', icon: 'Shirt' },
];

export class GamificationController {
  /**
   * Get student gamification profile (XP, level, streaks, badges)
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const student = await prisma.student.findFirst({
        where: { userId: user.id }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      let profile = await (prisma as any).gamificationProfile.findUnique({
        where: { studentId: student.id }
      });

      if (!profile) {
        // Auto-initialize profile with baseline achievements
        profile = await (prisma as any).gamificationProfile.create({
          data: {
            studentId: student.id,
            xp: 450,
            level: 3,
            attendanceStreak: 14,
            assignmentStreak: 8,
            quizStreak: 5,
            badges: JSON.stringify(['ATTENDANCE_CHAMPION', 'QUIZ_MASTER', 'CODE_NINJA']),
            unlockedRewards: JSON.stringify([])
          }
        });
      }

      const badgesList = typeof profile.badges === 'string' ? JSON.parse(profile.badges) : profile.badges;

      res.status(200).json({
        status: 'success',
        data: {
          ...profile,
          badges: badgesList
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Leaderboard (Department & Overall Top Students)
   */
  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topProfiles = await (prisma as any).gamificationProfile.findMany({
        take: 10,
        orderBy: { xp: 'desc' }
      });

      const studentIds = topProfiles.map((p: any) => p.studentId);
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { department: true }
      });

      const leaderboard = topProfiles.map((p: any, index: number) => {
        const s = students.find(st => st.id === p.studentId);
        return {
          rank: index + 1,
          studentName: s ? `${s.firstName} ${s.lastName}` : `Student #${index + 1}`,
          rollNo: s?.rollNumber,
          department: s?.department?.name || 'Computer Science',
          xp: p.xp,
          level: p.level,
          attendanceStreak: p.attendanceStreak
        };
      });

      res.status(200).json({
        status: 'success',
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Available Reward Store Items
   */
  getStoreItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({
        status: 'success',
        data: DEFAULT_REWARDS
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Redeem Reward using XP points
   */
  redeemReward = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { rewardId } = req.body;

      const reward = DEFAULT_REWARDS.find(r => r.id === rewardId);
      if (!reward) {
        throw new NotFoundException('Reward item not found');
      }

      const student = await prisma.student.findFirst({
        where: { userId: user.id }
      });

      if (!student) {
        throw new NotFoundException('Student profile not found');
      }

      const profile = await (prisma as any).gamificationProfile.findUnique({
        where: { studentId: student.id }
      });

      if (!profile || profile.xp < reward.xpCost) {
        throw new BadRequestException(`Insufficient XP points. Required: ${reward.xpCost} XP`);
      }

      // Deduct XP and record redemption
      const updated = await (prisma as any).gamificationProfile.update({
        where: { studentId: student.id },
        data: { xp: profile.xp - reward.xpCost }
      });

      const redemptionCode = `REWARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      res.status(200).json({
        status: 'success',
        data: {
          redemptionCode,
          reward,
          remainingXp: updated.xp
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
