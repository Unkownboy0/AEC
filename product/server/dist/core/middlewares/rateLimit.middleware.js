"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = exports.rateLimiter = void 0;
const logger_1 = require("../../utils/logger");
const env_1 = require("../../config/env");
const store = {};
const rateLimiter = (options) => {
    const { windowMs, max, message = 'Too many requests, please try again later.' } = options;
    return (req, res, next) => {
        // Bypass rate limiting in development environment
        if (env_1.env.NODE_ENV === 'development') {
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
            logger_1.logger.warn(`Rate limit exceeded for IP: ${ip} on path: ${req.originalUrl}`);
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
exports.rateLimiter = rateLimiter;
// Specialized limit configurations
exports.authRateLimiter = (0, exports.rateLimiter)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 attempts
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
});
exports.apiRateLimiter = (0, exports.rateLimiter)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Max 60 requests per minute
    message: 'API rate limit exceeded. Please slow down.',
});
//# sourceMappingURL=rateLimit.middleware.js.map