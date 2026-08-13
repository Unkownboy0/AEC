import { Request, Response, NextFunction } from 'express';
import { facultyOperationsService } from './faculty-operations.service';

const parseDate = (value: unknown) => value ? new Date(String(value)) : undefined;

export class FacultyOperationsController {
  getBoard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await facultyOperationsService.getFacultyBoard((req as any).user, {
        departmentId: req.query.departmentId ? String(req.query.departmentId) : undefined,
        date: parseDate(req.query.date),
        period: req.query.period ? Number(req.query.period) : undefined,
        search: req.query.search ? String(req.query.search) : undefined,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  };

  getDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await facultyOperationsService.getFacultyDetail((req as any).user, req.params.facultyId, {
        departmentId: req.query.departmentId ? String(req.query.departmentId) : undefined,
        date: parseDate(req.query.date),
        period: req.query.period ? Number(req.query.period) : undefined,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error) { next(error); }
  };
}

export const facultyOperationsController = new FacultyOperationsController();
