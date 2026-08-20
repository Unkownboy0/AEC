import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environmental variables
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local'), override: true });
if (process.env.CAMPUSOS_ENV_FILE) {
  dotenv.config({ path: path.resolve(process.env.CAMPUSOS_ENV_FILE), override: true });
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEPLOYMENT_MODE: z.enum(['INTERNET_PRODUCTION', 'LOCAL_ON_PREM']).default('INTERNET_PRODUCTION'),
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
  PAYMENT_GATEWAY: z.enum(['RAZORPAY', 'DEMO_PAYMENT', 'DISABLED']).default('DISABLED'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CAMPUS_TENANT_ID: z.string().min(1).default('campusos-default'),
  // Firebase Admin SDK — required for real FCM push delivery (background/killed state).
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['SMTP', 'DISABLED']).default('DISABLED'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('GEETORUS CAMPUSOS <no-reply@campusos.local>'),
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
      if (parsed.data.DEPLOYMENT_MODE === 'LOCAL_ON_PREM') {
        return !['capacitor:', 'http:', 'https:'].includes(url.protocol) ||
          (!['localhost'].includes(url.hostname) && !/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname));
      }
      return url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname) ||
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    } catch {
      return true;
    }
  });

  if (!parsed.data.PUBLIC_APP_URL || origins.length === 0 || invalidOrigin) {
    console.error('Production requires PUBLIC_APP_URL and explicit deployment-mode-appropriate ALLOWED_ORIGINS.');
    process.exit(1);
  }

  if (parsed.data.PAYMENT_GATEWAY === 'RAZORPAY' && (!parsed.data.RAZORPAY_KEY_ID || !parsed.data.RAZORPAY_KEY_SECRET || !parsed.data.RAZORPAY_WEBHOOK_SECRET)) {
    console.error('Production Razorpay mode requires RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET.');
    process.exit(1);
  }
}

export const env = parsed.data;
