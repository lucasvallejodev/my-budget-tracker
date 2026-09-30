import { type SQL, sql } from 'drizzle-orm';

import { UNCATEGORIZED_COLOR } from '@coinkeeper/shared/constants/palette';
import type { CategorySlice, GroupSlice } from '@coinkeeper/shared/schema/reports';

import { rowsOf } from '../batch';
import { Db } from '../db';
import { spendingWhere } from './predicate';
import { monthsEndingAt } from './range';

const UncategorizedLabel = 'Uncategorized';
const UncategorizedIcon = 'CircleHelp';
const MonthOfTransaction = sql`to_char(date_trunc('month', t.date), 'YYYY-MM')`;

export type BreakdownOptions = {
  months?: number;
  split?: boolean;
};

type MonthColumn = { month?: string };

type SplitClauses = {
  groupBy: SQL;
  orderBy: SQL;
  select: SQL;
};

const splitClauses = (split = false): SplitClauses =>
  split
    ? {
        groupBy: sql`${MonthOfTransaction}, `,
        orderBy: sql`month, `,
        select: sql`${MonthOfTransaction} AS month, `,
      }
    : {
        groupBy: sql``,
        orderBy: sql``,
        select: sql``,
      };

const withMonth = (row: MonthColumn): MonthColumn => (row.month ? { month: row.month } : {});

export const breakdownByCategory = async (
  db: Db,
  userId: string,
  month: string,
  { currency, ...options }: BreakdownOptions & { currency: string }
): Promise<(CategorySlice & MonthColumn)[]> => {
  const { end, start } = monthsEndingAt(month, options.months);
  const split = splitClauses(options.split);

  const rows = await rowsOf<
    MonthColumn & {
      category_id: string | null;
      category_name: string | null;
      color: string | null;
      group_id: string | null;
      group_name: string | null;
      icon: string | null;
      spent_minor: string;
    }
  >(
    db,
    sql`
    SELECT ${split.select}c.id AS category_id, c.name AS category_name, c.icon, g.id AS group_id, g.name AS group_name, g.color, -SUM(t.amount_minor) AS spent_minor
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN category_groups g ON g.id = c.group_id
    WHERE t.user_id = ${userId} AND ${spendingWhere} AND t.currency = ${currency}
      AND t.date >= ${start} AND t.date < ${end}
      AND COALESCE(g.kind, 'expense') = 'expense'
    GROUP BY ${split.groupBy}c.id, c.name, c.icon, g.id, g.name, g.color
    ORDER BY ${split.orderBy}spent_minor DESC`
  );

  return rows.map(row => ({
    categoryId: row.category_id,
    categoryName: row.category_name ?? UncategorizedLabel,
    color: row.color ?? UNCATEGORIZED_COLOR,
    groupId: row.group_id,
    groupName: row.group_name ?? UncategorizedLabel,
    icon: row.icon ?? UncategorizedIcon,
    spentMinor: Number(row.spent_minor),
    ...withMonth(row),
  }));
};

export const breakdownByGroup = async (
  db: Db,
  userId: string,
  month: string,
  options: BreakdownOptions = {}
): Promise<(GroupSlice & MonthColumn)[]> => {
  const { end, start } = monthsEndingAt(month, options.months);
  const split = splitClauses(options.split);

  const rows = await rowsOf<
    MonthColumn & {
      color: string | null;
      currency: string;
      group_id: string | null;
      group_name: string | null;
      spent_minor: string;
    }
  >(
    db,
    sql`
    SELECT ${split.select}t.currency, g.id AS group_id, g.name AS group_name, g.color, -SUM(t.amount_minor) AS spent_minor
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN category_groups g ON g.id = c.group_id
    WHERE t.user_id = ${userId} AND ${spendingWhere}
      AND t.date >= ${start} AND t.date < ${end}
      AND COALESCE(g.kind, 'expense') = 'expense'
    GROUP BY ${split.groupBy}t.currency, g.id, g.name, g.color
    ORDER BY ${split.orderBy}t.currency, spent_minor DESC`
  );

  return rows.map(row => ({
    color: row.color ?? UNCATEGORIZED_COLOR,
    currency: row.currency,
    groupId: row.group_id,
    groupName: row.group_name ?? UncategorizedLabel,
    spentMinor: Number(row.spent_minor),
    ...withMonth(row),
  }));
};
