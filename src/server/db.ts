import { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import { HttpStatus } from '@/constants/http';
import * as schema from '@/db/schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

export type DbOrTx = Db | Tx;

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number = HttpStatus.badRequest
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export const notFound = (what: string): never => {
  throw new ServiceError(`${what} not found`, HttpStatus.notFound);
};
