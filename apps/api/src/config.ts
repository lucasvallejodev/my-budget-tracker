import { isIPv4, isIPv6 } from 'node:net';
import { z } from 'zod';

import { databaseUrl } from '@/db/connection';

const DEFAULT_PORT = 4000;
const DEFAULT_SESSION_DAYS = 30;
const DEFAULT_AUTH_ATTEMPTS_PER_MINUTE = 10;
const MAX_SESSION_DAYS = 365;
const IPV4_PREFIX_BITS = 32;
const IPV6_PREFIX_BITS = 128;
const CIDR_SEPARATOR = '/';
const NO_TRUSTED_PROXIES = 'false';
const SECURE_COOKIE_NAME = '__Host-ck_session';
const DEVELOPMENT_COOKIE_NAME = 'ck_session';

const TRUST_PROXY_ERROR =
  'TRUST_PROXY must be false or a comma-separated list of proxy addresses, CIDR ranges or loopback, linklocal, uniquelocal; true would trust any X-Forwarded-For a client sends';

const LogLevelValues = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
const NamedProxyRanges = ['linklocal', 'loopback', 'uniquelocal'];

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

const prefixBitsOf = (address: string): number | null => {
  if (isIPv4(address)) return IPV4_PREFIX_BITS;
  if (isIPv6(address)) return IPV6_PREFIX_BITS;

  return null;
};

const isPrefixWithin = (prefix: string, maximumBits: number): boolean => {
  const bits = Number(prefix);

  return prefix !== '' && Number.isInteger(bits) && bits >= 0 && bits <= maximumBits;
};

const isCidrRange = (entry: string, separatorIndex: number): boolean => {
  const maximumBits = prefixBitsOf(entry.slice(0, separatorIndex));

  return maximumBits !== null && isPrefixWithin(entry.slice(separatorIndex + 1), maximumBits);
};

const isProxyAddress = (entry: string): boolean => {
  if (NamedProxyRanges.includes(entry)) return true;

  const separatorIndex = entry.indexOf(CIDR_SEPARATOR);

  if (separatorIndex === -1) return prefixBitsOf(entry) !== null;

  return isCidrRange(entry, separatorIndex);
};

const trustedProxies = commaList(NO_TRUSTED_PROXIES)
  .transform(entries => entries.filter(entry => entry !== NO_TRUSTED_PROXIES))
  .refine(entries => entries.every(isProxyAddress), { error: TRUST_PROXY_ERROR });

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
  TRUST_PROXY: trustedProxies,
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
  trustedProxies: string[];
};

const withoutEmptyValues = (environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(environment).filter(([, value]) => value !== ''));

export const loadConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  const parsed = environmentSchema.parse(withoutEmptyValues(environment));
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
    trustedProxies: parsed.TRUST_PROXY,
  };
};
