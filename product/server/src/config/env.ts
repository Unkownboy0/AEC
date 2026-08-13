import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local'), override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  PASSWORD_RESET_TOKEN_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  PUBLIC_APP_URL: z.string().url().optional(),
  STORAGE_ROOT: z.string().default(path.join(__dirname, '../../uploads')),
  BACKUP_ROOT: z.string().default(path.join(__dirname, '../../backups')),
  PG_DUMP_PATH: z.string().default('pg_dump'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(2).default(0),
  PAYMENT_GATEWAY: z.enum(['RAZORPAY', 'DISABLED']).default('DISABLED'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  CAMPUS_TENANT_ID: z.string().min(1).default('campusos-default'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

if (parsed.data.NODE_ENV === 'production') {
  const origins = parsed.data.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  const invalidOrigin = origins.find((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname);
    } catch {
      return true;
    }
  });

  if (!parsed.data.PUBLIC_APP_URL || origins.length === 0 || invalidOrigin) {
    console.error('Production requires PUBLIC_APP_URL and explicit HTTPS-only ALLOWED_ORIGINS without loopback hosts.');
    process.exit(1);
  }
}

export const env = parsed.data;
