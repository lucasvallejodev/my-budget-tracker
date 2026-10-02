import { sql } from 'drizzle-orm';

import { toIsoDate } from '@coinkeeper/shared/lib/date-helpers';
import { convertMinor } from '@coinkeeper/shared/lib/money';
import type {
  CashPoint,
  ConvertedTotals,
  CurrencyTotals,
  NetWorthBucket,
} from '@coinkeeper/shared/schema/reports';

import { rowsOf, valueList } from '../batch';
import { Db } from '../db';
import { createFxService } from '../fx/service';
import { monthRange } from '../ledger/service';
import { monthEndBalances } from './balances';
import { breakdownByCategory, breakdownByGroup, type BreakdownOptions } from './breakdown';
import { categoryLines, spendingWhere } from './predicate';
import { monthsEndingAt, type MonthSpan } from './range';
import { spendingByAccount, spendingByPayee } from './rankings';

const DEFAULT_CASH_FLOW_MONTHS = 8;

type CategorySpending = {
  categoryId: string;
  currency: string;
  fixedMinor: number;
  spentMinor: number;
};

const categorySpending = async (
  db: Db,
  userId: string,
  { end, start }: MonthSpan,
  currencies: string[]
): Promise<CategorySpending[]> => {
  if (!currencies.length) return [];

  const rows = await rowsOf<{
    category_id: string;
    currency: string;
    fixed_minor: string;
    spent_minor: string;
  }>(
    db,
    sql`
    SELECT t.currency, t.category_id, -SUM(t.amount_minor) AS spent_minor,
      COALESCE(-SUM(t.amount_minor) FILTER (WHERE t.recurring_series_id IS NOT NULL), 0) AS fixed_minor
    FROM ${categoryLines} t
    JOIN accounts a ON a.id = t.account_id
    JOIN categories c ON c.id = t.category_id
    JOIN category_groups g ON g.id = c.group_id
    WHERE t.user_id = ${userId} AND ${spendingWhere} AND t.currency IN (${valueList(currencies)})
      AND t.date >= ${start} AND t.date < ${end}
      AND g.kind = 'expense'
    GROUP BY t.currency, t.category_id`
  );

  return rows.map(row => ({
    categoryId: row.category_id,
    currency: row.currency,
    fixedMinor: Number(row.fixed_minor),
    spentMinor: Number(row.spent_minor),
  }));
};

type CategorySpendingOverMonths = Omit<CategorySpending, 'fixedMinor'> & { months: number };

const categorySpendingBetween = async (
  db: Db,
  userId: string,
  from: string,
  to: string
): Promise<CategorySpendingOverMonths[]> => {
  const rows = await rowsOf<{
    category_id: string;
    currency: string;
    months: string;
    spent_minor: string;
  }>(
    db,
    sql`
    SELECT t.currency, t.category_id, -SUM(t.amount_minor) AS spent_minor,
      COUNT(DISTINCT date_trunc('month', t.date)) AS months
    FROM ${categoryLines} t
    JOIN accounts a ON a.id = t.account_id
    JOIN categories c ON c.id = t.category_id
    JOIN category_groups g ON g.id = c.group_id
    WHERE t.user_id = ${userId} AND ${spendingWhere}
      AND t.date >= ${from} AND t.date < ${to}
      AND g.kind = 'expense' AND c.archived_at IS NULL
    GROUP BY t.currency, t.category_id`
  );

  return rows.map(row => ({
    categoryId: row.category_id,
    currency: row.currency,
    months: Number(row.months),
    spentMinor: Number(row.spent_minor),
  }));
};

export const createReportService = (db: Db) => {
  const fx = createFxService(db);

  return {
    breakdownByCategory: (
      userId: string,
      month: string,
      currency: string,
      options?: BreakdownOptions
    ) => breakdownByCategory(db, userId, month, { ...options, currency }),

    breakdownByGroup: (userId: string, month: string, options?: BreakdownOptions) =>
      breakdownByGroup(db, userId, month, options),

    async cashFlow(
      userId: string,
      month: string,
      months = DEFAULT_CASH_FLOW_MONTHS
    ): Promise<CashPoint[]> {
      const { end, start } = monthsEndingAt(month, months);

      const rows = await rowsOf<{
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
        FROM ${categoryLines} t
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

    categorySpending: (userId: string, span: MonthSpan, currencies: string[]) =>
      categorySpending(db, userId, span, currencies),

    categorySpendingBetween: (userId: string, from: string, to: string) =>
      categorySpendingBetween(db, userId, from, to),

    async convertedTotals(
      userId: string,
      primary: string,
      data: { netWorth: NetWorthBucket[]; totals: CurrencyTotals[] },
      asOf = toIsoDate(new Date())
    ): Promise<ConvertedTotals> {
      const foreign = [
        ...new Set([
          ...data.netWorth.map(balance => balance.currency),
          ...data.totals.map(total => total.currency),
        ]),
      ].filter(currency => currency !== primary);

      const rates = await fx.getRates(userId, foreign, primary, asOf);
      const missing = foreign.filter(currency => !rates.has(currency));

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
        rates: foreign.flatMap(currency => {
          const rate = rates.get(currency);

          return rate
            ? [
                {
                  currency,
                  date: rate.date,
                  rate: rate.rate,
                  source: rate.source,
                },
              ]
            : [];
        }),
        spendingMinor: data.totals.reduce(
          (sum, total) => sum + convert(total.spendingMinor, total.currency),
          0
        ),
      };
    },

    monthEndBalances: (userId: string, month: string, months?: number) =>
      monthEndBalances(db, userId, month, months),

    async monthlyTotals(
      userId: string,
      month: string,
      span?: MonthSpan
    ): Promise<CurrencyTotals[]> {
      const { end, start } = span ?? monthRange(month);

      const rows = await rowsOf<{
        currency: string;
        income_minor: string;
        spending_minor: string;
      }>(
        db,
        sql`
        SELECT t.currency,
          COALESCE(SUM(t.amount_minor) FILTER (WHERE g.kind = 'income' OR (g.kind IS NULL AND t.amount_minor > 0)), 0) AS income_minor,
          COALESCE(-SUM(t.amount_minor) FILTER (WHERE g.kind = 'expense' OR (g.kind IS NULL AND t.amount_minor < 0)), 0) AS spending_minor
        FROM ${categoryLines} t
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
      const rows = await rowsOf<{
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

    spendingByAccount: (userId: string, month: string, months?: number) =>
      spendingByAccount(db, userId, month, months),

    spendingByPayee: (userId: string, month: string, months?: number) =>
      spendingByPayee(db, userId, month, months),
  };
};
