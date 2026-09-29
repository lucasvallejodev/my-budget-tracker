import { eq } from 'drizzle-orm';

import { normaliseEmail } from '@/auth/service';
import { users } from '@/db/schema';
import { payeeNameKey, resolvePayeesByName } from '@/modules/payees/service';
import type { Services } from '@/modules/services';

import type { DemoCredentials } from './credentials';
import { type AccountKey, DemoAccounts, DemoFxRate, DemoUser } from './persona';
import { buildDemoPlan, type DemoPlan, type StandardEntry, type TransferEntry } from './plan';
import { DemoRules } from './spending';

export type DemoSeedResult = {
  accounts: number;
  budgets: number;
  email: string;
  transactions: number;
  userId: string;
};

type Lookups = {
  accountIds: Record<AccountKey, string>;
  categoryIds: Map<string, string>;
  payeeIds: Map<string, string>;
};

const removeDemoUser = async (services: Services, email: string): Promise<void> => {
  const [existing] = await services.db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.email, normaliseEmail(email)));

  if (!existing) return;

  if (existing.name !== DemoUser.name) {
    throw new Error(
      `${email} belongs to an account that is not the demo user; choose another DEMO_USER_EMAIL.`
    );
  }

  await services.db.delete(users).where(eq(users.id, existing.id));
};

const createAccounts = async (
  services: Services,
  userId: string,
  openingDate: string
): Promise<Record<AccountKey, string>> => {
  const accountIds = {} as Record<AccountKey, string>;

  for (const [key, account] of Object.entries(DemoAccounts) as [
    AccountKey,
    (typeof DemoAccounts)[AccountKey],
  ][]) {
    const created = await services.accounts.create(userId, { ...account, openingDate });

    accountIds[key] = created.id;
  }

  return accountIds;
};

const categoryIdsByName = async (
  services: Services,
  userId: string
): Promise<Map<string, string>> => {
  const tree = await services.categories.tree(userId);

  return new Map(
    tree.flatMap(group => group.categories.map(category => [category.name, category.id]))
  );
};

const payeeIdsByName = async (
  services: Services,
  userId: string,
  plan: DemoPlan
): Promise<Map<string, string>> => {
  const names = plan.entries.flatMap(entry =>
    entry.kind === 'standard' && entry.payee ? [entry.payee] : []
  );

  const payees = await resolvePayeesByName(services.db, userId, names);

  return new Map([...payees].map(([key, payee]) => [key, payee.id]));
};

const categoryId = (lookups: Lookups, name: string): string => {
  const id = lookups.categoryIds.get(name);

  if (!id) throw new Error(`The default taxonomy has no category named ${name}`);

  return id;
};

const recordStandard = (
  services: Services,
  userId: string,
  lookups: Lookups,
  entry: StandardEntry
) =>
  services.ledger.createStandard(userId, {
    accountId: lookups.accountIds[entry.account],
    amountMinor: entry.amountMinor,
    categoryId: entry.category ? categoryId(lookups, entry.category) : null,
    date: entry.date,
    memo: entry.memo,
    originalPayee: entry.bankDescription ?? null,
    payeeId: entry.payee ? lookups.payeeIds.get(payeeNameKey(entry.payee)) : null,
    status: entry.status,
  });

const recordTransfer = (
  services: Services,
  userId: string,
  lookups: Lookups,
  entry: TransferEntry
) =>
  services.ledger.createTransfer(userId, {
    amountFromMinor: entry.amountFromMinor,
    amountToMinor: entry.amountToMinor,
    date: entry.date,
    fromAccountId: lookups.accountIds[entry.from],
    memo: entry.memo,
    toAccountId: lookups.accountIds[entry.to],
  });

const recordEntries = async (
  services: Services,
  userId: string,
  lookups: Lookups,
  plan: DemoPlan
): Promise<void> => {
  for (const entry of plan.entries) {
    if (entry.kind === 'standard') await recordStandard(services, userId, lookups, entry);
    else await recordTransfer(services, userId, lookups, entry);
  }
};

const recordPlanning = async (
  services: Services,
  userId: string,
  lookups: Lookups,
  plan: DemoPlan
): Promise<void> => {
  for (const date of [plan.openingDate, ...plan.months.map(month => `${month}-01`)]) {
    await services.fx.upsert(userId, { ...DemoFxRate, date });
  }

  for (const budget of plan.budgets) {
    await services.budgets.upsert(userId, {
      amountMinor: budget.amountMinor,
      categoryId: categoryId(lookups, budget.category),
      currency: DemoFxRate.base,
      month: budget.month,
    });
  }

  for (const rule of DemoRules) {
    await services.rules.create(userId, {
      categoryId: categoryId(lookups, rule.category),
      name: rule.name,
      pattern: rule.pattern,
    });
  }
};

export const seedDemoAccount = async (
  services: Services,
  today: string,
  credentials: DemoCredentials
): Promise<DemoSeedResult> => {
  const plan = buildDemoPlan(today);

  await removeDemoUser(services, credentials.email);

  const user = await services.auth.signUp({ ...credentials, name: DemoUser.name });

  await services.updateSettings(user.id, {
    primaryCurrency: DemoFxRate.base,
    showConvertedTotals: true,
  });

  const lookups: Lookups = {
    accountIds: await createAccounts(services, user.id, plan.openingDate),
    categoryIds: await categoryIdsByName(services, user.id),
    payeeIds: await payeeIdsByName(services, user.id, plan),
  };

  await recordEntries(services, user.id, lookups, plan);
  await recordPlanning(services, user.id, lookups, plan);

  return {
    accounts: Object.keys(lookups.accountIds).length,
    budgets: plan.budgets.length,
    email: user.email,
    transactions: plan.entries.length,
    userId: user.id,
  };
};
