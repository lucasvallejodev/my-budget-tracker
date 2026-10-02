import { eq } from 'drizzle-orm';

import { normaliseEmail } from '@/auth/service';
import { users } from '@/db/schema';
import { payeeNameKey, resolvePayeesByName } from '@/modules/payees/service';
import type { Services } from '@/modules/services';
import {
  periodFor,
  periodRange,
  type PeriodSettings,
  ruleStart,
} from '@coinkeeper/shared/lib/periods';
import { DefaultWeekendDays } from '@coinkeeper/shared/schema/settings';

import type { DemoCredentials } from './credentials';
import { DeletedTemplate, type DemoTemplate, DemoTemplates } from './events';
import { type AccountKey, DemoAccounts, DemoFxRate, DemoUser } from './persona';
import { buildDemoPlan, type DemoPlan, type StandardEntry, type TransferEntry } from './plan';
import { demoSeries } from './recurring';
import { DemoRules } from './spending';

export type DemoSeedResult = {
  accounts: number;
  budgets: number;
  email: string;
  series: number;
  templates: number;
  transactions: number;
  userId: string;
};

type Lookups = {
  accountIds: Record<AccountKey, string>;
  categoryIds: Map<string, string>;
  payeeIds: Map<string, string>;
  templateIds: Map<string, string>;
};

export const DemoPeriodSettings: PeriodSettings = {
  rule: { kind: 'before_month_end', workingDays: 2 },
  weekendDays: DefaultWeekendDays,
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
  const names = [
    ...plan.entries.flatMap(entry =>
      entry.kind === 'standard' && entry.payee ? [entry.payee] : []
    ),
    ...demoSeries(plan).map(series => series.payee),
    ...[...DemoTemplates, DeletedTemplate].flatMap(template =>
      template.payee ? [template.payee] : []
    ),
  ];

  const payees = await resolvePayeesByName(services.db, userId, names);

  return new Map([...payees].map(([key, payee]) => [key, payee.id]));
};

const categoryId = (lookups: Lookups, name: string): string => {
  const id = lookups.categoryIds.get(name);

  if (!id) throw new Error(`The default taxonomy has no category named ${name}`);

  return id;
};

const payeeId = (lookups: Lookups, name: string | null | undefined) =>
  name ? (lookups.payeeIds.get(payeeNameKey(name)) ?? null) : null;

const recordStandard = async (
  services: Services,
  userId: string,
  lookups: Lookups,
  entry: StandardEntry
) => {
  const row = await services.ledger.createStandard(userId, {
    accountId: lookups.accountIds[entry.account],
    amountMinor: entry.amountMinor,
    categoryId: entry.category ? categoryId(lookups, entry.category) : null,
    date: entry.date,
    memo: entry.memo,
    originalPayee: entry.bankDescription ?? null,
    payeeId: payeeId(lookups, entry.payee),
    splits: entry.splits?.map(line => ({
      amountMinor: line.amountMinor,
      categoryId: categoryId(lookups, line.category),
      memo: '',
    })),
    status: entry.status,
    templateId: entry.payee ? lookups.templateIds.get(entry.payee) : undefined,
  });

  if (entry.deleted) await services.ledger.remove(userId, row.id);
};

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

const templateInput = (lookups: Lookups, template: DemoTemplate) => ({
  accountId: template.account ? lookups.accountIds[template.account] : null,
  amountMinor: template.amountMinor,
  categoryId: template.category ? categoryId(lookups, template.category) : null,
  kind: template.kind,
  memo: '',
  name: template.name,
  payeeId: payeeId(lookups, template.payee),
  transferAccountId: template.to ? lookups.accountIds[template.to] : null,
});

const createTemplates = async (
  services: Services,
  userId: string,
  lookups: Omit<Lookups, 'templateIds'>
): Promise<Map<string, string>> => {
  const byPayee = new Map<string, string>();

  for (const template of DemoTemplates) {
    const created = await services.templates.create(
      userId,
      templateInput({ ...lookups, templateIds: byPayee }, template)
    );

    if (template.payee) byPayee.set(template.payee, created.id);
  }

  const deleted = await services.templates.create(
    userId,
    templateInput({ ...lookups, templateIds: byPayee }, DeletedTemplate)
  );

  await services.templates.remove(userId, deleted.id);

  return byPayee;
};

const createSeries = async (
  services: Services,
  userId: string,
  lookups: Lookups,
  plan: DemoPlan
): Promise<number> => {
  const all = demoSeries(plan);

  for (const series of all) {
    const created = await services.recurring.create(
      userId,
      {
        accountId: lookups.accountIds[series.account],
        amountMinor: series.amountMinor,
        anchorDate: series.anchorDate,
        cadence: series.cadence,
        categoryId: categoryId(lookups, series.category),
        endDate: null,
        interval: series.interval,
        kind: series.kind,
        matchWindowDays: series.matchWindowDays,
        name: series.name,
        payeeId: payeeId(lookups, series.payee),
        recordMode: series.recordMode ?? 'match_only',
      },
      { today: plan.today }
    );

    if (series.deleted) await services.recurring.remove(userId, created.id);
  }

  return all.filter(series => !series.deleted).length;
};

const moveCurrentPeriodToPayday = async (
  services: Services,
  userId: string,
  plan: DemoPlan
): Promise<void> => {
  await services.updateSettings(userId, {
    periodRule: DemoPeriodSettings.rule,
    weekendDays: DemoPeriodSettings.weekendDays,
  });

  const current = periodFor(plan.today, DemoPeriodSettings);
  const payday = plan.paydays.filter(date => date <= current.from).at(-1);
  const previous = periodRange(previousKey(current.key), DemoPeriodSettings);

  if (!payday || payday === ruleStart(current.key, DemoPeriodSettings)) return;
  if (payday <= previous.from) return;

  await services.periods.move(userId, current.key, payday);
};

const MONTH_KEY_LENGTH = 7;

const previousKey = (key: string): string => {
  const date = new Date(`${key}-01T00:00:00Z`);

  date.setUTCMonth(date.getUTCMonth() - 1);

  return date.toISOString().slice(0, MONTH_KEY_LENGTH);
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

  const references = {
    accountIds: await createAccounts(services, user.id, plan.openingDate),
    categoryIds: await categoryIdsByName(services, user.id),
    payeeIds: await payeeIdsByName(services, user.id, plan),
  };

  const lookups: Lookups = {
    ...references,
    templateIds: await createTemplates(services, user.id, references),
  };

  const series = await createSeries(services, user.id, lookups, plan);

  await recordEntries(services, user.id, lookups, plan);
  await recordPlanning(services, user.id, lookups, plan);
  await moveCurrentPeriodToPayday(services, user.id, plan);

  return {
    accounts: Object.keys(lookups.accountIds).length,
    budgets: plan.budgets.length,
    email: user.email,
    series,
    templates: DemoTemplates.length,
    transactions: plan.entries.length,
    userId: user.id,
  };
};
