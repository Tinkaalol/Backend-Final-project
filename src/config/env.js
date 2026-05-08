import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CRON_DECAY_ENABLED: z.string().transform(v => v === 'true').default('true'),
  DECAY_THRESHOLD_DAYS: z.coerce.number().default(30),
  DECAY_PERCENT_PER_CYCLE: z.coerce.number().default(10),
  DECAY_MAX_DISCOUNT: z.coerce.number().default(50),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().default('LeanStock <onboarding@resend.dev>'),
  APP_URL: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(' Invalid environment variables:');
  parsed.error.errors.forEach(err => {
    console.error(`   ${err.path.join('.')}: ${err.message}`);
  });
  process.exit(1);
}

export const config = parsed.data;
