import { Request, Response, NextFunction } from 'express';
import { HttpException } from '../../utils/exceptions';
import { logger } from '../../utils/logger';
import { ZodError } from 'zod';
import crypto from 'crypto';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
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
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      status = 409;
      message = `Conflict: Unique constraint failed on field ${prismaError.meta?.target || ''}`;
    } else if (prismaError.code === 'P2025') {
      status = 404;
      message = 'Resource not found';
    }
  } else if (error.message?.startsWith('FORBIDDEN:')) {
    // Catch service-layer authorization errors (e.g. workflow bypass guard)
    status = 403;
    message = error.message.replace('FORBIDDEN: ', '');
  }

  // Generate a traceable Error ID for every 5xx response.
  // The errorId is logged server-side with full stack so support can investigate.
  // Only the errorId (never the stack) is returned to the client.
  const requestId = (req as any).requestId as string | undefined;

  if (status >= 500) {
    const errorId = crypto.randomUUID();
    logger.error({
      errorId,
      requestId,
      method: req.method,
      url: req.url,
      status,
      message: error.message,
      stack: error.stack,
    });

    res.status(status).json({
      status: 'error',
      statusCode: status,
      message: 'An unexpected error occurred. Please contact support if this persists.',
      errorId,
      ...(requestId ? { requestId } : {}),
    });
    return;
  }

  // 4xx: log a warning but no errorId needed (client-visible errors are not internal failures)
  logger.warn({
    requestId,
    method: req.method,
    url: req.url,
    status,
    message,
  });

  res.status(status).json({
    status: 'error',
    statusCode: status,
    message,
    errors,
    ...(requestId ? { requestId } : {}),
  });
};
