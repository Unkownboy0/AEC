"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const prisma_1 = require("./lib/prisma");
const server = app_1.default.listen(env_1.env.PORT, () => {
    logger_1.logger.info(`🚀 GEETORUS CAMPUSOS Engine running in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
});
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
        logger_1.logger.info('HTTP server closed.');
        try {
            await prisma_1.prisma.$disconnect();
            logger_1.logger.info('Database connections closed.');
            process.exit(0);
        }
        catch (err) {
            logger_1.logger.error('Error during database disconnection:', err);
            process.exit(1);
        }
    });
    // Force shutdown after 10s
    setTimeout(() => {
        logger_1.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception thrown:', error);
    // Optional: Graceful shutdown on uncaught exception
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
//# sourceMappingURL=server.js.map