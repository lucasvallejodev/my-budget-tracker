'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/server/auth/require-user';
import { ServiceError } from '@/server/db';
import type { ColumnMapping, Preview } from '@/server/import/service';
import { parseAmountInput } from '@/lib/money';
import {
  accountFormSchema,
  AccountFormValues,
  updateAccountSchema,
  UpdateAccountValues,
} from '@/schema/accounts';
import { payeeFormSchema, PayeeFormValues, updatePayeeSchema } from '@/schema/payees';
import {
  standardTransactionSchema,
  StandardTransactionValues,
  transferSchema,
  TransferValues,
} from '@/schema/transaction';
import {
  categoryFormSchema,
  CategoryFormValues,
  categoryGroupFormSchema,
  CategoryGroupFormValues,
} from '@/schema/categories';

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new ServiceError(result.error.issues[0]?.message ?? 'Invalid input');
  return result.data;
}

/** Actions throw plain Errors so React Query surfaces `error.message` to the user. */
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

// Accounts -------------------------------------------------------------------------------

export async function createAccountAction(form: AccountFormValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
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
    const { userId, services } = await requireUser();
    const { id, ...data } = parse(updateAccountSchema, form);
    const account = await services.accounts.update(userId, id, data);
    refresh();
    return account;
  });
}

export async function archiveAccountAction(id: string, archived = true) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.accounts.archive(userId, id, archived);
    refresh();
  });
}

// Payees ---------------------------------------------------------------------------------

export async function createPayeeAction(form: PayeeFormValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const data = parse(payeeFormSchema, form);
    return services.payees.create(userId, {
      name: data.name,
      defaultCategoryId: data.defaultCategoryId || null,
    });
  });
}

export async function updatePayeeAction(form: z.infer<typeof updatePayeeSchema>) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const { id, ...data } = parse(updatePayeeSchema, form);
    return services.payees.update(userId, id, {
      ...data,
      defaultCategoryId:
        data.defaultCategoryId === undefined ? undefined : data.defaultCategoryId || null,
    });
  });
}

// Transactions ---------------------------------------------------------------------------

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
    date: data.date,
    categoryId: data.categoryId || null,
    payeeId: data.payeeId || null,
    memo: data.memo,
    status: data.status,
    excluded: data.excluded,
  };
}

export async function createTransactionAction(form: StandardTransactionValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
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
    const { userId, services } = await requireUser();
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
    const { userId, services } = await requireUser();
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
    const { userId, services } = await requireUser();
    await services.ledger.remove(userId, id);
    refresh();
  });
}

export async function setTransactionStatusAction(
  id: string,
  status: 'pending' | 'cleared' | 'reconciled'
) {
  return run(async () => {
    const { userId, services } = await requireUser();
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
    fromAccountId: data.fromAccountId,
    toAccountId: data.toAccountId,
    amountFromMinor,
    amountToMinor,
    date: data.date,
    memo: data.memo,
    status: data.status,
  };
}

export async function createTransferAction(form: TransferValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
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
    const { userId, services } = await requireUser();
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

// Categories -----------------------------------------------------------------------------

export async function createCategoryGroupAction(form: CategoryGroupFormValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
    return services.categories.createGroup(userId, parse(categoryGroupFormSchema, form));
  });
}

export async function updateCategoryGroupAction(
  id: string,
  form: Partial<CategoryGroupFormValues>
) {
  return run(async () => {
    const { userId, services } = await requireUser();
    return services.categories.updateGroup(
      userId,
      id,
      parse(categoryGroupFormSchema.partial(), form)
    );
  });
}

export async function archiveCategoryGroupAction(id: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.categories.archiveGroup(userId, id);
  });
}

export async function reorderCategoryGroupsAction(orderedIds: string[]) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.categories.reorderGroups(userId, orderedIds);
  });
}

export async function createCategoryAction(form: CategoryFormValues) {
  return run(async () => {
    const { userId, services } = await requireUser();
    return services.categories.createCategory(userId, parse(categoryFormSchema, form));
  });
}

export async function updateCategoryAction(id: string, form: Partial<CategoryFormValues>) {
  return run(async () => {
    const { userId, services } = await requireUser();
    return services.categories.updateCategory(
      userId,
      id,
      parse(categoryFormSchema.partial(), form)
    );
  });
}

export async function reorderCategoriesAction(groupId: string, orderedIds: string[]) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.categories.reorderCategories(userId, groupId, orderedIds);
  });
}

export async function archiveCategoryAction(id: string, moveToId?: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.categories.archiveCategory(userId, id, moveToId);
    refresh();
  });
}

export async function restoreCategoryAction(id: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.categories.restoreCategory(userId, id);
  });
}

// Settings -------------------------------------------------------------------------------

export async function updateSettingsAction(data: {
  primaryCurrency?: string;
  locale?: string;
  showConvertedTotals?: boolean;
}) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const parsed = parse(
      z.object({
        primaryCurrency: z.string().length(3).optional(),
        locale: z.string().min(2).max(20).optional(),
        showConvertedTotals: z.boolean().optional(),
      }),
      data
    );
    const settings = await services.updateSettings(userId, parsed);
    refresh();
    return settings;
  });
}

// Exchange rates ---------------------------------------------------------------------------

export async function upsertExchangeRateAction(data: {
  base: string;
  quote: string;
  date: string;
  rate: string;
}) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const parsed = parse(
      z.object({
        base: z.string().length(3),
        quote: z.string().length(3),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
        rate: z.string().trim().min(1, 'Rate is required'),
      }),
      data
    );
    const rate = Number(parsed.rate.replace(',', '.'));
    if (!Number.isFinite(rate) || rate <= 0)
      throw new ServiceError('The rate must be a positive number');
    const row = await services.fx.upsert(userId, { ...parsed, rate });
    refresh();
    return row;
  });
}

export async function deleteExchangeRateAction(key: { base: string; quote: string; date: string }) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.fx.remove(userId, key);
    refresh();
  });
}

// Rules ----------------------------------------------------------------------------------

export async function createRuleAction(data: {
  name?: string;
  pattern: string;
  categoryId: string;
}) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const parsed = parse(
      z.object({
        name: z.string().max(80).optional(),
        pattern: z.string().trim().min(1, 'Pattern is required').max(120),
        categoryId: z.string().min(1, 'Choose a category'),
      }),
      data
    );
    return services.rules.create(userId, parsed);
  });
}

export async function deleteRuleAction(id: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.rules.remove(userId, id);
  });
}

export async function applyRulesAction() {
  return run(async () => {
    const { userId, services } = await requireUser();
    const updated = await services.rules.applyToUncategorized(userId);
    refresh();
    return { updated };
  });
}

// Import ---------------------------------------------------------------------------------

export async function previewImportAction(input: {
  accountId: string;
  csv: string;
  mapping: ColumnMapping;
}) {
  return run(async () => {
    const { userId, services } = await requireUser();
    if (input.csv.length > 2_000_000) throw new ServiceError('File is too large (2 MB max)');
    return services.imports.preview(userId, input);
  });
}

export async function commitImportAction(preview: Preview) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const result = await services.imports.commit(userId, preview);
    const suggestions = await services.imports.transferSuggestions(userId, result.insertedIds);
    refresh();
    return { ...result, suggestions };
  });
}

export async function transferSuggestionsAction() {
  return run(async () => {
    const { userId, services } = await requireUser();
    return services.imports.transferSuggestions(userId);
  });
}

export async function linkTransferAction(outId: string, inId: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const result = await services.ledger.linkAsTransfer(userId, outId, inId);
    refresh();
    return result;
  });
}

// Budgets --------------------------------------------------------------------------------

export async function upsertBudgetAction(data: {
  categoryId: string;
  month: string;
  currency: string;
  amount: string;
}) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const parsed = parse(
      z.object({
        categoryId: z.string().min(1, 'Choose a category'),
        month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
        currency: z.string().length(3),
        amount: z.string().trim().min(1, 'Amount is required'),
      }),
      data
    );
    const amountMinor = Math.abs(parseAmountInput(parsed.amount, parsed.currency));
    const row = await services.budgets.upsert(userId, { ...parsed, amountMinor });
    refresh();
    return row;
  });
}

export async function deleteBudgetAction(id: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    await services.budgets.remove(userId, id);
    refresh();
  });
}

export async function copyBudgetsAction(month: string) {
  return run(async () => {
    const { userId, services } = await requireUser();
    const copied = await services.budgets.copyFromPreviousMonth(userId, month);
    refresh();
    return { copied };
  });
}
