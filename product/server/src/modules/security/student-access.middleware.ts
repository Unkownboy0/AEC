import { Request, Response, NextFunction } from 'express';
import { UnauthorizedException } from '../../utils/exceptions';
import { StudentAccessService } from './student-access.service';

export async function requireStudentAccess(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new UnauthorizedException('Authentication required'));
    }
    await StudentAccessService.assertCanViewStudent(req.user, req.params.id);
    return next();
  } catch (error) {
    return next(error);
  }
}

