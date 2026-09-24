import { asc, eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { currencies, userSettings } from '@/db/schema';

import { createAccountService } from './accounts/service';
import { createBudgetService } from './budgets/service';
import { ensureUserBootstrap } from './categories/seed';
import { createCategoryService } from './categories/service';
import { Db } from './db';
import { createFxService, ManualRateProvider } from './fx/service';
import { createImportService } from './import/service';
import { createLedgerService } from './ledger/service';
import { createPayeeService } from './payees/service';
import { createReportService } from './reports/service';
import { createRuleService } from './rules/service';

export const createServices = (db: Db) => ({
  accounts: createAccountService(db),
  bootstrap: (userId: string, primaryCurrency?: string) =>
    ensureUserBootstrap(db, userId, primaryCurrency),
  budgets: createBudgetService(db),
  categories: createCategoryService(db),
  db,
  fx: createFxService(db, [new ManualRateProvider(db)]),
  async getSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return settings;
  },
  imports: createImportService(db),
  ledger: createLedgerService(db),
  async listCurrencies() {
    return db
      .select()
      .from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(asc(currencies.code));
  },
  payees: createPayeeService(db),
  reports: createReportService(db),
  rules: createRuleService(db),
  async updateSettings(
    userId: string,
    data: {
      locale?: string;
      primaryCurrency?: string;
      showConvertedTotals?: boolean;
    }
  ) {
    const [updated] = await db
      .update(userSettings)
      .set(data)
      .where(eq(userSettings.userId, userId))
      .returning();

    return updated;
  },
});

export type Services = ReturnType<typeof createServices>;

let cached: Services | undefined;

export const getServices = (): Services => (cached ??= createServices(getDb()));
