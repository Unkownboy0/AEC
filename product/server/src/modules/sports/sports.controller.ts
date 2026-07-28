import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { UserPayload } from '../../utils/security';

export class SportsController {
  // Sports Dashboard Metrics & Summaries
  getSportsSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      
      const [teamsCount, tournamentsCount, equipmentsCount, achievementsCount, bookingsCount] = await Promise.all([
        (prisma as any).sportsTeam.count({ where: { status: 'ACTIVE' } }),
        (prisma as any).sportsTournament.count(),
        (prisma as any).sportsEquipment.count(),
        (prisma as any).sportsAchievement.count(),
        (prisma as any).sportsBooking.count({ where: { status: 'APPROVED' } })
      ]);

      const recentTournaments = await (prisma as any).sportsTournament.findMany({
        orderBy: { startDate: 'desc' },
        take: 5
      });

      const recentAchievements = await (prisma as any).sportsAchievement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      const upcomingBookings = await (prisma as any).sportsBooking.findMany({
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
        take: 5
      });

      res.status(200).json({
        status: 'success',
        data: {
          metrics: {
            teamsCount,
            tournamentsCount,
            equipmentsCount,
            achievementsCount,
            bookingsCount
          },
          recentTournaments,
          recentAchievements,
          upcomingBookings
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Teams Management
  listTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const teams = await (prisma as any).sportsTeam.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.status(200).json({ status: 'success', data: teams });
    } catch (error) {
      next(error);
    }
  };

  createTeam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await (prisma as any).sportsTeam.create({
        data: req.body
      });
      res.status(201).json({ status: 'success', data: team });
    } catch (error) {
      next(error);
    }
  };

  // Tournaments Management
  listTournaments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tournaments = await (prisma as any).sportsTournament.findMany({
        orderBy: { startDate: 'desc' }
      });
      res.status(200).json({ status: 'success', data: tournaments });
    } catch (error) {
      next(error);
    }
  };

  createTournament = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tournament = await (prisma as any).sportsTournament.create({
        data: {
          ...req.body,
          startDate: new Date(req.body.startDate),
          endDate: new Date(req.body.endDate)
        }
      });
      res.status(201).json({ status: 'success', data: tournament });
    } catch (error) {
      next(error);
    }
  };

  // Ground & Facility Bookings
  listBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await (prisma as any).sportsBooking.findMany({
        orderBy: { date: 'desc' }
      });
      res.status(200).json({ status: 'success', data: bookings });
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const booking = await (prisma as any).sportsBooking.create({
        data: {
          facilityName: req.body.facilityName,
          bookedBy: user.id,
          bookerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          bookerRole: user.role,

          date: new Date(req.body.date),
          startTime: req.body.startTime,
          endTime: req.body.endTime,
          purpose: req.body.purpose,
          status: 'APPROVED'
        }
      });
      res.status(201).json({ status: 'success', data: booking });
    } catch (error) {
      next(error);
    }
  };

  // Equipment Inventory
  listEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const equipment = await (prisma as any).sportsEquipment.findMany({
        orderBy: { name: 'asc' }
      });
      res.status(200).json({ status: 'success', data: equipment });
    } catch (error) {
      next(error);
    }
  };

  createEquipment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await (prisma as any).sportsEquipment.create({
        data: req.body
      });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      next(error);
    }
  };

  // Achievements & Medals
  listAchievements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const achievements = await (prisma as any).sportsAchievement.findMany({
        orderBy: { date: 'desc' }
      });
      res.status(200).json({ status: 'success', data: achievements });
    } catch (error) {
      next(error);
    }
  };

  createAchievement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const achievement = await (prisma as any).sportsAchievement.create({
        data: {
          ...req.body,
          date: req.body.date ? new Date(req.body.date) : new Date()
        }
      });
      res.status(201).json({ status: 'success', data: achievement });
    } catch (error) {
      next(error);
    }
  };
}
