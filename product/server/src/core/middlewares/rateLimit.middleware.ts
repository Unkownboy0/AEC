import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting in development environment
    if (env.NODE_ENV === 'development') {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const currentTime = Date.now();

    if (!store[ip]) {
      store[ip] = {
        count: 1,
        resetTime: currentTime + windowMs,
      };
      return next();
    }

    const clientData = store[ip];

    if (currentTime > clientData.resetTime) {
      // Window expired, reset bucket
      clientData.count = 1;
      clientData.resetTime = currentTime + windowMs;
      return next();
    }

    clientData.count += 1;

    if (clientData.count > max) {
      logger.warn(`Rate limit exceeded for IP: ${ip} on path: ${req.originalUrl}`);
      res.status(429).json({
        status: 'error',
        statusCode: 429,
        message,
      });
      return;
    }

    next();
  };
};

// Specialized limit configurations
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const apiRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Max 60 requests per minute
  message: 'API rate limit exceeded. Please slow down.',
});
