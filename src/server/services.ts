import { asc, eq } from 'drizzle-orm';
import { currencies, userSettings } from '@/db/schema';
import { getDb } from '@/db';
import { Db } from './db';
import { createAccountService } from './accounts/service';
import { createCategoryService } from './categories/service';
import { createLedgerService } from './ledger/service';
import { createPayeeService } from './payees/service';
import { createReportService } from './reports/service';
import { ensureUserBootstrap } from './categories/seed';
import { createFxService, ManualRateProvider } from './fx/service';
import { createImportService } from './import/service';
import { createRuleService } from './rules/service';
import { createBudgetService } from './budgets/service';

export const createServices = (db: Db) => ({
  db,
  accounts: createAccountService(db),
  categories: createCategoryService(db),
  ledger: createLedgerService(db),
  payees: createPayeeService(db),
  reports: createReportService(db),
  // Register additional RateProvider implementations here to automate rates later.
  fx: createFxService(db, [new ManualRateProvider(db)]),
  rules: createRuleService(db),
  imports: createImportService(db),
  budgets: createBudgetService(db),
  bootstrap: (userId: string, primaryCurrency?: string) =>
    ensureUserBootstrap(db, userId, primaryCurrency),
  async listCurrencies() {
    return db
      .select()
      .from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(asc(currencies.code));
  },
  async getSettings(userId: string) {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return settings;
  },
  async updateSettings(
    userId: string,
    data: {
      primaryCurrency?: string;
      locale?: string;
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
