import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

declare global {
  var prisma: PrismaClient | undefined;
}

const dbUrl = env.DATABASE_URL;

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
