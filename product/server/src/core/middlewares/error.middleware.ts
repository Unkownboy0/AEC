import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = 500;
  let message = 'Internal Server Error';
  let errors: any = undefined;

  if (error instanceof HttpException) {
    status = error.status;
    message = error.message;
    errors = error.errors;
  } else if (error instanceof ZodError) {
    status = 400;
    message = 'Validation Error';
    errors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  } else if (error.name === 'PrismaClientKnownRequestError') {
    // Handling standard Prisma errors
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      status = 409;
      message = `Conflict: Unique constraint failed on field ${prismaError.meta?.target || ''}`;
    } else if (prismaError.code === 'P2025') {
      status = 404;
      message = 'Resource not found';
    }
  }

  // Log error
  if (status >= 500) {
    logger.error(`${req.method} ${req.url} - Status: ${status} - Error:`, error);
  } else {
    logger.warn(`${req.method} ${req.url} - Status: ${status} - Message: ${message}`);
  }

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message,
    errors,
  });
};
