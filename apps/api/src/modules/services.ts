import { asc, eq } from 'drizzle-orm';

import { createAuthService } from '@/auth/service';
import { createSessionStore } from '@/auth/sessions';
import { currencies, userSettings } from '@/db/schema';
import type { Currency } from '@coinkeeper/shared/schema/currencies';
import type { UserSettings } from '@coinkeeper/shared/schema/settings';

import { createAccountService } from './accounts/service';
import { createBudgetService } from './budgets/service';
import { ensureUserBootstrap } from './categories/seed';
import { createCategoryService } from './categories/service';
import { Db, notFound, ServiceError } from './db';
import { createFxService, ManualRateProvider } from './fx/service';
import { createImportService } from './import/service';
import { createLedgerService } from './ledger/service';
import { createPayeeService } from './payees/service';
import { createReportService } from './reports/service';
import { createRuleService } from './rules/service';

const DEFAULT_SESSION_DAYS = 30;

type ServiceOptions = { sessionDays?: number };

const toSettings = (row: typeof userSettings.$inferSelect): UserSettings => ({
  locale: row.locale,
  primaryCurrency: row.primaryCurrency,
  showConvertedTotals: row.showConvertedTotals,
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
    reports: createReportService(db),
    rules: createRuleService(db),
    sessions: createSessionStore(db, options.sessionDays ?? DEFAULT_SESSION_DAYS),
    async updateSettings(
      userId: string,
      data: {
        locale?: string;
        primaryCurrency?: string;
        showConvertedTotals?: boolean;
      }
    ): Promise<UserSettings> {
      const patch = { ...data };

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
