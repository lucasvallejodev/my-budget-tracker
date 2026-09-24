import { z } from 'zod';

import { databaseUrl } from '@/db/connection';

const DEFAULT_PORT = 4000;
const DEFAULT_SESSION_DAYS = 30;
const DEFAULT_AUTH_ATTEMPTS_PER_MINUTE = 10;
const MAX_SESSION_DAYS = 365;
const SECURE_COOKIE_NAME = '__Host-ck_session';
const DEVELOPMENT_COOKIE_NAME = 'ck_session';

const LogLevelValues = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const commaList = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform(value =>
      value
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean)
    );

const environmentSchema = z.object({
  ALLOWED_ORIGINS: commaList('http://localhost:3000'),
  API_DOCS: z.stringbool().optional(),
  API_HOST: z.string().default('127.0.0.1'),
  API_PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  AUTH_ATTEMPTS_PER_MINUTE: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_AUTH_ATTEMPTS_PER_MINUTE),
  COOKIE_SECURE: z.stringbool().optional(),
  CORS_ORIGINS: commaList(''),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(LogLevelValues).default('info'),
  NODE_ENV: z.string().default('development'),
  SESSION_DAYS: z.coerce.number().int().min(1).max(MAX_SESSION_DAYS).default(DEFAULT_SESSION_DAYS),
  TRUST_PROXY: z.stringbool().default(true),
});

export type AppConfig = {
  allowedOrigins: string[];
  authAttemptsPerMinute: number;
  cookieSecure: boolean;
  corsOrigins: string[];
  databaseUrl: string | null;
  docs: boolean;
  host: string;
  logLevel: (typeof LogLevelValues)[number];
  port: number;
  sessionCookieName: string;
  sessionDays: number;
  trustProxy: boolean;
};

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  const parsed = environmentSchema.parse(environment);
  const production = parsed.NODE_ENV === 'production';
  const cookieSecure = parsed.COOKIE_SECURE ?? production;

  return {
    allowedOrigins: parsed.ALLOWED_ORIGINS,
    authAttemptsPerMinute: parsed.AUTH_ATTEMPTS_PER_MINUTE,
    cookieSecure,
    corsOrigins: parsed.CORS_ORIGINS,
    databaseUrl: parsed.DATABASE_URL ? databaseUrl(parsed.DATABASE_URL) : null,
    docs: parsed.API_DOCS ?? !production,
    host: parsed.API_HOST,
    logLevel: parsed.LOG_LEVEL,
    port: parsed.API_PORT,
    sessionCookieName: cookieSecure ? SECURE_COOKIE_NAME : DEVELOPMENT_COOKIE_NAME,
    sessionDays: parsed.SESSION_DAYS,
    trustProxy: parsed.TRUST_PROXY,
  };
};
