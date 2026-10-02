import { asc, eq } from 'drizzle-orm';

import { createAuthService } from '@/auth/service';
import { createSessionStore } from '@/auth/sessions';
import { currencies, userSettings } from '@/db/schema';
import type { Currency } from '@coinkeeper/shared/schema/currencies';
import type { PeriodRuleValues, UserSettings } from '@coinkeeper/shared/schema/settings';

import { createAccountService } from './accounts/service';
import { createBudgetService } from './budgets/service';
import { ensureUserBootstrap } from './categories/seed';
import { createCategoryService } from './categories/service';
import { Db, notFound, ServiceError } from './db';
import { createForecastService } from './forecast/service';
import { createFxService, ManualRateProvider } from './fx/service';
import { createImportService } from './import/service';
import { createLedgerService } from './ledger/service';
import { createPayeeService } from './payees/service';
import { createPeriodService } from './periods/service';
import { createRecurringService } from './recurring/service';
import { createReportService } from './reports/service';
import { createRuleService } from './rules/service';
import { createTemplateService } from './templates/service';

const DEFAULT_SESSION_DAYS = 30;
const DEFAULT_SESSION_MAX_AGE_DAYS = 90;

type ServiceOptions = { sessionDays?: number; sessionMaxAgeDays?: number };

const toSettings = (row: typeof userSettings.$inferSelect): UserSettings => ({
  allowEmoji: row.allowEmoji,
  locale: row.locale,
  periodRule: row.periodRule,
  primaryCurrency: row.primaryCurrency,
  showConvertedTotals: row.showConvertedTotals,
  weekendDays: row.weekendDays,
});

export const createServices = (db: Db, options: ServiceOptions = {}) => {
  const assertCurrency = async (code: string) => {
    const [known] = await db
      .select({ code: currencies.code })
      .from(currencies)
      .where(eq(currencies.code, code.toUpperCase()))
      .limit(1);

    if (!known) throw new ServiceError(`Unknown currency ${code}`);
  };

  return {
    accounts: createAccountService(db),
    auth: createAuthService(db),
    bootstrap: (userId: string, primaryCurrency?: string) =>
      ensureUserBootstrap(db, userId, primaryCurrency),
    budgets: createBudgetService(db),
    categories: createCategoryService(db),
    db,
    forecast: createForecastService(db),
    fx: createFxService(db, [new ManualRateProvider(db)]),
    async getSettings(userId: string): Promise<UserSettings> {
      const [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

      return toSettings(settings ?? notFound('Settings'));
    },
    imports: createImportService(db),
    ledger: createLedgerService(db),
    async listCurrencies(): Promise<Currency[]> {
      return db
        .select()
        .from(currencies)
        .where(eq(currencies.isActive, true))
        .orderBy(asc(currencies.code));
    },
    payees: createPayeeService(db),
    periods: createPeriodService(db),
    recurring: createRecurringService(db),
    reports: createReportService(db),
    rules: createRuleService(db),
    sessions: createSessionStore(db, {
      maxAgeDays: options.sessionMaxAgeDays ?? DEFAULT_SESSION_MAX_AGE_DAYS,
      sessionDays: options.sessionDays ?? DEFAULT_SESSION_DAYS,
    }),
    templates: createTemplateService(db),
    async updateSettings(
      userId: string,
      data: {
        allowEmoji?: boolean;
        locale?: string;
        periodRule?: PeriodRuleValues;
        primaryCurrency?: string;
        showConvertedTotals?: boolean;
        weekendDays?: number[];
      }
    ): Promise<UserSettings> {
      const patch = {
        ...data,
        weekendDays: data.weekendDays
          ? [...new Set(data.weekendDays)].toSorted((left, right) => left - right)
          : undefined,
      };

      if (data.primaryCurrency) {
        await assertCurrency(data.primaryCurrency);
        patch.primaryCurrency = data.primaryCurrency.toUpperCase();
      }

      const [updated] = await db
        .update(userSettings)
        .set(patch)
        .where(eq(userSettings.userId, userId))
        .returning();

      return toSettings(updated ?? notFound('Settings'));
    },
  };
};

export type Services = ReturnType<typeof createServices>;
