'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { parseAmountInput } from '@/lib/money';
import {
  accountFormSchema,
  AccountFormValues,
  updateAccountSchema,
  UpdateAccountValues,
} from '@/schema/accounts';
import { budgetFormSchema, BudgetFormValues } from '@/schema/budgets';
import {
  categoryFormSchema,
  CategoryFormValues,
  categoryGroupFormSchema,
  CategoryGroupFormValues,
} from '@/schema/categories';
import {
  exchangeRateFormSchema,
  ExchangeRateFormValues,
  ExchangeRateKey,
  exchangeRateKeySchema,
} from '@/schema/exchange-rates';
import { ColumnMapping, columnMappingSchema, Preview, previewSchema } from '@/schema/imports';
import {
  payeeFormSchema,
  PayeeFormValues,
  updatePayeeSchema,
  UpdatePayeeValues,
} from '@/schema/payees';
import { ruleFormSchema, RuleFormValues } from '@/schema/rules';
import { settingsFormSchema, SettingsFormValues } from '@/schema/settings';
import {
  standardTransactionSchema,
  StandardTransactionValues,
  transferSchema,
  TransferValues,
} from '@/schema/transaction';
import { requireUser } from '@/server/auth/require-user';
import { ServiceError } from '@/server/db';

const MaxImportCsvLength = 2_000_000;

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) throw new ServiceError(result.error.issues[0]?.message ?? 'Invalid input');

  return result.data;
}

async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ServiceError) throw new Error(error.message);
    throw error;
  }
}

function refresh() {
  revalidatePath('/', 'layout');
}

export async function createAccountAction(form: AccountFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(accountFormSchema, form);

    const openingBalanceMinor = data.openingBalance?.trim()
      ? parseAmountInput(data.openingBalance, data.currency)
      : 0;

    const account = await services.accounts.create(userId, { ...data, openingBalanceMinor });

    refresh();

    return account;
  });
}

export async function updateAccountAction(form: UpdateAccountValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const { id, ...data } = parse(updateAccountSchema, form);
    const account = await services.accounts.update(userId, id, data);

    refresh();

    return account;
  });
}

export async function archiveAccountAction(id: string, archived = true) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.accounts.archive(userId, id, archived);
    refresh();
  });
}

export async function createPayeeAction(form: PayeeFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(payeeFormSchema, form);

    return services.payees.create(userId, {
      defaultCategoryId: data.defaultCategoryId || null,
      name: data.name,
    });
  });
}

export async function updatePayeeAction(form: UpdatePayeeValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const { id, ...data } = parse(updatePayeeSchema, form);

    return services.payees.update(userId, id, {
      ...data,
      defaultCategoryId:
        data.defaultCategoryId === undefined ? undefined : data.defaultCategoryId || null,
    });
  });
}

async function toStandardInput(
  services: Awaited<ReturnType<typeof requireUser>>['services'],
  userId: string,
  data: StandardTransactionValues
) {
  const account = await services.accounts.owned(userId, data.accountId);
  const magnitude = Math.abs(parseAmountInput(data.amount, account.currency));

  if (magnitude === 0) throw new ServiceError('Amount must not be zero');

  return {
    accountId: data.accountId,
    amountMinor: data.direction === 'expense' ? -magnitude : magnitude,
    categoryId: data.categoryId || null,
    date: data.date,
    excluded: data.excluded,
    memo: data.memo,
    payeeId: data.payeeId || null,
    status: data.status,
  };
}

export async function createTransactionAction(form: StandardTransactionValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(standardTransactionSchema, form);

    const row = await services.ledger.createStandard(
      userId,
      await toStandardInput(services, userId, data)
    );

    refresh();

    return row;
  });
}

export async function updateTransactionAction(id: string, form: StandardTransactionValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(standardTransactionSchema, form);

    const row = await services.ledger.updateStandard(
      userId,
      id,
      await toStandardInput(services, userId, data)
    );

    refresh();

    return row;
  });
}

export async function categorizeTransactionAction(id: string, categoryId: string | null) {
  return run(async () => {
    const { services, userId } = await requireUser();

    const row = await services.ledger.updateStandard(userId, id, {
      categoryId,
      needsReview: false,
    });

    refresh();

    return row;
  });
}

export async function deleteTransactionAction(id: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.ledger.remove(userId, id);
    refresh();
  });
}

export async function setTransactionStatusAction(
  id: string,
  status: 'pending' | 'cleared' | 'reconciled'
) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.ledger.setStatus(userId, id, status);
    refresh();
  });
}

async function toTransferInput(
  services: Awaited<ReturnType<typeof requireUser>>['services'],
  userId: string,
  data: TransferValues
) {
  const from = await services.accounts.owned(userId, data.fromAccountId);
  const to = await services.accounts.owned(userId, data.toAccountId);
  const amountFromMinor = Math.abs(parseAmountInput(data.amountFrom, from.currency));

  const amountToMinor = data.amountTo?.trim()
    ? Math.abs(parseAmountInput(data.amountTo, to.currency))
    : undefined;

  return {
    amountFromMinor,
    amountToMinor,
    date: data.date,
    fromAccountId: data.fromAccountId,
    memo: data.memo,
    status: data.status,
    toAccountId: data.toAccountId,
  };
}

export async function createTransferAction(form: TransferValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(transferSchema, form);

    const result = await services.ledger.createTransfer(
      userId,
      await toTransferInput(services, userId, data)
    );

    refresh();

    return result;
  });
}

export async function updateTransferAction(transferId: string, form: TransferValues) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const data = parse(transferSchema, form);

    const result = await services.ledger.updateTransfer(
      userId,
      transferId,
      await toTransferInput(services, userId, data)
    );

    refresh();

    return result;
  });
}

export async function createCategoryGroupAction(form: CategoryGroupFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    return services.categories.createGroup(userId, parse(categoryGroupFormSchema, form));
  });
}

export async function updateCategoryGroupAction(
  id: string,
  form: Partial<CategoryGroupFormValues>
) {
  return run(async () => {
    const { services, userId } = await requireUser();

    return services.categories.updateGroup(
      userId,
      id,
      parse(categoryGroupFormSchema.partial(), form)
    );
  });
}

export async function archiveCategoryGroupAction(id: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.categories.archiveGroup(userId, id);
  });
}

export async function reorderCategoryGroupsAction(orderedIds: string[]) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.categories.reorderGroups(userId, orderedIds);
  });
}

export async function createCategoryAction(form: CategoryFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    return services.categories.createCategory(userId, parse(categoryFormSchema, form));
  });
}

export async function updateCategoryAction(id: string, form: Partial<CategoryFormValues>) {
  return run(async () => {
    const { services, userId } = await requireUser();

    return services.categories.updateCategory(
      userId,
      id,
      parse(categoryFormSchema.partial(), form)
    );
  });
}

export async function reorderCategoriesAction(groupId: string, orderedIds: string[]) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.categories.reorderCategories(userId, groupId, orderedIds);
  });
}

export async function archiveCategoryAction(id: string, moveToId?: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.categories.archiveCategory(userId, id, moveToId);
    refresh();
  });
}

export async function restoreCategoryAction(id: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.categories.restoreCategory(userId, id);
  });
}

export async function updateSettingsAction(data: SettingsFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    const parsed = parse(settingsFormSchema, data);

    const settings = await services.updateSettings(userId, parsed);

    refresh();

    return settings;
  });
}

export async function upsertExchangeRateAction(data: ExchangeRateFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    const parsed = parse(exchangeRateFormSchema, data);

    const rate = Number(parsed.rate.replace(',', '.'));

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new ServiceError('The rate must be a positive number');
    }

    const row = await services.fx.upsert(userId, { ...parsed, rate });

    refresh();

    return row;
  });
}

export async function deleteExchangeRateAction(key: ExchangeRateKey) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.fx.remove(userId, parse(exchangeRateKeySchema, key));
    refresh();
  });
}

export async function createRuleAction(data: RuleFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    const parsed = parse(ruleFormSchema, data);

    return services.rules.create(userId, parsed);
  });
}

export async function deleteRuleAction(id: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.rules.remove(userId, id);
  });
}

export async function applyRulesAction() {
  return run(async () => {
    const { services, userId } = await requireUser();
    const updated = await services.rules.applyToUncategorized(userId);

    refresh();

    return { updated };
  });
}

export async function previewImportAction(input: {
  accountId: string;
  csv: string;
  mapping: ColumnMapping;
}) {
  return run(async () => {
    const { services, userId } = await requireUser();

    if (input.csv.length > MaxImportCsvLength) {
      throw new ServiceError('File is too large (2 MB max)');
    }

    return services.imports.preview(userId, {
      ...input,
      mapping: parse(columnMappingSchema, input.mapping),
    });
  });
}

export async function commitImportAction(preview: Preview) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const result = await services.imports.commit(userId, parse(previewSchema, preview));
    const suggestions = await services.imports.transferSuggestions(userId, result.insertedIds);

    refresh();

    return { ...result, suggestions };
  });
}

export async function transferSuggestionsAction() {
  return run(async () => {
    const { services, userId } = await requireUser();

    return services.imports.transferSuggestions(userId);
  });
}

export async function linkTransferAction(outId: string, inId: string) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const result = await services.ledger.linkAsTransfer(userId, outId, inId);

    refresh();

    return result;
  });
}

export async function upsertBudgetAction(data: BudgetFormValues) {
  return run(async () => {
    const { services, userId } = await requireUser();

    const parsed = parse(budgetFormSchema, data);

    const amountMinor = Math.abs(parseAmountInput(parsed.amount, parsed.currency));
    const row = await services.budgets.upsert(userId, { ...parsed, amountMinor });

    refresh();

    return row;
  });
}

export async function deleteBudgetAction(id: string) {
  return run(async () => {
    const { services, userId } = await requireUser();

    await services.budgets.remove(userId, id);
    refresh();
  });
}

export async function copyBudgetsAction(month: string) {
  return run(async () => {
    const { services, userId } = await requireUser();
    const copied = await services.budgets.copyFromPreviousMonth(userId, month);

    refresh();

    return { copied };
  });
}
