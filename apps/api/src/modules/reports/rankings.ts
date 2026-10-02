import { type SQL, sql } from 'drizzle-orm';

import type { RankingSlice } from '@coinkeeper/shared/schema/reports';

import { rowsOf } from '../batch';
import { Db } from '../db';
import { categoryLines, spendingWhere } from './predicate';
import { monthsEndingAt, type MonthSpan } from './range';

const NoPayeeLabel = 'No payee';

type RankingRow = {
  currency: string;
  id: null | string;
  name: string;
  spent_minor: string;
  transactions: string;
};

const ranking = async (
  db: Db,
  userId: string,
  { end, start }: MonthSpan,
  dimension: { id: SQL; name: SQL }
): Promise<RankingSlice[]> => {
  const rows = await rowsOf<RankingRow>(
    db,
    sql`
    SELECT t.currency, ${dimension.id} AS id, ${dimension.name} AS name,
      -SUM(t.amount_minor) AS spent_minor, COUNT(DISTINCT t.id) AS transactions
    FROM ${categoryLines} t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN payees p ON p.id = t.payee_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN category_groups g ON g.id = c.group_id
    WHERE t.user_id = ${userId} AND ${spendingWhere}
      AND t.date >= ${start} AND t.date < ${end}
      AND COALESCE(g.kind, 'expense') = 'expense'
    GROUP BY 1, 2, 3
    HAVING -SUM(t.amount_minor) > 0
    ORDER BY t.currency, spent_minor DESC, name`
  );

  return rows.map(row => ({
    currency: row.currency,
    id: row.id,
    name: row.name,
    spentMinor: Number(row.spent_minor),
    transactions: Number(row.transactions),
  }));
};

export const spendingByPayee = (db: Db, userId: string, month: string, months?: number) =>
  ranking(db, userId, monthsEndingAt(month, months), {
    id: sql`p.id`,
    name: sql`COALESCE(p.name, t.original_payee, ${NoPayeeLabel})`,
  });

export const spendingByAccount = (db: Db, userId: string, month: string, months?: number) =>
  ranking(db, userId, monthsEndingAt(month, months), { id: sql`a.id`, name: sql`a.name` });
