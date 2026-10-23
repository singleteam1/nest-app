import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  HOST: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(1),
  ACCESS_TOKEN_TTL: z.string().min(1),
  REFRESH_TOKEN_TTL: z.string().min(1),

  COOKIE_DOMAIN: z.string().min(1),
  COOKIE_SECRET: z.string().min(1),
  COOKIE_EXPIRE_TTL: z.coerce.number().int().positive().default(3600),

  ALLOWED_ORIGINS: z.string().min(1),

  RATE_LIMIT_MAX: z.coerce.number().positive().max(1000).default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(60000),
});

export type EnvConfig = z.infer<typeof envSchema>;
