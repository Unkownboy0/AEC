import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Assigns a unique X-Request-ID header to every inbound request.
 * The ID is either taken from the client's header (useful when a load balancer or API gateway
 * already sets one) or generated fresh as a UUID.
 *
 * The ID is:
 *  - attached to req.requestId for downstream access
 *  - echoed back in the response header so clients can correlate
 *  - included automatically by error.middleware.ts in all error responses
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim())
    ? incomingId.trim()
    : crypto.randomUUID();

  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
