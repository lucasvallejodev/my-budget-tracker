import { sql, SQL } from 'drizzle-orm';

import { isoDateOfMonthStart, toIsoDate } from '@/lib/date-helpers';
import { convertMinor } from '@/lib/money';
import { Colors } from '@/styles/theme';

import { Db } from '../db';
import { createFxService } from '../fx/service';
import { monthRange } from '../ledger/service';

export type CurrencyTotals = {
  currency: string;
  incomeMinor: number;
  spendingMinor: number;
};
export type GroupSlice = {
  color: string;
  currency: string;
  groupId: string | null;
  groupName: string;
  spentMinor: number;
};
export type NetWorthBucket = {
  assetsMinor: number;
  currency: string;
  liabilitiesMinor: number;
  netMinor: number;
};
export type ConvertedTotals = {
  asOf: string;
  currency: string;
  incomeMinor: number;
  missing: string[];
  netWorthMinor: number;
  rates: {
    currency: string;
    date: string;
    rate: number;
    source: string;
  }[];
  spendingMinor: number;
};
export type CashPoint = {
  currency: string;
  incomeMinor: number;
  month: string;
  spendingMinor: number;
};

const DEFAULT_CASH_FLOW_MONTHS = 8;

const spendingWhere = sql`t.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending`;

const query = async <T>(db: Db, statement: SQL): Promise<T[]> => {
  const result = (await db.execute(statement)) as { rows: T[] };

  return result.rows;
};

export const createReportService = (db: Db) => {
  const fx = createFxService(db);

  return {
    async breakdownByCategory(userId: string, month: string, currency: string) {
      const { end, start } = monthRange(month);

      const rows = await query<{
        category_id: string | null;
        category_name: string | null;
        color: string | null;
        group_id: string | null;
        group_name: string | null;
        icon: string | null;
        spent_minor: string;
      }>(
        db,
        sql`
        SELECT c.id AS category_id, c.name AS category_name, c.icon, g.id AS group_id, g.name AS group_name, g.color, -SUM(t.amount_minor) AS spent_minor
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_groups g ON g.id = c.group_id
        WHERE t.user_id = ${userId} AND ${spendingWhere} AND t.currency = ${currency}
          AND t.date >= ${start} AND t.date < ${end}
          AND COALESCE(g.kind, 'expense') = 'expense'
        GROUP BY c.id, c.name, c.icon, g.id, g.name, g.color
        ORDER BY spent_minor DESC`
      );

      return rows.map(row => ({
        categoryId: row.category_id,
        categoryName: row.category_name ?? 'Uncategorized',
        color: row.color ?? Colors.uncategorizedFallback,
        groupId: row.group_id,
        groupName: row.group_name ?? 'Uncategorized',
        icon: row.icon ?? 'CircleHelp',
        spentMinor: Number(row.spent_minor),
      }));
    },
    async breakdownByGroup(userId: string, month: string): Promise<GroupSlice[]> {
      const { end, start } = monthRange(month);

      const rows = await query<{
        color: string | null;
        currency: string;
        group_id: string | null;
        group_name: string | null;
        spent_minor: string;
      }>(
        db,
        sql`
        SELECT t.currency, g.id AS group_id, g.name AS group_name, g.color, -SUM(t.amount_minor) AS spent_minor
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_groups g ON g.id = c.group_id
        WHERE t.user_id = ${userId} AND ${spendingWhere}
          AND t.date >= ${start} AND t.date < ${end}
          AND COALESCE(g.kind, 'expense') = 'expense'
        GROUP BY t.currency, g.id, g.name, g.color
        ORDER BY t.currency, spent_minor DESC`
      );

      return rows.map(row => ({
        color: row.color ?? Colors.uncategorizedFallback,
        currency: row.currency,
        groupId: row.group_id,
        groupName: row.group_name ?? 'Uncategorized',
        spentMinor: Number(row.spent_minor),
      }));
    },

    async cashFlow(
      userId: string,
      month: string,
      months = DEFAULT_CASH_FLOW_MONTHS
    ): Promise<CashPoint[]> {
      const { end } = monthRange(month);
      const start = isoDateOfMonthStart(month, 1 - months);

      const rows = await query<{
        currency: string;
        income_minor: string;
        month: string;
        spending_minor: string;
      }>(
        db,
        sql`
        SELECT to_char(date_trunc('month', t.date), 'YYYY-MM') AS month, t.currency,
          COALESCE(SUM(t.amount_minor) FILTER (WHERE g.kind = 'income' OR (g.kind IS NULL AND t.amount_minor > 0)), 0) AS income_minor,
          COALESCE(-SUM(t.amount_minor) FILTER (WHERE g.kind = 'expense' OR (g.kind IS NULL AND t.amount_minor < 0)), 0) AS spending_minor
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_groups g ON g.id = c.group_id
        WHERE t.user_id = ${userId} AND ${spendingWhere}
          AND t.date >= ${start} AND t.date < ${end}
        GROUP BY 1, 2 ORDER BY 1, 2`
      );

      return rows.map(row => ({
        currency: row.currency,
        incomeMinor: Number(row.income_minor),
        month: row.month,
        spendingMinor: Number(row.spending_minor),
      }));
    },

    async convertedTotals(
      userId: string,
      primary: string,
      data: { netWorth: NetWorthBucket[]; totals: CurrencyTotals[] },
      asOf = toIsoDate(new Date())
    ): Promise<ConvertedTotals> {
      const currencies = [
        ...new Set([
          ...data.netWorth.map(balance => balance.currency),
          ...data.totals.map(total => total.currency),
        ]),
      ];

      const rates = new Map<string, Awaited<ReturnType<typeof fx.getRate>>>();

      for (const currency of currencies) {
        if (currency !== primary) {
          rates.set(currency, await fx.getRate(userId, currency, primary, asOf));
        }
      }

      const missing = currencies.filter(currency => currency !== primary && !rates.get(currency));

      const convert = (amountMinor: number, currency: string) => {
        if (currency === primary) return amountMinor;
        const rate = rates.get(currency);

        return rate ? convertMinor(amountMinor, currency, primary, rate.rate) : 0;
      };

      return {
        asOf,
        currency: primary,
        incomeMinor: data.totals.reduce(
          (sum, total) => sum + convert(total.incomeMinor, total.currency),
          0
        ),
        missing,
        netWorthMinor: data.netWorth.reduce(
          (sum, balance) => sum + convert(balance.netMinor, balance.currency),
          0
        ),
        rates: [...rates.entries()]
          .filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => !!entry[1])
          .map(([currency, rate]) => ({
            currency,
            date: rate.date,
            rate: rate.rate,
            source: rate.source,
          })),
        spendingMinor: data.totals.reduce(
          (sum, total) => sum + convert(total.spendingMinor, total.currency),
          0
        ),
      };
    },

    async monthlyTotals(userId: string, month: string): Promise<CurrencyTotals[]> {
      const { end, start } = monthRange(month);

      const rows = await query<{
        currency: string;
        income_minor: string;
        spending_minor: string;
      }>(
        db,
        sql`
        SELECT t.currency,
          COALESCE(SUM(t.amount_minor) FILTER (WHERE g.kind = 'income' OR (g.kind IS NULL AND t.amount_minor > 0)), 0) AS income_minor,
          COALESCE(-SUM(t.amount_minor) FILTER (WHERE g.kind = 'expense' OR (g.kind IS NULL AND t.amount_minor < 0)), 0) AS spending_minor
        FROM transactions t
        JOIN accounts a ON a.id = t.account_id
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN category_groups g ON g.id = c.group_id
        WHERE t.user_id = ${userId} AND ${spendingWhere}
          AND t.date >= ${start} AND t.date < ${end}
        GROUP BY t.currency ORDER BY t.currency`
      );

      return rows.map(row => ({
        currency: row.currency,
        incomeMinor: Number(row.income_minor),
        spendingMinor: Number(row.spending_minor),
      }));
    },

    async netWorth(userId: string): Promise<NetWorthBucket[]> {
      const rows = await query<{
        assets_minor: string;
        currency: string;
        liabilities_minor: string;
      }>(
        db,
        sql`
        SELECT a.currency,
          COALESCE(SUM(t.amount_minor) FILTER (WHERE a.classification = 'asset'), 0) AS assets_minor,
          COALESCE(SUM(t.amount_minor) FILTER (WHERE a.classification = 'liability'), 0) AS liabilities_minor
        FROM accounts a
        LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
        WHERE a.user_id = ${userId} AND a.deleted_at IS NULL AND a.archived_at IS NULL
        GROUP BY a.currency ORDER BY a.currency`
      );

      return rows.map(row => ({
        assetsMinor: Number(row.assets_minor),
        currency: row.currency,
        liabilitiesMinor: Number(row.liabilities_minor),
        netMinor: Number(row.assets_minor) + Number(row.liabilities_minor),
      }));
    },
  };
};
