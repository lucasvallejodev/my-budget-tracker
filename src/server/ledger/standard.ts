import { and, eq } from 'drizzle-orm';

import { transactions } from '@/db/schema';

import type { Db, DbOrTx } from '../db';
import type { createPayeeService } from '../payees/service';
import {
  assertCategory,
  assertDate,
  assertEditable,
  assertNonZeroAmount,
  assertPayee,
  ownedAccount,
  ownedTransaction,
} from './guards';
import type { StandardInput, TransactionPatch, TransactionRecord } from './types';

type PayeeService = ReturnType<typeof createPayeeService>;

export type LedgerContext = {
  db: Db;
  payeeService: PayeeService;
};

type Account = Awaited<ReturnType<typeof ownedAccount>>;

const standardInsertValues = (
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
  payeeService: PayeeService,
  userId: string,
  row: TransactionRecord
) => {
  if (row.payeeId && row.categoryId) {
    await payeeService.learnDefaultCategory(userId, row.payeeId);
  }

  return row;
};

export const createStandard = async (
  { db, payeeService }: LedgerContext,
  userId: string,
  input: StandardInput
) => {
  assertDate(input.date);
  assertNonZeroAmount(input.amountMinor);

  const row = await db.transaction(async tx => {
    const account = await ownedAccount(tx, userId, input.accountId);

    if (input.categoryId) await assertCategory(tx, userId, input.categoryId);
    if (input.payeeId) await assertPayee(tx, userId, input.payeeId);

    const [created] = await tx
      .insert(transactions)
      .values(standardInsertValues(userId, account, input))
      .returning();

    return created;
  });

  return learnPayeeCategory(payeeService, userId, row);
};

export const updateStandard = async (
  { db, payeeService }: LedgerContext,
  userId: string,
  id: string,
  input: Partial<StandardInput>
) => {
  if (input.date) assertDate(input.date);
  if (input.amountMinor !== undefined) assertNonZeroAmount(input.amountMinor);

  const row = await db.transaction(async tx => {
    const existing = await ownedTransaction(tx, userId, id);

    assertEditable(existing, input);

    const patch = await ownedPatch(tx, userId, existing, input);

    const [updated] = await tx
      .update(transactions)
      .set(patch)
      .where(eq(transactions.id, id))
      .returning();

    return updated;
  });

  return learnPayeeCategory(payeeService, userId, row);
};

export const remove = async (db: Db, userId: string, id: string): Promise<void> => {
  await db.transaction(async tx => {
    const existing = await ownedTransaction(tx, userId, id);
    const now = new Date();

    if (existing.transferId) {
      await tx
        .update(transactions)
        .set({ deletedAt: now })
        .where(
          and(eq(transactions.transferId, existing.transferId), eq(transactions.userId, userId))
        );
    } else {
      await tx.update(transactions).set({ deletedAt: now }).where(eq(transactions.id, id));
    }
  });
};

export const setStatus = async (
  db: Db,
  userId: string,
  id: string,
  status: TransactionRecord['status']
): Promise<void> => {
  await db.transaction(async tx => {
    const existing = await ownedTransaction(tx, userId, id);

    const target = existing.transferId
      ? and(eq(transactions.transferId, existing.transferId), eq(transactions.userId, userId))
      : eq(transactions.id, id);

    await tx.update(transactions).set({ status }).where(target);
  });
};
