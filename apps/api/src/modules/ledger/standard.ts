import { and, eq, isNotNull, isNull } from 'drizzle-orm';

import { accounts, categories, transactions } from '@/db/schema';

import { conflict, notFound, ServiceError } from '../db';
import type { Db, DbOrTx } from '../db';
import { isUniqueViolation } from '../errors';
import type { createPayeeService } from '../payees/service';
import { markTemplateUsed } from '../templates/service';
import {
  assertCategory,
  assertDate,
  assertEditable,
  assertNonZeroAmount,
  assertPayee,
  ownedAccount,
  ownedTransaction,
} from './guards';
import { get } from './queries';
import {
  assertSplitCategories,
  assertSplitLines,
  hasLiveSplits,
  removeSplits,
  replaceSplits,
  uncategorizeArchivedLines,
} from './splits';
import type {
  SplitInput,
  StandardInput,
  TransactionPatch,
  TransactionRecord,
  TransactionRow,
} from './types';

type PayeeService = ReturnType<typeof createPayeeService>;

export type LedgerContext = {
  db: Db;
  payeeService: PayeeService;
};

type Account = Awaited<ReturnType<typeof ownedAccount>>;

export const standardInsertValues = (
  userId: string,
  account: Account,
  input: StandardInput
): typeof transactions.$inferInsert => ({
  accountId: account.id,
  amountMinor: input.amountMinor,
  categoryId: input.categoryId || null,
  currency: account.currency,
  date: input.date,
  excluded: input.excluded ?? false,
  importId: input.importId || null,
  kind: 'standard',
  memo: input.memo?.trim() ?? '',
  needsReview: input.needsReview ?? !input.categoryId,
  originalPayee: input.originalPayee || null,
  payeeId: input.payeeId || null,
  status: input.status ?? 'cleared',
  userId,
});

const referencePatch = (input: Partial<StandardInput>): TransactionPatch => {
  const patch: TransactionPatch = {};

  if (input.categoryId !== undefined) {
    patch.categoryId = input.categoryId || null;
    patch.needsReview = input.needsReview ?? !input.categoryId;
  }

  if (input.payeeId !== undefined) patch.payeeId = input.payeeId || null;

  return patch;
};

const fieldPatch = (input: Partial<StandardInput>): TransactionPatch => {
  const patch: TransactionPatch = {};

  if (input.amountMinor !== undefined) patch.amountMinor = input.amountMinor;
  if (input.date) patch.date = input.date;
  if (input.memo !== undefined) patch.memo = input.memo.trim();
  if (input.status) patch.status = input.status;
  if (input.excluded !== undefined) patch.excluded = input.excluded;
  if (input.needsReview !== undefined) patch.needsReview = input.needsReview;

  return patch;
};

const standardPatch = (input: Partial<StandardInput>): TransactionPatch => ({
  ...referencePatch(input),
  ...fieldPatch(input),
});

const ownedPatch = async (
  tx: DbOrTx,
  userId: string,
  existing: TransactionRecord,
  input: Partial<StandardInput>
): Promise<TransactionPatch> => {
  const patch = standardPatch(input);

  if (input.accountId && input.accountId !== existing.accountId) {
    const account = await ownedAccount(tx, userId, input.accountId);

    patch.accountId = account.id;
    patch.currency = account.currency;
  }

  if (input.categoryId) await assertCategory(tx, userId, input.categoryId);
  if (input.payeeId) await assertPayee(tx, userId, input.payeeId);

  return patch;
};

const learnPayeeCategory = async (
  { db, payeeService }: LedgerContext,
  userId: string,
  row: TransactionRecord
): Promise<TransactionRow> => {
  if (row.payeeId && row.categoryId) {
    await payeeService.learnDefaultCategory(userId, row.payeeId);
  }

  return get(db, userId, row.id);
};

const assertNotTransferLeg = (row: TransactionRecord): void => {
  if (row.transferId) conflict('This row is a transfer leg; use the transfer endpoints');
};

const deletedTransaction = async (tx: DbOrTx, userId: string, id: string) => {
  const [row] = await tx
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.userId, userId),
        isNotNull(transactions.deletedAt)
      )
    )
    .for('update');

  return row ?? notFound('Deleted transaction');
};

const liveAccount = async (tx: DbOrTx, userId: string, accountId: string) => {
  const [account] = await tx
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.deletedAt))
    );

  if (!account) conflict('Restore the account of this transaction first');
};

const restoredCategoryPatch = async (
  tx: DbOrTx,
  row: TransactionRecord
): Promise<TransactionPatch> => {
  if (!row.categoryId) return {};

  const [category] = await tx
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, row.categoryId), isNull(categories.archivedAt)));

  return category ? {} : { categoryId: null, needsReview: true };
};

const splitPatch = (lines: SplitInput[], input: Partial<StandardInput>) => ({
  ...input,
  categoryId: null,
  needsReview: false,
  splits: lines,
});

const applyNewSplits = async (
  tx: DbOrTx,
  userId: string,
  existing: TransactionRecord,
  input: Partial<StandardInput>
): Promise<Partial<StandardInput>> => {
  const lines = input.splits ?? [];

  if (!lines.length) {
    await removeSplits(tx, [existing.id]);

    return { ...input, categoryId: input.categoryId ?? null };
  }

  assertSplitLines(input.amountMinor ?? Number(existing.amountMinor), lines);
  await assertSplitCategories(tx, userId, lines);
  await replaceSplits(tx, userId, existing.id, lines);

  return splitPatch(lines, input);
};

const keepExistingSplit = async (
  tx: DbOrTx,
  existing: TransactionRecord,
  input: Partial<StandardInput>
): Promise<Partial<StandardInput>> => {
  if (input.categoryId) {
    await removeSplits(tx, [existing.id]);

    return input;
  }

  if (input.amountMinor !== undefined && input.amountMinor !== Number(existing.amountMinor)) {
    throw new ServiceError('Change the split lines together with the amount');
  }

  if (input.categoryId !== null) return input;

  return {
    ...input,
    categoryId: undefined,
    needsReview: undefined,
  };
};

const applySplitChanges = async (
  tx: DbOrTx,
  userId: string,
  existing: TransactionRecord,
  input: Partial<StandardInput>
): Promise<Partial<StandardInput>> => {
  if (input.splits !== undefined) return applyNewSplits(tx, userId, existing, input);
  if (await hasLiveSplits(tx, existing.id)) return keepExistingSplit(tx, existing, input);

  return input;
};

export const createStandard = async (
  context: LedgerContext,
  userId: string,
  input: StandardInput
): Promise<TransactionRow> => {
  const { db } = context;

  assertDate(input.date);
  assertNonZeroAmount(input.amountMinor);

  const lines = input.splits?.length ? input.splits : undefined;

  if (lines) assertSplitLines(input.amountMinor, lines);

  const row = await db.transaction(async tx => {
    const account = await ownedAccount(tx, userId, input.accountId);

    if (input.categoryId && !lines) await assertCategory(tx, userId, input.categoryId);
    if (input.payeeId) await assertPayee(tx, userId, input.payeeId);
    if (lines) await assertSplitCategories(tx, userId, lines);

    const values = standardInsertValues(userId, account, input);

    const [created] = await tx
      .insert(transactions)
      .values(
        lines
          ? {
              ...values,
              categoryId: null,
              needsReview: false,
            }
          : values
      )
      .returning();

    if (lines) await replaceSplits(tx, userId, created.id, lines);
    await markTemplateUsed(tx, userId, input.templateId);

    return created;
  });

  return learnPayeeCategory(context, userId, row);
};

export const updateStandard = async (
  context: LedgerContext,
  userId: string,
  id: string,
  input: Partial<StandardInput>
): Promise<TransactionRow> => {
  const { db } = context;

  if (input.date) assertDate(input.date);
  if (input.amountMinor !== undefined) assertNonZeroAmount(input.amountMinor);

  const row = await db.transaction(async tx => {
    const existing = await ownedTransaction(tx, userId, id);

    assertEditable(existing, input);

    const effective = await applySplitChanges(tx, userId, existing, input);
    const patch = await ownedPatch(tx, userId, existing, effective);

    if (!Object.keys(patch).length) return existing;

    const [updated] = await tx
      .update(transactions)
      .set(patch)
      .where(eq(transactions.id, id))
      .returning();

    return updated;
  });

  return learnPayeeCategory(context, userId, row);
};

export const remove = async (db: Db, userId: string, id: string): Promise<void> => {
  await db.transaction(async tx => {
    const existing = await ownedTransaction(tx, userId, id);

    assertNotTransferLeg(existing);
    await tx.update(transactions).set({ deletedAt: new Date() }).where(eq(transactions.id, id));
  });
};

export const restore = async (db: Db, userId: string, id: string): Promise<TransactionRow> => {
  try {
    await db.transaction(async tx => {
      const existing = await deletedTransaction(tx, userId, id);

      assertNotTransferLeg(existing);
      await liveAccount(tx, userId, existing.accountId);

      const linesCleared = await uncategorizeArchivedLines(tx, id);

      await tx
        .update(transactions)
        .set({
          ...(await restoredCategoryPatch(tx, existing)),
          ...(linesCleared ? { needsReview: true } : {}),
          deletedAt: null,
        })
        .where(eq(transactions.id, id));
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      conflict('The same bank row was imported again after this one was deleted');
    }

    throw error;
  }

  return get(db, userId, id);
};
