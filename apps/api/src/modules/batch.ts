import { sql, type SQL } from 'drizzle-orm';

import { HttpStatus } from '@/constants/http';
import { hasDistinctItems } from '@coinkeeper/shared/lib/arrays';

import { type DbOrTx, notFound, ServiceError } from './db';

export const WRITE_CHUNK_ROWS = 1000;

export const rowsOf = async <Row>(db: DbOrTx, statement: SQL): Promise<Row[]> => {
  const result = (await db.execute(statement)) as { rows: Row[] };

  return result.rows;
};

export const valueList = (values: readonly string[]): SQL =>
  sql.join(
    values.map(value => sql`${value}`),
    sql`, `
  );

export const positionedIds = (orderedIds: readonly string[]): SQL =>
  sql.join(
    orderedIds.map((id, index) => sql`(${id}, ${index}::int)`),
    sql`, `
  );

export const assertDistinctIds = (ids: readonly string[]): void => {
  if (!hasDistinctItems(ids)) throw new ServiceError('List each id once', HttpStatus.badRequest);
};

export const assertAllFound = (foundCount: number, ids: readonly string[], what: string): void => {
  if (foundCount !== ids.length) notFound(what);
};
