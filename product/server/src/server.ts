import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`🚀 CampusOS API Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    // A deployment must not appear healthy while an older process still owns the
    // configured port. Let the service manager surface and restart the failed unit
    // instead of silently retrying forever against the same occupied address.
    logger.error(`CampusOS API could not start: port ${env.PORT} is already in use.`);
    void prisma.$disconnect().finally(() => process.exit(1));
  } else {
    logger.error('HTTP Server Error:', err);
    void prisma.$disconnect().finally(() => process.exit(1));
  }
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: any) => {
  logger.error('Uncaught Exception thrown:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
