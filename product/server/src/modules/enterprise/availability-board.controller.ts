import { Request, Response, NextFunction } from 'express';
import { availabilityBoardService } from './availability-board.service';
import { UserPayload } from '../../utils/security';

export class AvailabilityBoardController {
  getAvailabilityBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user as UserPayload;
      const { departmentId, role, type, search } = req.query;

      const result = await availabilityBoardService.getAvailabilityBoard(user, {
        departmentId: departmentId ? String(departmentId) : undefined,
        role: role as any,
        type: type as any,
        search: search ? String(search) : undefined
      });

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}

export const availabilityBoardController = new AvailabilityBoardController();
