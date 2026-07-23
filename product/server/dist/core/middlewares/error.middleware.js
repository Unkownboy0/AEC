"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const exceptions_1 = require("../../utils/exceptions");
const logger_1 = require("../../utils/logger");
const env_1 = require("../../config/env");
const zod_1 = require("zod");
const errorHandler = (error, req, res, next) => {
    let status = 500;
    let message = 'Internal Server Error';
    let errors = undefined;
    if (error instanceof exceptions_1.HttpException) {
        status = error.status;
        message = error.message;
        errors = error.errors;
    }
    else if (error instanceof zod_1.ZodError) {
        status = 400;
        message = 'Validation Error';
        errors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }));
    }
    else if (error.name === 'PrismaClientKnownRequestError') {
        // Handling standard Prisma errors
        const prismaError = error;
        if (prismaError.code === 'P2002') {
            status = 409;
            message = `Conflict: Unique constraint failed on field ${prismaError.meta?.target || ''}`;
        }
        else if (prismaError.code === 'P2025') {
            status = 404;
            message = 'Resource not found';
        }
    }
    // Log error
    if (status >= 500) {
        logger_1.logger.error(`${req.method} ${req.url} - Status: ${status} - Error:`, error);
    }
    else {
        logger_1.logger.warn(`${req.method} ${req.url} - Status: ${status} - Message: ${message}`);
    }
    res.status(status).json({
        status: 'error',
        statusCode: status,
        message,
        errors,
        stack: env_1.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map