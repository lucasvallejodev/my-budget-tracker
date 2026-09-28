import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';

import * as schema from './schema';

const APPLICATION_NAME = 'coinkeeper-api';
const CONNECTION_TIMEOUT_MS = 10_000;
const IDLE_IN_TRANSACTION_TIMEOUT_MS = 30_000;
const IDLE_TIMEOUT_MS = 30_000;
const MAX_CONNECTIONS = 10;
const MIN_STATEMENT_TIMEOUT_MS = 500;
const STATEMENT_TIMEOUT_MARGIN_MS = 1_000;

export const NO_STATEMENT_TIMEOUT = 0;

export type DatabaseErrorHandler = (error: Error) => void;

export type DatabaseOptions = {
  statementTimeoutMs: number;
};

const logToConsole: DatabaseErrorHandler = error => {
  console.error('Idle database client failed', error);
};

export const statementTimeoutFor = (handlerTimeoutMs: number): number =>
  Math.max(handlerTimeoutMs - STATEMENT_TIMEOUT_MARGIN_MS, MIN_STATEMENT_TIMEOUT_MS);

export const poolConfig = (
  connectionString: string,
  { statementTimeoutMs }: DatabaseOptions
): PoolConfig => ({
  application_name: APPLICATION_NAME,
  connectionString,
  connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
  idle_in_transaction_session_timeout: IDLE_IN_TRANSACTION_TIMEOUT_MS,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
  max: MAX_CONNECTIONS,
  statement_timeout: statementTimeoutMs,
});

export const createDatabase = (connectionString: string, options: DatabaseOptions) => {
  const pool = new Pool(poolConfig(connectionString, options));
  let handleError = logToConsole;

  pool.on('error', error => handleError(error));

  return {
    close: () => pool.end(),
    db: drizzle(pool, { schema }),
    reportErrorsTo: (handler: DatabaseErrorHandler) => {
      handleError = handler;
    },
  };
};
