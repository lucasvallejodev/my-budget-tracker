import { Colors } from '@/styles/theme';
import { sql, SQL } from 'drizzle-orm';
import { convertMinor } from '@/lib/money';
import { Db } from '../db';
import { monthRange } from '../ledger/service';
import { createFxService } from '../fx/service';

export type CurrencyTotals = {
  currency: string;
  incomeMinor: number;
  spendingMinor: number;
};
export type GroupSlice = {
  currency: string;
  groupId: string | null;
  groupName: string;
  color: string;
  spentMinor: number;
};
export type NetWorthBucket = {
  currency: string;
  assetsMinor: number;
  liabilitiesMinor: number;
  netMinor: number;
};
export type ConvertedTotals = {
  currency: string;
  asOf: string;
  netWorthMinor: number;
  incomeMinor: number;
  spendingMinor: number;
  /** Currencies that could not be converted because no rate exists. */
  missing: string[];
  rates: {
    currency: string;
    rate: number;
    date: string;
    source: string;
  }[];
};
export type CashPoint = {
  month: string;
  currency: string;
  incomeMinor: number;
  spendingMinor: number;
};

/** Spending predicate shared by every report: standard, not excluded, account counts in spending. */
const spendingWhere = sql`t.deleted_at IS NULL AND t.kind = 'standard' AND NOT t.excluded AND a.counts_in_spending`;

const query = async <T>(db: Db, statement: SQL): Promise<T[]> => {
  const result = (await db.execute(statement)) as { rows: T[] };

  return result.rows;
};

export const createReportService = (db: Db) => {
  const fx = createFxService(db);

  return {
    /**
     * Optional blended view in the primary currency. Buckets without a rate are listed in
     * `missing` and left out, never silently converted at 1:1.
     */
    async convertedTotals(
      userId: string,
      primary: string,
      data: { netWorth: NetWorthBucket[]; totals: CurrencyTotals[] },
      asOf = new Date().toISOString().slice(0, 10)
    ): Promise<ConvertedTotals> {
      const currencies = [
        ...new Set([...data.netWorth.map(b => b.currency), ...data.totals.map(t => t.currency)]),
      ];

      const rates = new Map<string, Awaited<ReturnType<typeof fx.getRate>>>();

      for (const currency of currencies) {
        if (currency !== primary) {
          rates.set(currency, await fx.getRate(userId, currency, primary, asOf));
        }
      }

      const missing = currencies.filter(c => c !== primary && !rates.get(c));

      const convert = (amountMinor: number, currency: string) => {
        if (currency === primary) return amountMinor;
        const rate = rates.get(currency);

        return rate ? convertMinor(amountMinor, currency, primary, rate.rate) : 0;
      };

      return {
        currency: primary,
        asOf,
        netWorthMinor: data.netWorth.reduce((sum, b) => sum + convert(b.netMinor, b.currency), 0),
        incomeMinor: data.totals.reduce((sum, t) => sum + convert(t.incomeMinor, t.currency), 0),
        spendingMinor: data.totals.reduce(
          (sum, t) => sum + convert(t.spendingMinor, t.currency),
          0
        ),
        missing,
        rates: [...rates.entries()]
          .filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => !!entry[1])
          .map(([currency, rate]) => ({
            currency,
            rate: rate.rate,
            date: rate.date,
            source: rate.source,
          })),
      };
    },
    async monthlyTotals(userId: string, month: string): Promise<CurrencyTotals[]> {
      const { start, end } = monthRange(month);

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

    async breakdownByGroup(userId: string, month: string): Promise<GroupSlice[]> {
      const { start, end } = monthRange(month);

      const rows = await query<{
        currency: string;
        group_id: string | null;
        group_name: string | null;
        color: string | null;
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
        currency: row.currency,
        groupId: row.group_id,
        groupName: row.group_name ?? 'Uncategorized',
        color: row.color ?? Colors.uncategorized,
        spentMinor: Number(row.spent_minor),
      }));
    },

    async breakdownByCategory(userId: string, month: string, currency: string) {
      const { start, end } = monthRange(month);

      const rows = await query<{
        category_id: string | null;
        category_name: string | null;
        icon: string | null;
        group_id: string | null;
        group_name: string | null;
        color: string | null;
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
        icon: row.icon ?? 'CircleHelp',
        groupId: row.group_id,
        groupName: row.group_name ?? 'Uncategorized',
        color: row.color ?? Colors.uncategorized,
        spentMinor: Number(row.spent_minor),
      }));
    },

    async netWorth(userId: string): Promise<NetWorthBucket[]> {
      const rows = await query<{
        currency: string;
        assets_minor: string;
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
        currency: row.currency,
        assetsMinor: Number(row.assets_minor),
        liabilitiesMinor: Number(row.liabilities_minor),
        netMinor: Number(row.assets_minor) + Number(row.liabilities_minor),
      }));
    },

    /** Income and spending per month for the last `months` months (inclusive of `month`). */
    async cashFlow(userId: string, month: string, months = 8): Promise<CashPoint[]> {
      const { end } = monthRange(month);
      const [year, monthIndex] = month.split('-').map(Number);
      const start = new Date(Date.UTC(year, monthIndex - months, 1)).toISOString().slice(0, 10);

      const rows = await query<{
        month: string;
        currency: string;
        income_minor: string;
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
        month: row.month,
        currency: row.currency,
        incomeMinor: Number(row.income_minor),
        spendingMinor: Number(row.spending_minor),
      }));
    },
  };
};
