"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
const path_1 = __importDefault(require("path"));
// Load environmental variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env.local'), override: true });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('30d'),
    PASSWORD_RESET_TOKEN_MINUTES: zod_1.z.coerce.number().int().min(5).max(60).default(15),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173,http://localhost:3000'),
    PUBLIC_APP_URL: zod_1.z.string().url().optional(),
    STORAGE_ROOT: zod_1.z.string().default(path_1.default.join(__dirname, '../../uploads')),
    BACKUP_ROOT: zod_1.z.string().default(path_1.default.join(__dirname, '../../backups')),
    PG_DUMP_PATH: zod_1.z.string().default('pg_dump'),
    TRUST_PROXY: zod_1.z.coerce.number().int().min(0).max(2).default(0),
    PAYMENT_GATEWAY: zod_1.z.enum(['RAZORPAY', 'DISABLED']).default('DISABLED'),
    RAZORPAY_KEY_ID: zod_1.z.string().optional(),
    RAZORPAY_KEY_SECRET: zod_1.z.string().optional(),
    CAMPUS_TENANT_ID: zod_1.z.string().min(1).default('campusos-default'),
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
        }
        catch {
            return true;
        }
    });
    if (!parsed.data.PUBLIC_APP_URL || origins.length === 0 || invalidOrigin) {
        console.error('Production requires PUBLIC_APP_URL and explicit HTTPS-only ALLOWED_ORIGINS without loopback hosts.');
        process.exit(1);
    }
}
exports.env = parsed.data;
//# sourceMappingURL=env.js.map