import { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { HttpStatus } from '@/constants/http';
import * as schema from '@/db/schema';
import type { ErrorCode } from '@coinkeeper/shared/schema/common';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export type DbOrTx = Db | Tx;

const DefaultCodes: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.badRequest]: 'INVALID_REQUEST',
  [HttpStatus.conflict]: 'CONFLICT',
  [HttpStatus.forbidden]: 'FORBIDDEN',
  [HttpStatus.notFound]: 'NOT_FOUND',
  [HttpStatus.unauthorized]: 'UNAUTHENTICATED',
};

export class ServiceError extends Error {
  readonly code: ErrorCode;

  constructor(
    message: string,
    public readonly status: number = HttpStatus.unprocessable,
    code?: ErrorCode
  ) {
    super(message);
    this.name = 'ServiceError';
    this.code = code ?? DefaultCodes[status] ?? 'RULE_VIOLATION';
  }
}

export const notFound = (what: string): never => {
  throw new ServiceError(`${what} not found`, HttpStatus.notFound);
};

export const conflict = (message: string, code: ErrorCode = 'CONFLICT'): never => {
  throw new ServiceError(message, HttpStatus.conflict, code);
};

export const toIsoTimestamp = (value: Date | null): string | null => value?.toISOString() ?? null;
