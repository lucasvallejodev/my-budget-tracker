import { sql } from 'drizzle-orm';

import type { BalancePoint } from '@coinkeeper/shared/schema/reports';

import { rowsOf } from '../batch';
import { Db } from '../db';
import { monthsEndingAt } from './range';

export const DEFAULT_BALANCE_MONTHS = 6;

export const monthEndBalances = async (
  db: Db,
  userId: string,
  month: string,
  months = DEFAULT_BALANCE_MONTHS
): Promise<BalancePoint[]> => {
  const { end, start } = monthsEndingAt(month, months);

  const rows = await rowsOf<{
    account_id: string;
    balance_minor: string;
    currency: string;
    month: string;
  }>(
    db,
    sql`
    WITH months AS (
      SELECT month_start::date AS month_start
      FROM generate_series(${start}::date, ${end}::date - interval '1 month', interval '1 month') AS month_start
    ),
    first_activity AS (
      SELECT t.account_id, date_trunc('month', MIN(t.date))::date AS month_start
      FROM transactions t
      WHERE t.user_id = ${userId} AND t.deleted_at IS NULL
      GROUP BY t.account_id
    ),
    before_range AS (
      SELECT t.account_id, SUM(t.amount_minor) AS amount_minor
      FROM transactions t
      WHERE t.user_id = ${userId} AND t.deleted_at IS NULL AND t.date < ${start}
      GROUP BY t.account_id
    ),
    in_range AS (
      SELECT t.account_id, date_trunc('month', t.date)::date AS month_start, SUM(t.amount_minor) AS amount_minor
      FROM transactions t
      WHERE t.user_id = ${userId} AND t.deleted_at IS NULL AND t.date >= ${start} AND t.date < ${end}
      GROUP BY 1, 2
    )
    SELECT a.id AS account_id, a.currency, to_char(m.month_start, 'YYYY-MM') AS month,
      COALESCE(b.amount_minor, 0)
        + SUM(COALESCE(r.amount_minor, 0)) OVER (PARTITION BY a.id ORDER BY m.month_start) AS balance_minor
    FROM accounts a
    CROSS JOIN months m
    LEFT JOIN before_range b ON b.account_id = a.id
    LEFT JOIN in_range r ON r.account_id = a.id AND r.month_start = m.month_start
    LEFT JOIN first_activity f ON f.account_id = a.id
    WHERE a.user_id = ${userId} AND a.deleted_at IS NULL AND a.archived_at IS NULL
      AND m.month_start >= LEAST(f.month_start, date_trunc('month', a.created_at)::date)
    ORDER BY a.created_at, a.id, m.month_start`
  );

  return rows.map(row => ({
    accountId: row.account_id,
    balanceMinor: Number(row.balance_minor),
    currency: row.currency,
    month: row.month,
  }));
};
