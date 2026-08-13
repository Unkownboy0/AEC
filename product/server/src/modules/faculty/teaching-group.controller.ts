import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TeachingGroupService } from './teaching-group.service';

const createTeachingGroupSchema = z.object({
  name: z.string().trim().min(3).max(120),
  subjectId: z.string().uuid(),
  facultyId: z.string().uuid().optional(),
  academicYearId: z.string().uuid(),
  semester: z.number().int().min(1).max(12),
  groupType: z.enum(['COMBINED', 'SECTION', 'ELECTIVE', 'PROJECT']).optional(),
  departmentIds: z.array(z.string().uuid()).min(1),
  sectionIds: z.array(z.string().uuid()).min(1),
  studentIds: z.array(z.string().uuid()).optional(),
});

export class TeachingGroupController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TeachingGroupService.listForUser(req.user!);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createTeachingGroupSchema.parse(req.body);
      const data = await TeachingGroupService.create(req.user!, input);
      return res.status(201).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  }

  static async students(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await TeachingGroupService.resolveStudents(req.user!, req.params.id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return next(error);
    }
  }
}

