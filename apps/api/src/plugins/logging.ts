import { DrizzleQueryError } from 'drizzle-orm';
import type { FastifyServerOptions } from 'fastify';

import type { AppConfig } from '@/config';

export const REDACTED = '[REDACTED]';

const FAILED_QUERY_PREFIX = 'Failed query: ';

const SecretHeaders = ['authorization', 'cookie', 'set-cookie'];

const SecretFields = [
  'currentPassword',
  'newPassword',
  'password',
  'passwordHash',
  'token',
  'tokenHash',
];

const headerPaths = SecretHeaders.flatMap(header => [
  `headers["${header}"]`,
  `*.headers["${header}"]`,
]);

const fieldPaths = SecretFields.flatMap(field => [field, `*.${field}`, `*.*.${field}`]);

const RedactedLogPaths = [...fieldPaths, ...headerPaths];

const withoutQueryParameters = (error: unknown): unknown => {
  if (!(error instanceof DrizzleQueryError)) return error;

  const message = `${FAILED_QUERY_PREFIX}${error.query}`;
  const safe = new Error(message, { cause: error.cause });

  safe.name = DrizzleQueryError.name;
  safe.stack = error.stack?.replace(error.message, message);

  return safe;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !(value instanceof Error);

const safeLogArgument = (argument: unknown): unknown => {
  if (argument instanceof Error) return withoutQueryParameters(argument);

  if (isRecord(argument) && argument.err instanceof Error) {
    return { ...argument, err: withoutQueryParameters(argument.err) };
  }

  return argument;
};

type LogStream = { write: (line: string) => void };

export type LoggerDestination = false | { stream: LogStream };

export const loggerOptions = (
  config: AppConfig,
  stream?: LogStream
): FastifyServerOptions['logger'] => ({
  hooks: {
    logMethod(inputArguments, method) {
      const [first, ...rest] = inputArguments;

      return method.apply(this, [safeLogArgument(first), ...rest] as typeof inputArguments);
    },
  },
  level: config.logLevel,
  redact: { censor: REDACTED, paths: RedactedLogPaths },
  stream,
});
